from statistics import mean

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_supply_chain
from app.models.user import User
from app.models.performance import VendorPerformance
from app.models.vendor import Vendor
from app.schemas.performance import VendorPerformanceCreate, VendorPerformanceOut, VendorPerformanceSummary

router = APIRouter(prefix="/vendor-performance", tags=["Vendor Performance"])


@router.post("", response_model=VendorPerformanceOut, status_code=201)
def record_performance(payload: VendorPerformanceCreate, db: Session = Depends(get_db), current_user: User = Depends(require_supply_chain)):
    vendor = db.get(Vendor, payload.vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    record = VendorPerformance(**payload.model_dump(), recorded_by=current_user.id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("", response_model=list[VendorPerformanceOut])
def list_performance(
    vendor_id: str | None = None,
    skip: int = 0,
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(VendorPerformance)
    if vendor_id:
        query = query.filter(VendorPerformance.vendor_id == vendor_id)
    return query.order_by(VendorPerformance.record_date.desc()).offset(skip).limit(limit).all()


@router.get("/vendor/{vendor_id}/summary", response_model=VendorPerformanceSummary)
def performance_summary(vendor_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    vendor = db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    records = db.query(VendorPerformance).filter(VendorPerformance.vendor_id == vendor_id).all()
    total = len(records)
    on_time = sum(1 for r in records if r.on_time_delivery)
    delayed = sum(1 for r in records if r.on_time_delivery is False)
    completed = sum(1 for r in records if r.order_completed)

    quality_ratings = [r.quality_rating for r in records if r.quality_rating is not None]
    response_times = [r.response_time_hours for r in records if r.response_time_hours is not None]
    resolution_times = [r.issue_resolution_time_hours for r in records if r.issue_resolution_time_hours is not None]

    return VendorPerformanceSummary(
        vendor_id=vendor_id,
        total_orders=total,
        on_time_deliveries=on_time,
        delayed_deliveries=delayed,
        on_time_delivery_rate=round((on_time / total) * 100, 2) if total else 0.0,
        avg_quality_rating=round(mean(quality_ratings), 2) if quality_ratings else None,
        avg_response_time_hours=round(mean(response_times), 2) if response_times else None,
        avg_issue_resolution_time_hours=round(mean(resolution_times), 2) if resolution_times else None,
        order_completion_rate=round((completed / total) * 100, 2) if total else 0.0,
    )
