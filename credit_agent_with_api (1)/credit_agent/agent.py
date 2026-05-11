"""
agent.py
--------
Main orchestrator for the Finance Credit Follow-Up Email Agent.
Uses Groq API (Llama 3.3 70B) for email generation.

Workflow
--------
1. Load overdue invoices from CSV / Excel / SQLite.
2. Print a portfolio summary.
3. For each overdue invoice:
     Stage 1-4 → generate personalised email via Groq/Llama 3.3.
     Stage 5   → flag for legal/finance team; no auto-email.
4. Send / simulate sending via email_sender.
5. Log every action to SQLite audit trail.
6. Print run summary.

Run
---
    python agent.py --source sample_data.csv          # dry-run (safe default)
    python agent.py --source sample_data.csv --live   # actually send emails

Environment
-----------
    GROQ_API_KEY  → required (from .env)
    SEND_MODE     → "dry_run" (default) | "live"
"""

import argparse
import logging
import os
import sys
import uuid
from datetime import datetime

from dotenv import load_dotenv
load_dotenv()

from audit_logger import AuditLogger
from data_ingestion import load_invoices, summary_report
from email_generator import EmailGenerator, EmailGenerationError
from email_sender import send_email
from escalation_engine import get_stage

# ── Logging ───────────────────────────────────────────────────────────────────
os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("logs/agent.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)


def run_agent(
    source: str,
    dry_run: bool = True,
    model: str = "llama-3.3-70b-versatile",
    table: str = "invoices",
    run_id: str | None = None,
) -> dict:
    """Execute the full credit follow-up agent workflow."""
    run_id = run_id or str(uuid.uuid4())[:8]
    start  = datetime.now()

    logger.info("=" * 60)
    logger.info("Credit Follow-Up Agent  |  Run ID: %s", run_id)
    logger.info("Mode: %s  |  Model: %s", "DRY RUN" if dry_run else "LIVE SEND", model)
    logger.info("=" * 60)

    # ── 1. Load & summarise ───────────────────────────────────────────────────
    try:
        df = load_invoices(source, table=table)
    except Exception as exc:
        logger.error("Failed to load data: %s", exc)
        return {"error": str(exc)}

    if df.empty:
        logger.info("No overdue invoices found.")
        return {"generated": 0, "sent": 0, "dry_run": 0, "failed": 0, "escalated": 0}

    print(summary_report(df))

    # ── 2. Init services ──────────────────────────────────────────────────────
    generator = EmailGenerator(model=model)
    audit     = AuditLogger("logs/audit.db")
    stats     = {"generated": 0, "sent": 0, "dry_run": 0, "failed": 0, "escalated": 0}

    # ── 3. Process each invoice ───────────────────────────────────────────────
    for inv in df.to_dict("records"):
        inv["_run_id"] = run_id
        stage  = get_stage(int(inv["days_overdue"]))
        inv_id = inv["invoice_no"]

        # Stage 5 → escalate, skip email
        if stage.stage_number == 5:
            logger.warning("[ESCALATED] %s  (%s days)  → Finance/Legal review", inv_id, inv["days_overdue"])
            audit.log_escalation(inv)
            stats["escalated"] += 1
            continue

        # Stages 1-4 → generate
        logger.info("[GENERATING] %s | %s | Stage %d", inv_id, inv.get("client_name"), stage.stage_number)
        try:
            email = generator.generate(inv)
            stats["generated"] += 1
        except EmailGenerationError as exc:
            logger.error("[GEN FAILED] %s: %s", inv_id, exc)
            audit.log_failure(inv, str(exc), model_used=model)
            stats["failed"] += 1
            continue

        # Send / dry-run
        status = send_email(
            to_email=inv["contact_email"],
            subject=email.subject,
            body=email.body,
            dry_run=dry_run,
        )
        audit.log_email(inv, email, send_status=status, model_used=model)

        if status == "DRY_RUN":
            stats["dry_run"] += 1
            print(f"\n{'─'*60}")
            print(f"[DRY RUN]  {inv_id}  |  Stage {stage.stage_number}  |  {stage.tone}")
            print(f"To      : {inv['contact_email']}")
            print(f"Subject : {email.subject}\n")
            print(email.body)
            print(f"{'─'*60}")
        elif status == "SENT":
            stats["sent"] += 1
        else:
            stats["failed"] += 1

    # ── 4. Summary ────────────────────────────────────────────────────────────
    elapsed = (datetime.now() - start).total_seconds()
    print(f"\n{'='*60}")
    print(f"  RUN COMPLETE  |  {run_id}  |  {elapsed:.1f}s")
    for k, v in stats.items():
        print(f"  {k.capitalize():<12}: {v}")
    print(f"{'='*60}\n")

    logger.info("Audit stats: %s", audit.stats())
    return stats


# ── CLI ───────────────────────────────────────────────────────────────────────
def main() -> None:
    parser = argparse.ArgumentParser(description="Finance Credit Follow-Up Email Agent (Groq)")
    parser.add_argument("--source",  default="sample_data.csv",
                        help="CSV / Excel / SQLite path (default: sample_data.csv)")
    parser.add_argument("--live",    action="store_true", default=False,
                        help="Actually send emails (requires SEND_MODE=live in .env)")
    parser.add_argument("--model",   default="llama-3.3-70b-versatile",
                        help="Groq model ID (default: llama-3.3-70b-versatile)")
    parser.add_argument("--table",   default="invoices",
                        help="SQLite table name (default: invoices)")
    args = parser.parse_args()

    if not os.getenv("GROQ_API_KEY"):
        print("ERROR: GROQ_API_KEY is not set. Add it to your .env file.")
        print("Get a free key at: https://console.groq.com")
        sys.exit(1)

    run_agent(
        source=args.source,
        dry_run=not args.live,
        model=args.model,
        table=args.table,
    )


if __name__ == "__main__":
    main()
