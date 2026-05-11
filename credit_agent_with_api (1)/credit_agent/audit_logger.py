"""
audit_logger.py
---------------
Persistent audit trail for every email generated/sent by the agent.

Storage: SQLite database at logs/audit.db (configurable).

Every record captures:
  - timestamp (UTC ISO-8601)
  - invoice_no, client_name, company
  - amount, currency, days_overdue
  - stage_number, tone_used
  - subject, body (of the generated email)
  - send_status: DRY_RUN | SENT | FAILED | ESCALATED
  - error_message (if failed)
  - model_used (Claude model version)

Security notes:
  - No plaintext email addresses stored in the audit log (they're masked).
  - SQLite WAL mode enabled for concurrent read-safety.
"""

import logging
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

_CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS audit_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp_utc   TEXT    NOT NULL,
    invoice_no      TEXT    NOT NULL,
    client_name     TEXT    NOT NULL,
    company         TEXT,
    amount          REAL,
    currency        TEXT    DEFAULT 'INR',
    days_overdue    INTEGER,
    stage_number    INTEGER,
    tone_used       TEXT,
    subject         TEXT,
    body            TEXT,
    recipient_masked TEXT,
    send_status     TEXT    NOT NULL,   -- DRY_RUN | SENT | FAILED | ESCALATED
    error_message   TEXT,
    model_used      TEXT,
    run_id          TEXT               -- optional batch run identifier
)
"""

_INSERT_SQL = """
INSERT INTO audit_log (
    timestamp_utc, invoice_no, client_name, company,
    amount, currency, days_overdue, stage_number,
    tone_used, subject, body, recipient_masked,
    send_status, error_message, model_used, run_id
) VALUES (
    :timestamp_utc, :invoice_no, :client_name, :company,
    :amount, :currency, :days_overdue, :stage_number,
    :tone_used, :subject, :body, :recipient_masked,
    :send_status, :error_message, :model_used, :run_id
)
"""


def _mask_email(email: str) -> str:
    parts = email.split("@")
    if len(parts) != 2:
        return "***"
    return parts[0][0] + "***@" + parts[1]


class AuditLogger:
    """
    Thread-safe SQLite-backed audit logger.

    Usage
    -----
        logger = AuditLogger("logs/audit.db")
        logger.log_email(invoice, generated_email, send_status="SENT")
        logger.log_escalation(invoice)
        logger.log_failure(invoice, error_message)

        df = logger.to_dataframe()   # query all records as pandas DataFrame
    """

    def __init__(self, db_path: str = "logs/audit.db") -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    @contextmanager
    def _conn(self):
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def _init_db(self) -> None:
        with self._conn() as conn:
            conn.execute(_CREATE_TABLE_SQL)
        logger.debug("Audit DB ready at %s", self.db_path)

    def _base_record(self, invoice: dict) -> dict:
        return {
            "timestamp_utc":  datetime.now(timezone.utc).isoformat(),
            "invoice_no":     invoice.get("invoice_no", "UNKNOWN"),
            "client_name":    invoice.get("client_name", "UNKNOWN"),
            "company":        invoice.get("company", ""),
            "amount":         float(invoice.get("amount", 0)),
            "currency":       invoice.get("currency", "INR"),
            "days_overdue":   int(invoice.get("days_overdue", 0)),
            "stage_number":   int(invoice.get("stage_number", 0)),
            "tone_used":      invoice.get("tone", ""),
            "recipient_masked": _mask_email(str(invoice.get("contact_email", ""))),
            "run_id":         invoice.get("_run_id", None),
        }

    def log_email(
        self,
        invoice: dict,
        generated_email,           # GeneratedEmail from email_generator
        send_status: str = "SENT", # "SENT" or "DRY_RUN"
        model_used: str = "claude-sonnet-4-20250514",
    ) -> None:
        """Log a successfully generated (and optionally sent) email."""
        record = {
            **self._base_record(invoice),
            "subject":       generated_email.subject,
            "body":          generated_email.body,
            "tone_used":     generated_email.tone_used,
            "send_status":   send_status,
            "error_message": None,
            "model_used":    model_used,
        }
        with self._conn() as conn:
            conn.execute(_INSERT_SQL, record)
        logger.info("[AUDIT] %s | %s | %s | %s",
                    record["invoice_no"], send_status, record["tone_used"],
                    record["recipient_masked"])

    def log_failure(
        self,
        invoice: dict,
        error_message: str,
        model_used: str = "claude-sonnet-4-20250514",
    ) -> None:
        """Log a failed email generation attempt."""
        record = {
            **self._base_record(invoice),
            "subject":       None,
            "body":          None,
            "send_status":   "FAILED",
            "error_message": error_message,
            "model_used":    model_used,
        }
        with self._conn() as conn:
            conn.execute(_INSERT_SQL, record)
        logger.warning("[AUDIT-FAIL] %s | %s", record["invoice_no"], error_message)

    def log_escalation(self, invoice: dict) -> None:
        """Log a record flagged for legal/manual escalation (stage 5)."""
        record = {
            **self._base_record(invoice),
            "subject":       None,
            "body":          None,
            "stage_number":  5,
            "send_status":   "ESCALATED",
            "error_message": f"Invoice {invoice.get('days_overdue',0)} days overdue — "
                             f"flagged for Finance Manager / Legal team review.",
            "model_used":    None,
        }
        with self._conn() as conn:
            conn.execute(_INSERT_SQL, record)
        logger.warning("[ESCALATED] %s | %s days overdue",
                       record["invoice_no"], record["days_overdue"])

    def to_dataframe(self):
        """Return entire audit log as a pandas DataFrame."""
        import pandas as pd
        with self._conn() as conn:
            return pd.read_sql_query("SELECT * FROM audit_log ORDER BY id DESC", conn)

    def recent(self, n: int = 20) -> list[dict]:
        """Return n most recent audit entries as list of dicts."""
        with self._conn() as conn:
            rows = conn.execute(
                "SELECT * FROM audit_log ORDER BY id DESC LIMIT ?", (n,)
            ).fetchall()
            return [dict(r) for r in rows]

    def stats(self) -> dict:
        """Return summary counts by send_status."""
        with self._conn() as conn:
            rows = conn.execute(
                "SELECT send_status, COUNT(*) as cnt FROM audit_log GROUP BY send_status"
            ).fetchall()
            return {r["send_status"]: r["cnt"] for r in rows}
