"""
escalation_engine.py
--------------------
Determines the follow-up stage, tone, and subject prefix
for a given invoice based on days overdue.

Escalation Matrix (from Task 2 spec):
  Stage 1 :  1–7  days overdue → Warm & Friendly
  Stage 2 :  8–14 days overdue → Polite but Firm
  Stage 3 : 15–21 days overdue → Formal & Serious
  Stage 4 : 22–30 days overdue → Stern & Urgent
  Stage 5 : 30+  days overdue → FLAG for Legal (no auto-email)
"""

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class EscalationStage:
    stage_number: int       # 0 = not overdue, 1-4 = auto-email, 5 = escalated
    label: str              # human-readable label
    tone: str               # tone descriptor
    cta: str                # call-to-action instruction
    subject_prefix: str     # email subject prefix
    auto_send: bool         # False for stage 5


# ──────────────────────────────────────────────────────
# Stage definitions
# ──────────────────────────────────────────────────────
STAGES: dict[int, EscalationStage] = {
    0: EscalationStage(
        stage_number=0,
        label="Not Overdue",
        tone="N/A",
        cta="N/A",
        subject_prefix="",
        auto_send=False,
    ),
    1: EscalationStage(
        stage_number=1,
        label="Stage 1 — Warm & Friendly",
        tone="Warm & Friendly",
        cta="Pay now via the link below / bank transfer details enclosed",
        subject_prefix="Quick Reminder",
        auto_send=True,
    ),
    2: EscalationStage(
        stage_number=2,
        label="Stage 2 — Polite but Firm",
        tone="Polite but Firm",
        cta="Please confirm your payment date by replying to this email",
        subject_prefix="Payment Pending",
        auto_send=True,
    ),
    3: EscalationStage(
        stage_number=3,
        label="Stage 3 — Formal & Serious",
        tone="Formal & Serious",
        cta="Respond within 48 hours to avoid impact on your credit terms",
        subject_prefix="IMPORTANT: Outstanding Payment",
        auto_send=True,
    ),
    4: EscalationStage(
        stage_number=4,
        label="Stage 4 — Stern & Urgent",
        tone="Stern & Urgent",
        cta="Remit payment immediately or contact us within 24 hours",
        subject_prefix="FINAL NOTICE",
        auto_send=True,
    ),
    5: EscalationStage(
        stage_number=5,
        label="Escalated — Legal Review",
        tone="Legal Review",
        cta="Assign to Finance Manager / Legal team",
        subject_prefix="",
        auto_send=False,  # ← no automatic email at this stage
    ),
}


def get_stage(days_overdue: int) -> EscalationStage:
    """
    Return the EscalationStage for a given number of days overdue.

    Args:
        days_overdue: Integer. Negative or zero means not yet overdue.

    Returns:
        EscalationStage dataclass instance.
    """
    if days_overdue <= 0:
        return STAGES[0]
    elif days_overdue <= 7:
        return STAGES[1]
    elif days_overdue <= 14:
        return STAGES[2]
    elif days_overdue <= 21:
        return STAGES[3]
    elif days_overdue <= 30:
        return STAGES[4]
    else:
        return STAGES[5]


def compute_days_overdue(due_date: date) -> int:
    """Return how many days past due_date today is. Negative = not yet due."""
    return (date.today() - due_date).days


def build_subject(stage: EscalationStage, invoice_no: str,
                  amount: float, currency: str = "INR") -> str:
    """
    Build a personalised email subject line.

    Examples
    --------
    Stage 1 → "Quick Reminder – Invoice #INV-2024-001 | ₹45,000 Due"
    Stage 4 → "FINAL NOTICE – Invoice #INV-2024-001 – Immediate Action Required"
    """
    symbol = "₹" if currency.upper() == "INR" else currency
    amt_str = f"{symbol}{amount:,.0f}"

    if stage.stage_number == 1:
        return f"{stage.subject_prefix} – Invoice #{invoice_no} | {amt_str} Due"
    elif stage.stage_number == 2:
        return f"{stage.subject_prefix} – Invoice #{invoice_no} ({amt_str})"
    elif stage.stage_number == 3:
        return (
            f"{stage.subject_prefix} – Invoice #{invoice_no} "
            f"({stage.stage_number * 7} Days Overdue)"
        )
    elif stage.stage_number == 4:
        return f"{stage.subject_prefix} – Invoice #{invoice_no} – Immediate Action Required"
    else:
        return f"Invoice #{invoice_no} – Action Required"
