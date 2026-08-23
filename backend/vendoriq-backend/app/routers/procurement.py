from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_procurement
from app.models.user import User
from app.models.procurement import ProcurementRequest, ProcurementStatus
from app.schemas.procurement import (
    ProcurementRequestCreate, ProcurementRequestUpdate, ProcurementRequestOut,
    ProcurementApproval, ProcurementStatusUpdate,
)
from app.services.code_generator import generate_request_code
from app.services.notification_service import create_notification
from app.services.status_history_service import log_status_change
from app.models.notification import NotificationType

router = APIRouter(prefix="/procurement-requests", tags=["Procurement Management"])


@router.post("", response_model=ProcurementRequestOut, status_code=201)
def create_request(payload: ProcurementRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    req = ProcurementRequest(
        **payload.model_dump(),
        request_code=generate_request_code(),
        requested_by=current_user.id,
    )
    db.add(req)
    db.flush()  # assigns req.id before we log against it
    log_status_change(
        db, entity_type="procurement_request", entity_id=req.id,
        old_status=None, new_status=req.status, changed_by=current_user.id,
        remarks="Request created",
    )
    db.commit()
    db.refresh(req)
    return req


@router.get("", response_model=list[ProcurementRequestOut])
def list_requests(
    status_: ProcurementStatus | None = Query(default=None, alias="status"),
    department: str | None = None,
    vendor_id: str | None = None,
    skip: int = 0,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(ProcurementRequest)
    if status_:
        query = query.filter(ProcurementRequest.status == status_)
    if department:
        query = query.filter(ProcurementRequest.department == department)
    if vendor_id:
        query = query.filter(ProcurementRequest.vendor_id == vendor_id)
    return query.order_by(ProcurementRequest.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{request_id}", response_model=ProcurementRequestOut)
def get_request(request_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    req = db.get(ProcurementRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Procurement request not found")
    return req


@router.put("/{request_id}", response_model=ProcurementRequestOut)
def update_request(request_id: str, payload: ProcurementRequestUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    req = db.get(ProcurementRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Procurement request not found")
    if req.status not in (ProcurementStatus.PENDING,):
        raise HTTPException(status_code=400, detail="Only pending requests can be edited")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(req, field, value)
    db.commit()
    db.refresh(req)
    return req


@router.put("/{request_id}/approval", response_model=ProcurementRequestOut)
def approve_or_reject_request(
    request_id: str, payload: ProcurementApproval, db: Session = Depends(get_db), current_user: User = Depends(require_procurement)
):
    req = db.get(ProcurementRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Procurement request not found")
    old_status = req.status

    if payload.approve:
        req.status = ProcurementStatus.APPROVED
        req.approved_by = current_user.id
        req.approved_at = datetime.now(timezone.utc)
    else:
        req.status = ProcurementStatus.CANCELLED
        req.rejection_reason = payload.rejection_reason or "Not specified"

    log_status_change(
        db, entity_type="procurement_request", entity_id=req.id,
        old_status=old_status, new_status=req.status,
        changed_by=current_user.id,
        remarks=payload.rejection_reason if not payload.approve else "Approved",
    )
    db.commit()
    db.refresh(req)

    create_notification(
        db, user_id=req.requested_by,
        title=f"Procurement Request {'Approved' if payload.approve else 'Rejected'}",
        message=f"Your request '{req.title}' ({req.request_code}) was {'approved' if payload.approve else 'rejected'}.",
        type=NotificationType.PROCUREMENT_ALERT,
    )
    return req


@router.put("/{request_id}/status", response_model=ProcurementRequestOut)
def update_status(request_id: str, payload: ProcurementStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_procurement)):
    req = db.get(ProcurementRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Procurement request not found")
    old_status = req.status
    req.status = payload.status
    log_status_change(
        db, entity_type="procurement_request", entity_id=req.id,
        old_status=old_status, new_status=req.status, changed_by=current_user.id,
        remarks=getattr(payload, "remarks", None),
    )
    db.commit()
    db.refresh(req)
    return req
