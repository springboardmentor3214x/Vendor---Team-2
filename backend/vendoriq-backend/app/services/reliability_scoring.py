"""
Vendor Reliability Scoring Engine.

Computes a weighted 0-100 reliability score from six factors:
  - Delivery History        (25%)
  - Product Quality         (20%)
  - Communication Efficiency(15%)
  - Contract Compliance     (15%)
  - Purchase History        (15%)
  - Issue Resolution        (10%)

The result also derives a procurement risk level and a trend
direction (by comparing against the vendor's previous score).
"""
from datetime import date, timedelta
from statistics import mean

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.performance import VendorPerformance
from app.models.contract import Contract, ContractStatus, ComplianceStatus
from app.models.communication import Communication
from app.models.procurement import PurchaseOrder, POStatus
from app.models.reliability import ReliabilityScore, RiskLevel, TrendDirection

WEIGHTS = {
    "delivery": 0.25,
    "quality": 0.20,
    "communication": 0.15,
    "compliance": 0.15,
    "purchase_history": 0.15,
    "issue_resolution": 0.10,
}


def _score_delivery(db: Session, vendor_id: str) -> float:
    records = db.query(VendorPerformance).filter(VendorPerformance.vendor_id == vendor_id).all()
    if not records:
        return 50.0  # neutral default for new vendors
    on_time = sum(1 for r in records if r.on_time_delivery)
    total = sum(1 for r in records if r.on_time_delivery is not None)
    if total == 0:
        return 50.0
    on_time_rate = on_time / total
    avg_delay = mean([r.delivery_delay_days for r in records if r.delivery_delay_days]) if any(
        r.delivery_delay_days for r in records) else 0
    delay_penalty = min(avg_delay * 1.5, 30)
    return max(0.0, min(100.0, on_time_rate * 100 - delay_penalty))


def _score_quality(db: Session, vendor_id: str) -> float:
    ratings = [
        r.quality_rating for r in
        db.query(VendorPerformance).filter(VendorPerformance.vendor_id == vendor_id).all()
        if r.quality_rating is not None
    ]
    if not ratings:
        return 50.0
    return max(0.0, min(100.0, (mean(ratings) / 5.0) * 100))


def _score_communication(db: Session, vendor_id: str) -> float:
    records = db.query(VendorPerformance).filter(VendorPerformance.vendor_id == vendor_id).all()
    response_times = [r.response_time_hours for r in records if r.response_time_hours is not None]
    msg_count = db.query(func.count(Communication.id)).filter(Communication.vendor_id == vendor_id).scalar() or 0

    if not response_times and msg_count == 0:
        return 50.0

    score = 100.0
    if response_times:
        avg_response = mean(response_times)
        # Under 4h -> ~100, 24h -> ~70, 72h+ -> ~20
        score = max(20.0, 100 - (avg_response / 72 * 80))
    return max(0.0, min(100.0, score))


def _score_compliance(db: Session, vendor_id: str) -> float:
    contracts = db.query(Contract).filter(Contract.vendor_id == vendor_id).all()
    if not contracts:
        return 50.0
    compliant = sum(1 for c in contracts if c.compliance_status == ComplianceStatus.COMPLIANT)
    non_compliant = sum(1 for c in contracts if c.compliance_status == ComplianceStatus.NON_COMPLIANT)
    total = len(contracts)
    score = (compliant / total) * 100 if total else 50.0
    score -= non_compliant * 10
    # penalize expired contracts still marked active
    today = date.today()
    expired_unhandled = sum(1 for c in contracts if c.end_date < today and c.status == ContractStatus.ACTIVE)
    score -= expired_unhandled * 15
    return max(0.0, min(100.0, score))


def _score_purchase_history(db: Session, vendor_id: str) -> float:
    orders = db.query(PurchaseOrder).filter(PurchaseOrder.vendor_id == vendor_id).all()
    if not orders:
        return 40.0
    completed = sum(1 for o in orders if o.status == POStatus.COMPLETED)
    cancelled = sum(1 for o in orders if o.status == POStatus.CANCELLED)
    total = len(orders)
    completion_rate = completed / total if total else 0
    cancellation_rate = cancelled / total if total else 0
    volume_bonus = min(total, 20) / 20 * 10  # up to +10 for having a longer track record
    score = completion_rate * 90 - cancellation_rate * 30 + volume_bonus
    return max(0.0, min(100.0, score))


def _score_issue_resolution(db: Session, vendor_id: str) -> float:
    times = [
        r.issue_resolution_time_hours for r in
        db.query(VendorPerformance).filter(VendorPerformance.vendor_id == vendor_id).all()
        if r.issue_resolution_time_hours is not None
    ]
    if not times:
        return 60.0
    avg_time = mean(times)
    # Under 8h -> ~100, 48h -> ~60, 120h+ -> ~10
    score = max(10.0, 100 - (avg_time / 120 * 90))
    return max(0.0, min(100.0, score))


def _risk_level(overall_score: float) -> RiskLevel:
    if overall_score >= 80:
        return RiskLevel.LOW
    if overall_score >= 60:
        return RiskLevel.MEDIUM
    if overall_score >= 40:
        return RiskLevel.HIGH
    return RiskLevel.CRITICAL


def _trend(db: Session, vendor_id: str, new_score: float) -> TrendDirection:
    previous = (
        db.query(ReliabilityScore)
        .filter(ReliabilityScore.vendor_id == vendor_id)
        .order_by(ReliabilityScore.calculated_at.desc())
        .first()
    )
    if not previous:
        return TrendDirection.STABLE
    delta = new_score - previous.overall_score
    if delta > 3:
        return TrendDirection.IMPROVING
    if delta < -3:
        return TrendDirection.DECLINING
    return TrendDirection.STABLE


def _recommendation(overall_score: float, risk_level: RiskLevel) -> str:
    if risk_level == RiskLevel.LOW:
        return "Vendor demonstrates strong reliability. Recommended for continued and expanded procurement."
    if risk_level == RiskLevel.MEDIUM:
        return "Vendor performance is acceptable. Monitor delivery and quality trends before increasing order volume."
    if risk_level == RiskLevel.HIGH:
        return "Vendor shows notable reliability concerns. Consider a performance improvement review before new orders."
    return "Vendor reliability is critical. Recommend suspending new procurement and initiating a compliance review."


def calculate_reliability_score(db: Session, vendor_id: str) -> ReliabilityScore:
    """Calculates and persists a new ReliabilityScore snapshot for a vendor."""
    delivery = _score_delivery(db, vendor_id)
    quality = _score_quality(db, vendor_id)
    communication = _score_communication(db, vendor_id)
    compliance = _score_compliance(db, vendor_id)
    purchase_history = _score_purchase_history(db, vendor_id)
    issue_resolution = _score_issue_resolution(db, vendor_id)

    overall = (
        delivery * WEIGHTS["delivery"]
        + quality * WEIGHTS["quality"]
        + communication * WEIGHTS["communication"]
        + compliance * WEIGHTS["compliance"]
        + purchase_history * WEIGHTS["purchase_history"]
        + issue_resolution * WEIGHTS["issue_resolution"]
    )
    overall = round(max(0.0, min(100.0, overall)), 2)

    risk = _risk_level(overall)
    trend = _trend(db, vendor_id, overall)
    recommendation = _recommendation(overall, risk)

    record = ReliabilityScore(
        vendor_id=vendor_id,
        delivery_score=round(delivery, 2),
        quality_score=round(quality, 2),
        communication_score=round(communication, 2),
        compliance_score=round(compliance, 2),
        purchase_history_score=round(purchase_history, 2),
        issue_resolution_score=round(issue_resolution, 2),
        overall_score=overall,
        risk_level=risk,
        trend=trend,
        recommendation=recommendation,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def recompute_ranks(db: Session) -> None:
    """Assigns rank (1 = best) to every vendor's latest reliability score."""
    latest_ids_subq = (
        db.query(
            ReliabilityScore.vendor_id,
            func.max(ReliabilityScore.calculated_at).label("max_date"),
        )
        .group_by(ReliabilityScore.vendor_id)
        .subquery()
    )
    latest_scores = (
        db.query(ReliabilityScore)
        .join(
            latest_ids_subq,
            (ReliabilityScore.vendor_id == latest_ids_subq.c.vendor_id)
            & (ReliabilityScore.calculated_at == latest_ids_subq.c.max_date),
        )
        .order_by(ReliabilityScore.overall_score.desc())
        .all()
    )
    for idx, score in enumerate(latest_scores, start=1):
        score.rank = idx
    db.commit()
