"""
scheduler.py
------------
Schedules the credit follow-up agent to run automatically (APScheduler).
Default: every weekday at 09:00 IST.

    python scheduler.py              # start scheduled loop
    python scheduler.py --run-now   # single immediate run
"""

import argparse
import logging
import os
import sys

from dotenv import load_dotenv
load_dotenv()

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from agent import run_agent

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s | %(levelname)-8s | %(message)s")
logger = logging.getLogger(__name__)

DATA_SOURCE   = os.getenv("DATA_SOURCE", "sample_data.csv")
DRY_RUN_MODE  = os.getenv("SEND_MODE", "dry_run").lower() != "live"
GROQ_MODEL    = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
SCHEDULE_HOUR = int(os.getenv("SCHEDULE_HOUR", "9"))
SCHEDULE_MIN  = int(os.getenv("SCHEDULE_MIN", "0"))
SCHEDULE_DAYS = os.getenv("SCHEDULE_DAYS", "mon-fri")


def job() -> None:
    logger.info("Scheduled run triggered.")
    try:
        stats = run_agent(source=DATA_SOURCE, dry_run=DRY_RUN_MODE, model=GROQ_MODEL)
        logger.info("Run complete: %s", stats)
    except Exception as exc:
        logger.error("Run failed: %s", exc, exc_info=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-now", action="store_true")
    args = parser.parse_args()

    if not os.getenv("GROQ_API_KEY"):
        print("ERROR: GROQ_API_KEY not set.")
        sys.exit(1)

    if args.run_now:
        job()
        return

    scheduler = BlockingScheduler()
    scheduler.add_job(
        job,
        CronTrigger(hour=SCHEDULE_HOUR, minute=SCHEDULE_MIN,
                    day_of_week=SCHEDULE_DAYS, timezone="Asia/Kolkata"),
        id="credit_followup",
    )
    logger.info("Scheduler started. Runs at %02d:%02d IST on %s.",
                SCHEDULE_HOUR, SCHEDULE_MIN, SCHEDULE_DAYS)
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped.")


if __name__ == "__main__":
    main()
