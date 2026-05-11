# Finance Credit Follow-Up Email Agent

> **Task 2** — AI Enablement Internship · End-to-end implementation

An AI agent that automatically generates and (optionally) sends personalised
follow-up emails for overdue invoices, escalating tone progressively based on
days past due. Powered by **Groq API + Llama 3.3 70B**.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Agent Flow](#agent-flow)
4. [Tone Escalation Matrix](#tone-escalation-matrix)
5. [Tech Stack & Decision Log](#tech-stack--decision-log)
6. [Security Mitigations](#security-mitigations)
7. [Setup & Installation](#setup--installation)
8. [Running the Agent](#running-the-agent)
9. [Project Structure](#project-structure)
10. [Sample Output](#sample-output)

---

## Project Overview

Finance teams spend significant time chasing overdue payments. Manual follow-ups
are inconsistent in tone and timing. This agent:

- Reads overdue invoices from **CSV / Excel / SQLite**
- Determines the correct follow-up stage (1–4) or legal escalation flag (5)
- Uses **Groq + Llama 3.3 70B** to generate personalised, stage-appropriate emails
- Sends via **SMTP / SendGrid** — or logs them safely in dry-run mode
- Maintains a full **SQLite audit trail** of every action
- Runs automatically on a configurable **weekday cron schedule**

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   Credit Follow-Up Agent                    │
│                                                             │
│  ┌──────────────┐   ┌────────────────────────────────────┐ │
│  │  Data Source │──▶│  data_ingestion.py                 │ │
│  │  CSV/Excel/  │   │  Loads invoices, computes          │ │
│  │  SQLite      │   │  days_overdue, assigns stage       │ │
│  └──────────────┘   └──────────────┬───────────────────  ┘ │
│                                    │                        │
│                     ┌──────────────▼──────────────────────┐ │
│                     │  escalation_engine.py               │ │
│                     │  Stage 1-4 → auto email             │ │
│                     │  Stage 5   → legal escalation flag  │ │
│                     └──────────────┬────────────────────  ┘ │
│                                    │                        │
│                     ┌──────────────▼──────────────────────┐ │
│                     │  email_generator.py                 │ │
│                     │  Groq API (Llama 3.3 70B)           │ │
│                     │  JSON mode + Pydantic validation    │ │
│                     └──────────────┬────────────────────  ┘ │
│                                    │                        │
│            ┌───────────────────────▼──────────────────────┐ │
│            │  email_sender.py                             │ │
│            │  DRY RUN (default) | SMTP | SendGrid         │ │
│            └───────────────────────┬──────────────────────┘ │
│                                    │                        │
│                     ┌──────────────▼──────────────────────┐ │
│                     │  audit_logger.py                    │ │
│                     │  SQLite — every action logged       │ │
│                     └─────────────────────────────────────┘ │
│                                                             │
│  scheduler.py  →  APScheduler cron  →  agent.py  (daily)   │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent Flow

| Step | Module | Action |
|------|--------|--------|
| 1 | `data_ingestion.py` | Load CSV/Excel/SQLite, parse dates, compute days overdue |
| 2 | `escalation_engine.py` | Assign stage 1–5 per invoice |
| 3 | `email_generator.py` | Call Groq API → JSON output → Pydantic validation |
| 4 | `email_sender.py` | SMTP/SendGrid send OR dry-run log |
| 5 | `audit_logger.py` | Write full record to SQLite |
| 6 | `agent.py` | Print run summary |
| ∞ | `scheduler.py` | APScheduler triggers agent on weekdays at 09:00 IST |

---

## Tone Escalation Matrix

| Stage | Trigger | Tone | Key Message | CTA |
|-------|---------|------|-------------|-----|
| **Stage 1** | 1–7 days overdue | Warm & Friendly | Gentle reminder, assume oversight | Pay now link |
| **Stage 2** | 8–14 days overdue | Polite but Firm | Payment still pending | Confirm payment date |
| **Stage 3** | 15–21 days overdue | Formal & Serious | Escalating concern, mention impact | Respond within 48 hrs |
| **Stage 4** | 22–30 days overdue | Stern & Urgent | Final reminder before escalation | Pay immediately or call |
| **Stage 5** | 30+ days overdue | ⚠️ Legal Flag | No auto-email — human review | Assign to Finance Manager |

---

## Tech Stack & Decision Log

### LLM: Groq API — `llama-3.3-70b-versatile`

| Criterion | Groq + Llama 3.3 70B | Claude Sonnet | GPT-4o |
|-----------|----------------------|---------------|--------|
| Speed | ~250 tokens/sec (fastest) | ~80 tokens/sec | ~90 tokens/sec |
| Cost | Free tier available | $15/1M out | $15/1M out |
| JSON mode | Yes (native) | Yes | Yes |
| Context window | 128K | 200K | 128K |
| Instruction following | Excellent | Excellent | Excellent |

**Chosen because:** Groq offers a free tier ideal for internship prototyping,
with best-in-class inference speed. Llama 3.3 70B has excellent instruction
following and produces well-structured professional emails.

### Agent Framework: Direct SDK (no LangChain)

This is a **linear pipeline** — not a multi-agent ReAct loop. LangChain would
add 30+ transitive dependencies for zero architectural benefit here.

**Pattern used:** Plan-and-Execute (sequential steps: load → stage → generate → send → log).

### Prompt Design

- System prompt enforces JSON-only output with explicit schema
- User prompt injects all invoice fields after sanitisation
- Tone guidance changes per stage number (injected at runtime)
- `response_format={"type": "json_object"}` forces JSON mode at the API level
- Pydantic validates all required fields before email is used

---

## Security Mitigations

| Risk | Mitigation | File |
|------|-----------|------|
| **Prompt Injection** | `_sanitise()` strips control chars and known injection patterns (`ignore previous`, `<system>` etc.) | `email_generator.py` |
| **PII in Logs** | Email addresses masked as `r***@domain.com` in all log output | `email_generator.py`, `audit_logger.py` |
| **API Key Exposure** | Keys loaded from `.env` via `python-dotenv`. `.env` in `.gitignore`. Only `.env.example` committed. | `.env.example`, `agent.py` |
| **Hallucination Risk** | JSON mode + Pydantic validation. Missing/empty fields raise `EmailGenerationError` — no broken email sent. | `email_generator.py` |
| **Runaway Sends** | `BATCH_SEND_LIMIT` env var caps emails per run. `SEND_MODE=dry_run` is the hard default. | `email_sender.py` |
| **Unauthorised Access** | Agent runs as CLI / scheduled job — no exposed HTTP endpoint. Add API key auth if wrapping in FastAPI. | Design decision |
| **Email Spoofing** | Sender domain validated before live send. README instructs SPF/DKIM/DMARC setup. | `email_sender.py` |

---

## Setup & Installation

### 1. Clone and install

```bash
git clone https://github.com/your-username/credit-followup-agent.git
cd credit-followup-agent

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Open .env and set your GROQ_API_KEY
# Get a free key at: https://console.groq.com
```

### 3. Prepare data

Use `sample_data.csv` as a template.

**Required columns:** `invoice_no, client_name, company, amount, due_date, contact_email`

**Optional:** `currency, follow_up_count, payment_link, account_manager`

---

## Running the Agent

```bash
# Dry run — safe, no emails sent (default)
python agent.py --source sample_data.csv

# Live send (set SEND_MODE=live in .env first)
python agent.py --source sample_data.csv --live

# Excel source
python agent.py --source invoices.xlsx

# SQLite source
python agent.py --source invoices.db --table pending_invoices

# Scheduled (weekdays 09:00 IST)
python scheduler.py

# Single immediate run via scheduler
python scheduler.py --run-now
```

### View audit log

```python
from audit_logger import AuditLogger
log = AuditLogger()
print(log.to_dataframe())
print(log.stats())
```

---

## Project Structure

```
credit-followup-agent/
├── agent.py              # Main orchestrator
├── escalation_engine.py  # Stage / tone logic
├── data_ingestion.py     # CSV / Excel / SQLite loader
├── email_generator.py    # Groq API + Pydantic validation
├── email_sender.py       # SMTP / SendGrid / dry-run
├── audit_logger.py       # SQLite audit trail
├── scheduler.py          # APScheduler weekday cron
├── sample_data.csv       # 8 test invoices across all stages
├── requirements.txt
├── .env.example
├── .gitignore
├── logs/
│   ├── audit.db          # Auto-created SQLite audit log
│   └── agent.log         # Text log
└── README.md
```

---

## Sample Output

```
==================================================
  OVERDUE INVOICE SUMMARY — 2026-05-10
==================================================
  Total overdue invoices : 7
  Total outstanding      : Rs.782,800
  Stage 1 (Warm & Friendly)    : 2 invoices  Rs.79,800
  Stage 2 (Polite but Firm)    : 1 invoices  Rs.128,500
  Stage 3 (Formal & Serious)   : 1 invoices  Rs.67,200
  Stage 4 (Stern & Urgent)     : 2 invoices  Rs.366,000
  Stage 5 (Escalated — Legal)  : 1 invoices  Rs.89,000
==================================================

────────────────────────────────────────────────────────────
[DRY RUN]  INV-2024-001  |  Stage 1  |  Warm & Friendly
To      : rajesh@kapoorindustries.com
Subject : Quick Reminder – Invoice #INV-2024-001 | Rs.45,000 Due

Hi Rajesh,

Hope you're doing well! This is a friendly reminder that Invoice
#INV-2024-001 for Rs.45,000 was due on 3rd May 2026 (7 days ago).

If you've already processed this, please disregard this note.
Otherwise, you can settle it instantly here:
https://pay.acme.in/INV-2024-001

Thanks for your continued partnership, Rajesh!

Warm regards,
Accounts Receivable Team
Acme Finance Pvt Ltd | ar@acme.in | +91-22-4000-1234
────────────────────────────────────────────────────────────

==================================================
  RUN COMPLETE  |  a3f1b2c4  |  6.2s
  Generated   : 6
  Sent        : 0
  Dry_run     : 6
  Failed      : 0
  Escalated   : 1
==================================================
```

# Credit-followup-agent-