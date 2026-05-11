"""
email_generator.py  (GROQ VERSION)
------------------
Uses the Groq API (OpenAI-compatible) with Llama 3.3 70B to generate
personalised, stage-appropriate follow-up emails for overdue invoices.

Why Groq + Llama 3.3 70B?
  - Extremely fast inference (250+ tokens/sec)
  - Free tier available — ideal for internship / prototyping
  - OpenAI-compatible API -> easy to swap model later
  - 128K context window
  - Supports JSON mode natively

Security mitigations:
  - Input sanitisation  — user fields stripped of control chars &
    prompt-injection patterns before embedding in prompts.
  - Structured output   — JSON mode + Pydantic validation.
  - PII masking in logs — email masked in all log output.
  - Hallucination guard — missing/empty fields raise EmailGenerationError.
"""

import json
import logging
import os
import re
from typing import Optional

from openai import OpenAI
from pydantic import BaseModel, field_validator

from escalation_engine import EscalationStage, get_stage

logger = logging.getLogger(__name__)


def _get_groq_client() -> OpenAI:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "GROQ_API_KEY is not set. Add it to your .env file.\n"
            "Get a free key at: https://console.groq.com"
        )
    return OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")


# ── Pydantic validation model ─────────────────────────────────────────────────
class GeneratedEmail(BaseModel):
    subject: str
    body: str
    tone_used: str
    invoice_no: str
    client_name: str

    @field_validator("subject", "body")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field must not be empty")
        return v.strip()


class EmailGenerationError(Exception):
    pass


# ── Input sanitisation ────────────────────────────────────────────────────────
_INJECTION_PATTERN = re.compile(
    r"(ignore\s+previous|disregard\s+(all|above)|system\s*:|<\s*(system|user|assistant)\s*>)",
    re.IGNORECASE,
)

def _sanitise(value: str) -> str:
    value = re.sub(r"[\x00-\x08\x0b-\x1f\x7f]", "", str(value))
    if _INJECTION_PATTERN.search(value):
        logger.warning("Possible prompt injection detected — redacting field.")
        return "[REDACTED]"
    return value.strip()

def _mask_email(email: str) -> str:
    parts = email.split("@")
    return (parts[0][0] + "***@" + parts[1]) if len(parts) == 2 else "***"


# ── Prompts ───────────────────────────────────────────────────────────────────
_SYSTEM_PROMPT = """\
You are a finance collections specialist at Acme Finance Pvt Ltd.
Your job is to draft professional invoice follow-up emails.

STRICT RULES:
1. Respond ONLY with a valid JSON object — no text before or after.
2. JSON schema (all fields required):
   {
     "subject":     "<email subject line>",
     "body":        "<full email body, plain text only>",
     "tone_used":   "<tone descriptor>",
     "invoice_no":  "<invoice number from provided data>",
     "client_name": "<client name from provided data>"
   }
3. NEVER invent or hallucinate invoice data not provided.
4. Body MUST include: client name, invoice number, amount, due date, days overdue, payment link.
5. No placeholders like [name] or [amount]. Use actual provided values.
6. No markdown, no bullet points in body.
7. Sign off: Accounts Receivable Team, Acme Finance Pvt Ltd | ar@acme.in | +91-22-4000-1234
"""

_STAGE_TONE_GUIDE = {
    1: ("Warm & Friendly",
        "Write as if speaking to a valued client. Assume the delay is an oversight. Be upbeat and helpful."),
    2: ("Polite but Firm",
        "Acknowledge the relationship but be clear this is a follow-up. Ask for a specific confirmed payment date."),
    3: ("Formal & Serious",
        "Formal business language only. Express concern. State non-payment may impact credit terms. Demand response in 48 hours."),
    4: ("Stern & Urgent",
        "FINAL automated reminder. Direct and unambiguous. State that failure to pay within 24 hours triggers legal escalation."),
}

def _build_user_prompt(invoice: dict, stage: EscalationStage) -> str:
    tone_name, tone_guidance = _STAGE_TONE_GUIDE.get(
        stage.stage_number, ("Professional", "Be professional and concise.")
    )
    symbol = "Rs." if invoice.get("currency", "INR").upper() == "INR" else invoice.get("currency", "")
    amount_str = f"{symbol}{float(invoice['amount']):,.0f}"

    return f"""Generate a follow-up email for this invoice.

INVOICE DETAILS:
  Invoice Number  : {_sanitise(invoice['invoice_no'])}
  Client Name     : {_sanitise(invoice['client_name'])}
  Company         : {_sanitise(invoice['company'])}
  Amount Due      : {amount_str}
  Due Date        : {invoice['due_date_parsed']}
  Days Overdue    : {invoice['days_overdue']}
  Payment Link    : {_sanitise(invoice.get('payment_link', 'https://pay.acme.in'))}
  Account Manager : {_sanitise(invoice.get('account_manager', 'Accounts Receivable'))}

ESCALATION STAGE : {stage.label}
REQUIRED TONE    : {tone_name}
CALL TO ACTION   : {stage.cta}
TONE GUIDANCE    : {tone_guidance}

Return ONLY the JSON object as specified in your system prompt.
"""


# ── Main generator class ──────────────────────────────────────────────────────
class EmailGenerator:
    """
    Generates follow-up emails using Groq API (Llama 3.3 70B).

    Parameters
    ----------
    model       : Groq model ID (default: llama-3.3-70b-versatile)
    max_retries : Retries on parse failures (default: 2)
    """

    def __init__(
        self,
        model: str = "llama-3.3-70b-versatile",
        max_retries: int = 2,
    ) -> None:
        self.client = _get_groq_client()
        self.model = model
        self.max_retries = max_retries

    def generate(self, invoice: dict) -> GeneratedEmail:
        """
        Generate one personalised follow-up email.

        Args:
            invoice: Dict row from data_ingestion.load_invoices()
                     Must include: days_overdue, stage_number, due_date_parsed.

        Returns:
            GeneratedEmail (Pydantic-validated).

        Raises:
            EmailGenerationError: If stage is 5 or LLM parse fails.
        """
        stage = get_stage(int(invoice["days_overdue"]))

        if not stage.auto_send:
            raise EmailGenerationError(
                f"{invoice['invoice_no']} is Stage 5 ({stage.label}). "
                "No automated email — please escalate manually."
            )

        user_prompt = _build_user_prompt(invoice, stage)
        last_error: Optional[Exception] = None

        for attempt in range(1, self.max_retries + 2):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": _SYSTEM_PROMPT},
                        {"role": "user",   "content": user_prompt},
                    ],
                    max_tokens=1000,
                    temperature=0.7,
                    response_format={"type": "json_object"},
                )
                raw = response.choices[0].message.content.strip()
                # Strip any accidental markdown fences
                raw = re.sub(r"^```[a-z]*\n?", "", raw)
                raw = re.sub(r"\n?```$", "", raw)

                data = json.loads(raw)
                email = GeneratedEmail(**data)

                logger.info(
                    "Generated | %s | Stage %d | %s | to: %s",
                    email.invoice_no, stage.stage_number, email.tone_used,
                    _mask_email(str(invoice.get("contact_email", ""))),
                )
                return email

            except Exception as exc:
                last_error = exc
                logger.warning("Attempt %d/%d failed: %s", attempt, self.max_retries + 1, exc)

        raise EmailGenerationError(
            f"Failed after {self.max_retries + 1} attempts. Last error: {last_error}"
        )

    def generate_batch(
        self, invoices: list[dict]
    ) -> list[tuple[dict, Optional[GeneratedEmail], Optional[str]]]:
        """Generate emails for a list of invoice records."""
        results = []
        for inv in invoices:
            try:
                results.append((inv, self.generate(inv), None))
            except EmailGenerationError as e:
                results.append((inv, None, str(e)))
        return results
