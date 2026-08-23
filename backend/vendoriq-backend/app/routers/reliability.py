from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.dependencies import get_current_user, require_supply_chain
from app.models.user import User
from app.models.vendor import Vendor
from app.models.reliability import ReliabilityScore
from app.schemas.reliability import ReliabilityScoreOut, VendorRankingEntry
from app.services.reliability_scoring import calculate_reliability_score, recompute_ranks

router = APIRouter(prefix="/reliability", tags=["Vendor Reliability"])


@router.post("/vendor/{vendor_id}/calculate", response_model=ReliabilityScoreOut, status_code=201)
def calculate_score(vendor_id: str, db: Session = Depends(get_db), _: User = Depends(require_supply_chain)):
    vendor = db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    score = calculate_reliability_score(db, vendor_id)
    recompute_ranks(db)
    db.refresh(score)
    return score


@router.get("/vendor/{vendor_id}/latest", response_model=ReliabilityScoreOut)
def latest_score(vendor_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    score = (
        db.query(ReliabilityScore)
        .filter(ReliabilityScore.vendor_id == vendor_id)
        .order_by(ReliabilityScore.calculated_at.desc())
        .first()
    )
    if not score:
        raise HTTPException(status_code=404, detail="No reliability score found for this vendor yet")
    return score


@router.get("/vendor/{vendor_id}/history", response_model=list[ReliabilityScoreOut])
def score_history(vendor_id: str, limit: int = Query(20, le=100), db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return (
        db.query(ReliabilityScore)
        .filter(ReliabilityScore.vendor_id == vendor_id)
        .order_by(ReliabilityScore.calculated_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/ranking", response_model=list[VendorRankingEntry])
def vendor_ranking(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    latest_ids_subq = (
        db.query(
            ReliabilityScore.vendor_id,
            func.max(ReliabilityScore.calculated_at).label("max_date"),
        )
        .group_by(ReliabilityScore.vendor_id)
        .subquery()
    )
    rows = (
        db.query(ReliabilityScore, Vendor.company_name)
        .join(Vendor, Vendor.id == ReliabilityScore.vendor_id)
        .join(
            latest_ids_subq,
            (ReliabilityScore.vendor_id == latest_ids_subq.c.vendor_id)
            & (ReliabilityScore.calculated_at == latest_ids_subq.c.max_date),
        )
        .order_by(ReliabilityScore.overall_score.desc())
        .all()
    )
    return [
        VendorRankingEntry(
            vendor_id=score.vendor_id,
            company_name=name,
            overall_score=score.overall_score,
            risk_level=score.risk_level,
            rank=score.rank or idx,
        )
        for idx, (score, name) in enumerate(rows, start=1)
    ]
