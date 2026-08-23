"""
Celery application for background and scheduled jobs:
  - Contract expiry notifications
  - Scheduled report generation
  - Reliability score recalculation sweeps

Run a worker with:
    celery -A app.celery_app worker --loglevel=info

Run the beat scheduler with:
    celery -A app.celery_app beat --loglevel=info
"""
from datetime import date, timedelta

from celery import Celery
from celery.schedules import crontab

from app.config import settings
from app.database import SessionLocal
from app.models.contract import Contract, ContractStatus
from app.models.vendor import Vendor
from app.services.notification_service import create_notification
from app.services.reliability_scoring import calculate_reliability_score, recompute_ranks
from app.models.notification import NotificationType

celery_app = Celery(
    "vendoriq",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.beat_schedule = {
    "check-contract-expirations-daily": {
        "task": "app.celery_app.check_contract_expirations",
        "schedule": crontab(hour=7, minute=0),
    },
    "recalculate-reliability-scores-weekly": {
        "task": "app.celery_app.recalculate_all_reliability_scores",
        "schedule": crontab(hour=6, minute=0, day_of_week=1),
    },
}
celery_app.conf.timezone = "UTC"


@celery_app.task(name="app.celery_app.check_contract_expirations")
def check_contract_expirations():
    db = SessionLocal()
    try:
        cutoff = date.today() + timedelta(days=30)
        expiring = db.query(Contract).filter(
            Contract.end_date <= cutoff,
            Contract.end_date >= date.today(),
            Contract.status == ContractStatus.ACTIVE,
        ).all()
        for contract in expiring:
            contract.status = ContractStatus.EXPIRING_SOON
            vendor = db.get(Vendor, contract.vendor_id)
            if vendor and contract.created_by:
                create_notification(
                    db, user_id=contract.created_by,
                    title="Contract Expiry Alert",
                    message=f"Contract {contract.contract_number} for {vendor.company_name} "
                            f"expires on {contract.end_date}.",
                    type=NotificationType.CONTRACT_EXPIRY,
                )
        db.commit()
        return {"checked": len(expiring)}
    finally:
        db.close()


@celery_app.task(name="app.celery_app.recalculate_all_reliability_scores")
def recalculate_all_reliability_scores():
    db = SessionLocal()
    try:
        vendors = db.query(Vendor).filter(Vendor.is_active.is_(True)).all()
        for vendor in vendors:
            calculate_reliability_score(db, vendor.id)
        recompute_ranks(db)
        return {"recalculated": len(vendors)}
    finally:
        db.close()
