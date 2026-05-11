"""
data_ingestion.py
-----------------
Reads pending credit records from CSV / Excel / SQLite.
Enriches each record with days_overdue and escalation stage.

Supported formats
-----------------
  .csv   → pandas read_csv
  .xlsx  → pandas read_excel
  .xls   → pandas read_excel
  .db    → sqlite3 query (table name configurable)

Required columns (case-insensitive, flexible aliases):
  invoice_no | invoice_number | id
  client_name | client | debtor
  company | company_name | organisation
  amount | amount_due | balance
  currency (optional, defaults to INR)
  due_date | duedate | due date
  contact_email | email
  follow_up_count | followups | reminders_sent (optional, defaults to 0)
  payment_link | pay_link | payment_url (optional)
  account_manager | am (optional)
"""

import os
import sqlite3
import logging
from datetime import date, datetime
from pathlib import Path
from typing import Optional

import pandas as pd

from escalation_engine import EscalationStage, compute_days_overdue, get_stage

logger = logging.getLogger(__name__)

# ── Column alias map ──────────────────────────────────────────────────────────
_ALIAS: dict[str, list[str]] = {
    "invoice_no":      ["invoice_no", "invoice_number", "invoice", "id"],
    "client_name":     ["client_name", "client", "debtor", "name"],
    "company":         ["company", "company_name", "organisation", "organization"],
    "amount":          ["amount", "amount_due", "balance", "outstanding"],
    "currency":        ["currency", "ccy"],
    "due_date":        ["due_date", "duedate", "due date", "payment_due"],
    "contact_email":   ["contact_email", "email", "email_address"],
    "follow_up_count": ["follow_up_count", "followups", "reminders_sent", "followup_count"],
    "payment_link":    ["payment_link", "pay_link", "payment_url"],
    "account_manager": ["account_manager", "am", "relationship_manager"],
}


def _normalise_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Rename raw columns to canonical names using alias map."""
    cols_lower = {c.lower().strip(): c for c in df.columns}
    rename_map: dict[str, str] = {}

    for canonical, aliases in _ALIAS.items():
        for alias in aliases:
            if alias in cols_lower:
                rename_map[cols_lower[alias]] = canonical
                break

    df = df.rename(columns=rename_map)

    # Fill optional columns with defaults
    df["currency"]        = df.get("currency", pd.Series(["INR"] * len(df)))
    df["follow_up_count"] = df.get("follow_up_count", pd.Series([0] * len(df)))
    df["payment_link"]    = df.get("payment_link", pd.Series([""] * len(df)))
    df["account_manager"] = df.get("account_manager", pd.Series([""] * len(df)))

    return df


def _parse_date(val) -> Optional[date]:
    """Try several formats to parse a date value."""
    if isinstance(val, (date, datetime)):
        return val.date() if isinstance(val, datetime) else val
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(str(val).strip(), fmt).date()
        except ValueError:
            continue
    return None


def _enrich(df: pd.DataFrame) -> pd.DataFrame:
    """Add days_overdue, stage_number, and stage_label columns."""
    rows = []
    for _, row in df.iterrows():
        due = _parse_date(row["due_date"])
        if due is None:
            logger.warning("Skipping %s — invalid due_date '%s'", row.get("invoice_no"), row["due_date"])
            continue

        days_od = compute_days_overdue(due)
        stage: EscalationStage = get_stage(days_od)

        rows.append({
            **row.to_dict(),
            "due_date_parsed":  due,
            "days_overdue":     days_od,
            "stage_number":     stage.stage_number,
            "stage_label":      stage.label,
            "tone":             stage.tone,
            "auto_send":        stage.auto_send,
            "cta":              stage.cta,
        })

    return pd.DataFrame(rows)


# ── Public API ─────────────────────────────────────────────────────────────────

def load_from_csv(path: str) -> pd.DataFrame:
    """Load invoices from a CSV file."""
    df = pd.read_csv(path)
    df = _normalise_columns(df)
    return _enrich(df)


def load_from_excel(path: str, sheet_name: str = 0) -> pd.DataFrame:
    """Load invoices from an Excel file (.xlsx or .xls)."""
    df = pd.read_excel(path, sheet_name=sheet_name)
    df = _normalise_columns(df)
    return _enrich(df)


def load_from_sqlite(db_path: str, table: str = "invoices") -> pd.DataFrame:
    """Load invoices from a SQLite database table."""
    conn = sqlite3.connect(db_path)
    df = pd.read_sql_query(f"SELECT * FROM {table}", conn)  # noqa: S608
    conn.close()
    df = _normalise_columns(df)
    return _enrich(df)


def load_invoices(source: str, **kwargs) -> pd.DataFrame:
    """
    Auto-detect format and load invoices.

    Args:
        source: Path to CSV, Excel file, or SQLite database.
        **kwargs: Passed to the underlying loader (e.g. sheet_name, table).

    Returns:
        DataFrame with enriched invoice records (days_overdue, stage, etc.)
    """
    ext = Path(source).suffix.lower()
    if ext == ".csv":
        df = load_from_csv(source)
    elif ext in (".xlsx", ".xls"):
        df = load_from_excel(source, **kwargs)
    elif ext == ".db":
        df = load_from_sqlite(source, **kwargs)
    else:
        raise ValueError(f"Unsupported file format: {ext}")

    # Only return genuinely overdue records
    overdue = df[df["days_overdue"] > 0].copy()
    logger.info("Loaded %d overdue invoices from %s", len(overdue), source)
    return overdue


def get_overdue_by_stage(df: pd.DataFrame) -> dict[int, pd.DataFrame]:
    """Split overdue DataFrame into a dict keyed by stage number (1–5)."""
    return {sn: df[df["stage_number"] == sn] for sn in range(1, 6)}


def summary_report(df: pd.DataFrame) -> str:
    """Return a quick text summary of the overdue portfolio."""
    total_amt = df["amount"].sum()
    lines = [
        f"{'='*50}",
        f"  OVERDUE INVOICE SUMMARY — {date.today()}",
        f"{'='*50}",
        f"  Total overdue invoices : {len(df)}",
        f"  Total outstanding      : ₹{total_amt:,.0f}",
        "",
    ]
    for sn in range(1, 6):
        sub = df[df["stage_number"] == sn]
        if sub.empty:
            continue
        lines.append(
            f"  Stage {sn} ({sub.iloc[0]['stage_label']}) : "
            f"{len(sub)} invoices  ₹{sub['amount'].sum():,.0f}"
        )
    lines.append(f"{'='*50}")
    return "\n".join(lines)
