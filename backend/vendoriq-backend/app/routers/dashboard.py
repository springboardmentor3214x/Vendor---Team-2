from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.vendor import Vendor, VendorStatus
from app.models.procurement import ProcurementRequest, PurchaseOrder, ProcurementStatus, POStatus
from app.models.contract import Contract, ContractStatus, ComplianceStatus
from app.models.reliability import ReliabilityScore

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])


@router.get("/procurement")
def procurement_dashboard(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    total_requests = db.query(func.count(ProcurementRequest.id)).scalar() or 0
    pending_requests = db.query(func.count(ProcurementRequest.id)).filter(
        ProcurementRequest.status == ProcurementStatus.PENDING
    ).scalar() or 0

    active_po_statuses = [POStatus.PENDING, POStatus.APPROVED, POStatus.ORDERED, POStatus.IN_TRANSIT]
    active_pos = db.query(func.count(PurchaseOrder.id)).filter(PurchaseOrder.status.in_(active_po_statuses)).scalar() or 0
    total_po_value = db.query(func.coalesce(func.sum(PurchaseOrder.total_amount), 0.0)).scalar() or 0.0

    delivered_on_time_pct = None
    delivered = db.query(PurchaseOrder).filter(
        PurchaseOrder.status.in_([POStatus.DELIVERED, POStatus.COMPLETED]),
        PurchaseOrder.expected_delivery_date.isnot(None),
        PurchaseOrder.actual_delivery_date.isnot(None),
    ).all()
    if delivered:
        on_time = sum(1 for po in delivered if po.actual_delivery_date <= po.expected_delivery_date)
        delivered_on_time_pct = round((on_time / len(delivered)) * 100, 2)

    status_breakdown = dict(
        db.query(PurchaseOrder.status, func.count(PurchaseOrder.id)).group_by(PurchaseOrder.status).all()
    )

    return {
        "total_procurement_requests": total_requests,
        "pending_requests": pending_requests,
        "active_purchase_orders": active_pos,
        "total_purchase_order_value": round(total_po_value, 2),
        "on_time_delivery_rate_pct": delivered_on_time_pct,
        "purchase_order_status_breakdown": {s.value if hasattr(s, "value") else s: c for s, c in status_breakdown.items()},
    }


@router.get("/vendor")
def vendor_dashboard(vendor_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    latest_score = (
        db.query(ReliabilityScore)
        .filter(ReliabilityScore.vendor_id == vendor_id)
        .order_by(ReliabilityScore.calculated_at.desc())
        .first()
    )
    order_count = db.query(func.count(PurchaseOrder.id)).filter(PurchaseOrder.vendor_id == vendor_id).scalar() or 0
    active_contracts = db.query(func.count(Contract.id)).filter(
        Contract.vendor_id == vendor_id, Contract.status == ContractStatus.ACTIVE
    ).scalar() or 0

    return {
        "vendor_id": vendor_id,
        "reliability_score": latest_score.overall_score if latest_score else None,
        "risk_level": latest_score.risk_level.value if latest_score else None,
        "trend": latest_score.trend.value if latest_score else None,
        "total_orders": order_count,
        "active_contracts": active_contracts,
    }


@router.get("/admin")
def admin_dashboard(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_vendors = db.query(func.count(Vendor.id)).scalar() or 0
    approved_vendors = db.query(func.count(Vendor.id)).filter(Vendor.status == VendorStatus.APPROVED).scalar() or 0
    pending_vendors = db.query(func.count(Vendor.id)).filter(Vendor.status == VendorStatus.PENDING_APPROVAL).scalar() or 0

    non_compliant_contracts = db.query(func.count(Contract.id)).filter(
        Contract.compliance_status == ComplianceStatus.NON_COMPLIANT
    ).scalar() or 0

    expiring_soon_cutoff = date.today() + timedelta(days=30)
    expiring_contracts = db.query(func.count(Contract.id)).filter(
        Contract.end_date <= expiring_soon_cutoff, Contract.end_date >= date.today()
    ).scalar() or 0

    return {
        "total_users": total_users,
        "total_vendors": total_vendors,
        "approved_vendors": approved_vendors,
        "pending_vendor_approvals": pending_vendors,
        "non_compliant_contracts": non_compliant_contracts,
        "contracts_expiring_within_30_days": expiring_contracts,
    }
