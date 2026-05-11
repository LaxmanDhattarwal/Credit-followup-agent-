"""
api_server.py
-------------
FastAPI server that exposes the credit follow-up agent data
as REST endpoints consumed by the Next.js dashboard.

Endpoints
---------
GET  /api/invoices      → all overdue invoices with stage info
GET  /api/audit         → full audit log from SQLite
GET  /api/stats         → portfolio summary + last run stats
GET  /api/emails        → generated email bodies keyed by invoice_no
POST /api/run-agent     → trigger a full agent run (dry_run or live)
GET  /api/health        → health check

Run
---
    pip install fastapi uvicorn python-dotenv
    uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload
"""

import os
import sqlite3
import threading
import uuid
from datetime import date, datetime
from typing import Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

# ── import your existing modules ──────────────────────────────────────────────
from data_ingestion import load_invoices, summary_report
from escalation_engine import compute_days_overdue, get_stage, STAGES
from audit_logger import AuditLogger

app = FastAPI(title="Credit Follow-Up Agent API", version="1.0.0")

# ── CORS — allow Next.js dev server ──────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_SOURCE = os.path.join(
    BASE_DIR,
    "sample_data.csv"
)

AUDIT_DB = "logs/audit.db"
AUDIT_DB     = "logs/audit.db"
_run_lock    = threading.Lock()
_last_run: dict = {}


# ── helpers ───────────────────────────────────────────────────────────────────
def _get_db():
    conn = sqlite3.connect(AUDIT_DB)
    conn.row_factory = sqlite3.Row
    return conn


def _invoice_to_dict(row: dict) -> dict:
    """Enrich a raw invoice row with stage info."""
    days = int(row.get("days_overdue", 0))
    sn   = int(row.get("stage_number", 0))
    stage_cfg = STAGES.get(sn, STAGES[1])
    return {
        "id":             row.get("invoice_no"),
        "client":         row.get("client_name"),
        "company":        row.get("company", ""),
        "amount":         float(row.get("amount", 0)),
        "currency":       row.get("currency", "INR"),
        "dueDate":        str(row.get("due_date_parsed", "")),
        "email":          row.get("contact_email", ""),
        "payLink":        row.get("payment_link", ""),
        "accountManager": row.get("account_manager", ""),
        "daysOverdue":    days,
        "stage":          sn,
        "stageLabel":     stage_cfg.label,
        "tone":           stage_cfg.tone,
        "followUpCount":  int(row.get("follow_up_count", 0)),
        "autoSend":       stage_cfg.auto_send,
    }


# ── GET /api/health ───────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


# ── GET /api/invoices ─────────────────────────────────────────────────────────
@app.get("/api/invoices")
def get_invoices():
    """Return all overdue invoices enriched with stage info."""
    try:
        df = load_invoices(DATA_SOURCE)
        rows = df.to_dict("records")
        return {"invoices": [_invoice_to_dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /api/audit ────────────────────────────────────────────────────────────
@app.get("/api/audit")
def get_audit(limit: int = 100):
    """Return recent audit log entries from SQLite."""
    try:
        conn = _get_db()
        rows = conn.execute(
            "SELECT * FROM audit_log ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        conn.close()
        return {"entries": [dict(r) for r in rows]}
    except Exception as e:
        # DB might not exist yet (no runs completed)
        return {"entries": []}


# ── GET /api/emails ───────────────────────────────────────────────────────────
@app.get("/api/emails")
def get_emails():
    """Return the most recent generated email body per invoice from audit log."""
    try:
        conn = _get_db()
        rows = conn.execute("""
            SELECT invoice_no, subject, body, tone_used, timestamp_utc,
                   send_status, model_used
            FROM audit_log
            WHERE body IS NOT NULL AND body != ''
            ORDER BY id DESC
        """).fetchall()
        conn.close()

        # Deduplicate — keep most recent per invoice
        seen = {}
        for r in rows:
            inv_no = r["invoice_no"]
            if inv_no not in seen:
                seen[inv_no] = {
                    "invoiceId":     inv_no,
                    "subject":       r["subject"] or "",
                    "body":          r["body"] or "",
                    "tone":          r["tone_used"] or "",
                    "generatedAt":   r["timestamp_utc"] or "",
                    "status":        r["send_status"] or "DRY_RUN",
                    "model":         r["model_used"] or "",
                }
        return {"emails": seen}
    except Exception as e:
        return {"emails": {}}


# ── GET /api/stats ────────────────────────────────────────────────────────────
@app.get("/api/stats")
def get_stats():
    """Return portfolio summary + last run statistics."""
    try:
        df = load_invoices(DATA_SOURCE)
        total_amt = float(df["amount"].sum())
        total_inv = len(df)

        by_stage = []
        for sn in range(1, 6):
            sub = df[df["stage_number"] == sn]
            if sub.empty:
                continue
            by_stage.append({
                "stage":  sn,
                "count":  len(sub),
                "amount": float(sub["amount"].sum()),
                "label":  STAGES[sn].label,
            })

        # Audit stats
        conn = _get_db()
        try:
            rows = conn.execute(
                "SELECT send_status, COUNT(*) as cnt FROM audit_log GROUP BY send_status"
            ).fetchall()
            audit_stats = {r["send_status"]: r["cnt"] for r in rows}

            # Last run info
            last = conn.execute(
                "SELECT run_id, timestamp_utc, model_used FROM audit_log ORDER BY id DESC LIMIT 1"
            ).fetchone()
        except Exception:
            audit_stats = {}
            last = None
        conn.close()

        return {
            "portfolio": {
                "totalInvoices":    total_inv,
                "totalOutstanding": total_amt,
                "byStage":          by_stage,
            },
            "auditStats":   audit_stats,
            "lastRun":      dict(last) if last else None,
            "lastRunFull":  _last_run,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /api/run-agent ───────────────────────────────────────────────────────
class RunRequest(BaseModel):
    dry_run: bool = True
    model:   str  = "llama-3.3-70b-versatile"
    source:  Optional[str] = None


@app.post("/api/run-agent")
def trigger_run(req: RunRequest, background_tasks: BackgroundTasks):
    """
    Trigger the credit follow-up agent in the background.
    Returns a run_id immediately; poll /api/audit for results.
    """
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(status_code=400, detail="GROQ_API_KEY not set in environment")

    if _run_lock.locked():
        raise HTTPException(status_code=409, detail="An agent run is already in progress")

    run_id = str(uuid.uuid4())[:8]
    source = req.source or DATA_SOURCE

    def _run():
        with _run_lock:
            global _last_run
            try:
                from agent import run_agent
                stats = run_agent(
                    source=source,
                    dry_run=req.dry_run,
                    model=req.model,
                    run_id=run_id,
                )
                _last_run = {
                    "runId":     run_id,
                    "timestamp": datetime.utcnow().isoformat(),
                    "mode":      "DRY_RUN" if req.dry_run else "LIVE",
                    "model":     req.model,
                    **stats,
                }
            except Exception as exc:
                _last_run = {"runId": run_id, "error": str(exc)}

    background_tasks.add_task(_run)
    return {"run_id": run_id, "status": "started", "dry_run": req.dry_run}


# ── GET /api/run-status ───────────────────────────────────────────────────────
@app.get("/api/run-status")
def run_status():
    """Check if a run is in progress and return last run result."""
    return {
        "running":  _run_lock.locked(),
        "last_run": _last_run,
    }


# ── entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)
