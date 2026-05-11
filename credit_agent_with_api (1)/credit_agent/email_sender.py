"""
email_sender.py
---------------
Sends generated emails via SMTP (smtplib) or SendGrid.
Defaults to DRY_RUN mode — no real emails are sent unless
SEND_MODE=live is set in the environment.

Security mitigations:
  • API keys / SMTP passwords read exclusively from environment variables.
  • SPF/DKIM/DMARC: set SENDER_DOMAIN in .env and configure DNS records
    (this module validates the sender domain is the configured one).
  • Dry-run mode is the DEFAULT; production send is opt-in.
  • Rate limiting: max BATCH_SEND_LIMIT (default 50) emails per run.
"""

import logging
import os
import smtplib
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Literal

logger = logging.getLogger(__name__)

SendStatus = Literal["SENT", "DRY_RUN", "FAILED"]

# ── Config from environment ───────────────────────────────────────────────────
SEND_MODE        = os.getenv("SEND_MODE", "dry_run").lower()          # "live" | "dry_run"
SENDER_EMAIL     = os.getenv("SENDER_EMAIL", "ar@acme.in")
SENDER_NAME      = os.getenv("SENDER_NAME", "Accounts Receivable, Acme Finance")
SENDER_DOMAIN    = os.getenv("SENDER_DOMAIN", "acme.in")
BATCH_SEND_LIMIT = int(os.getenv("BATCH_SEND_LIMIT", "50"))

# SMTP settings (used when EMAIL_PROVIDER=smtp)
SMTP_HOST        = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT        = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER        = os.getenv("SMTP_USER", "")
SMTP_PASSWORD    = os.getenv("SMTP_PASSWORD", "")        # ← from .env, never hardcode

# SendGrid settings (used when EMAIL_PROVIDER=sendgrid)
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")    # ← from .env, never hardcode
EMAIL_PROVIDER   = os.getenv("EMAIL_PROVIDER", "smtp")  # "smtp" | "sendgrid"


def _validate_sender() -> None:
    """Guard: sender email must belong to the configured sender domain."""
    if not SENDER_EMAIL.endswith("@" + SENDER_DOMAIN):
        raise ValueError(
            f"SENDER_EMAIL ({SENDER_EMAIL}) does not match "
            f"SENDER_DOMAIN ({SENDER_DOMAIN}). "
            f"Configure SPF/DKIM/DMARC for your domain before enabling live send."
        )


def _build_mime(to_email: str, subject: str, body: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"{SENDER_NAME} <{SENDER_EMAIL}>"
    msg["To"]      = to_email
    msg["X-Agent"] = "CreditFollowUpAgent/1.0"
    msg.attach(MIMEText(body, "plain", "utf-8"))
    return msg


def _send_smtp(to_email: str, subject: str, body: str) -> None:
    msg = _build_mime(to_email, subject, body)
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SENDER_EMAIL, [to_email], msg.as_string())


def _send_sendgrid(to_email: str, subject: str, body: str) -> None:
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail, Email, To, Content
    except ImportError:
        raise ImportError("Install sendgrid: pip install sendgrid")

    sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
    mail = Mail(
        from_email=Email(SENDER_EMAIL, SENDER_NAME),
        to_emails=To(to_email),
        subject=subject,
        plain_text_content=Content("text/plain", body),
    )
    response = sg.client.mail.send.post(request_body=mail.get())
    if response.status_code not in (200, 202):
        raise RuntimeError(f"SendGrid returned status {response.status_code}")


def send_email(
    to_email: str,
    subject: str,
    body: str,
    dry_run: bool = True,
) -> SendStatus:
    """
    Send (or simulate sending) one email.

    Args:
        to_email : Recipient email address.
        subject  : Email subject line.
        body     : Plain-text email body.
        dry_run  : If True (default), log the email but don't actually send.
                   Overridden by SEND_MODE=live in the environment.

    Returns:
        "SENT", "DRY_RUN", or "FAILED"
    """
    # Environment always wins — if SEND_MODE != "live", force dry_run
    effective_dry_run = dry_run or (SEND_MODE != "live")

    if effective_dry_run:
        logger.info(
            "[DRY RUN] Would send to %s | Subject: %s",
            to_email[:4] + "***",
            subject[:60],
        )
        return "DRY_RUN"

    _validate_sender()

    try:
        if EMAIL_PROVIDER == "sendgrid":
            _send_sendgrid(to_email, subject, body)
        else:
            _send_smtp(to_email, subject, body)

        logger.info("Email sent to %s | Subject: %s", to_email[:4] + "***", subject[:60])
        return "SENT"

    except Exception as exc:
        logger.error("Failed to send to %s: %s", to_email[:4] + "***", exc)
        return "FAILED"


def send_batch(
    records: list[dict],
    delay_seconds: float = 0.5,
    dry_run: bool = True,
) -> list[tuple[str, SendStatus]]:
    """
    Send emails for a batch of (invoice, GeneratedEmail) pairs.

    Args:
        records        : List of dicts with keys: to_email, subject, body.
        delay_seconds  : Pause between sends (default 0.5s) to avoid rate limits.
        dry_run        : Passed to send_email().

    Returns:
        List of (invoice_no, SendStatus) tuples.
    """
    if len(records) > BATCH_SEND_LIMIT:
        logger.warning(
            "Batch size %d exceeds limit %d — truncating.",
            len(records), BATCH_SEND_LIMIT,
        )
        records = records[:BATCH_SEND_LIMIT]

    results = []
    for rec in records:
        status = send_email(
            to_email=rec["to_email"],
            subject=rec["subject"],
            body=rec["body"],
            dry_run=dry_run,
        )
        results.append((rec.get("invoice_no", "?"), status))
        time.sleep(delay_seconds)

    return results
