"""
Module 3 – Procurement Service Layer
=====================================
Business logic for all procurement operations.
Key responsibility: auto-generate request_number and po_number.
These values are NEVER accepted from the client – they are always
set here in the service layer before any DB write.
"""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.procurement import (
    Invoice,
    OrderTracking,
    ProcurementApproval,
    ProcurementRequest,
    ProcurementStatus,
    ProcurementStatusHistory,
    PurchaseOrder,
)
from app.schemas.procurement import (
    InvoiceCreate,
    InvoiceUpdate,
    OrderTrackingCreate,
    OrderTrackingUpdate,
    ProcurementApprovalCreate,
    ProcurementRequestCreate,
    ProcurementRequestUpdate,
    PurchaseOrderCreate,
    PurchaseOrderUpdate,
)


# ---------------------------------------------------------------------------
# Number Helpers
# ---------------------------------------------------------------------------

def _generate_request_number(db: Session) -> str:
    """
    Generate the next PR-YYYY-XXXX serial.
    Scans existing request_numbers for the current year and increments the max.
    Thread-safe enough for SQLite; for PostgreSQL use a DB sequence instead.
    """
    year = datetime.utcnow().year
    prefix = f"PR-{year}-"
    rows = (
        db.query(ProcurementRequest.request_number)
        .filter(ProcurementRequest.request_number.like(f"{prefix}%"))
        .all()
    )
    if not rows:
        seq = 1
    else:
        seqs = []
        for (rn,) in rows:
            try:
                seqs.append(int(rn.split("-")[-1]))
            except (ValueError, IndexError):
                pass
        seq = max(seqs, default=0) + 1
    return f"{prefix}{seq:04d}"


def _generate_po_number(db: Session) -> str:
    """
    Generate the next PO-YYYY-XXXX serial from existing purchase_orders.
    """
    year = datetime.utcnow().year
    prefix = f"PO-{year}-"
    rows = (
        db.query(PurchaseOrder.po_number)
        .filter(PurchaseOrder.po_number.like(f"{prefix}%"))
        .all()
    )
    if not rows:
        seq = 1
    else:
        seqs = []
        for (pn,) in rows:
            try:
                seqs.append(int(pn.split("-")[-1]))
            except (ValueError, IndexError):
                pass
        seq = max(seqs, default=0) + 1
    return f"{prefix}{seq:04d}"


def _compute_delay_days(
    expected: Optional[date], actual: Optional[date]
) -> Optional[int]:
    """
    Returns number of days late (positive) or early (negative), or None
    when either date is absent.
    """
    if expected is None or actual is None:
        return None
    return (actual - expected).days


# ---------------------------------------------------------------------------
# ProcurementRequest CRUD
# ---------------------------------------------------------------------------

def create_procurement_request(
    db: Session,
    payload: ProcurementRequestCreate,
    requested_by_user_id: int,
) -> ProcurementRequest:
    request_number = _generate_request_number(db)
    obj = ProcurementRequest(
        request_number=request_number,
        request_title=payload.request_title,
        department_name=payload.department_name,
        requested_by=requested_by_user_id,
        item_name=payload.item_name,
        product_category=payload.product_category,
        quantity=payload.quantity,
        unit_of_measurement=payload.unit_of_measurement,
        estimated_budget=payload.estimated_budget,
        required_delivery_date=payload.required_delivery_date,
        priority=payload.priority,
        business_justification=payload.business_justification,
        additional_remarks=payload.additional_remarks,
        supporting_document_url=payload.supporting_document_url,
        status=ProcurementStatus.PENDING,
        assigned_vendor_id=payload.assigned_vendor_id,
    )
    db.add(obj)
    db.flush()

    # Record initial status history
    _append_status_history(
        db=db,
        request_id=obj.id,
        old_status=None,
        new_status=ProcurementStatus.PENDING.value,
        changed_by=requested_by_user_id,
        remarks="Request created",
    )
    db.commit()
    db.refresh(obj)
    return obj


def get_procurement_request(db: Session, request_id: int) -> Optional[ProcurementRequest]:
    return db.query(ProcurementRequest).filter(ProcurementRequest.id == request_id).first()


def list_procurement_requests(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    status: Optional[ProcurementStatus] = None,
) -> List[ProcurementRequest]:
    q = db.query(ProcurementRequest)
    if status:
        q = q.filter(ProcurementRequest.status == status)
    return q.order_by(ProcurementRequest.created_at.desc()).offset(skip).limit(limit).all()


def update_procurement_request(
    db: Session,
    request_id: int,
    payload: ProcurementRequestUpdate,
    changed_by_user_id: int,
) -> Optional[ProcurementRequest]:
    obj = get_procurement_request(db, request_id)
    if not obj:
        return None

    old_status = obj.status.value if obj.status else None
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(obj, field, value)

    new_status = obj.status.value if obj.status else None
    if old_status != new_status and new_status:
        _append_status_history(
            db=db,
            request_id=obj.id,
            old_status=old_status,
            new_status=new_status,
            changed_by=changed_by_user_id,
            remarks=f"Status updated from {old_status} to {new_status}",
        )

    db.commit()
    db.refresh(obj)
    return obj


# ---------------------------------------------------------------------------
# ProcurementApproval CRUD
# ---------------------------------------------------------------------------

def create_approval(
    db: Session,
    payload: ProcurementApprovalCreate,
    approved_by_user_id: int,
) -> ProcurementApproval:
    obj = ProcurementApproval(
        request_id=payload.request_id,
        approval_status=payload.approval_status,
        approved_by=approved_by_user_id,
        remarks=payload.remarks,
    )
    db.add(obj)

    # Reflect approval in the parent request status
    req = get_procurement_request(db, payload.request_id)
    if req:
        old_status = req.status.value
        if payload.approval_status.value == "Approved":
            req.status = ProcurementStatus.APPROVED
        elif payload.approval_status.value == "Rejected":
            req.status = ProcurementStatus.CANCELLED
        db.flush()
        _append_status_history(
            db=db,
            request_id=req.id,
            old_status=old_status,
            new_status=req.status.value,
            changed_by=approved_by_user_id,
            remarks=payload.remarks,
        )

    db.commit()
    db.refresh(obj)
    return obj


def list_approvals(db: Session, request_id: int) -> List[ProcurementApproval]:
    return (
        db.query(ProcurementApproval)
        .filter(ProcurementApproval.request_id == request_id)
        .order_by(ProcurementApproval.approval_date.desc())
        .all()
    )


# ---------------------------------------------------------------------------
# PurchaseOrder CRUD
# ---------------------------------------------------------------------------

def create_purchase_order(
    db: Session,
    payload: PurchaseOrderCreate,
    approved_by_user_id: int,
) -> PurchaseOrder:
    po_number = _generate_po_number(db)
    obj = PurchaseOrder(
        po_number=po_number,
        request_id=payload.request_id,
        vendor_id=payload.vendor_id,
        product_details=payload.product_details,
        quantity_ordered=payload.quantity_ordered,
        unit_price=payload.unit_price,
        total_cost=payload.total_cost,
        tax_details=payload.tax_details,
        shipping_address=payload.shipping_address,
        expected_delivery_date=payload.expected_delivery_date,
        payment_terms=payload.payment_terms,
        po_status=payload.po_status or "Draft",
        approved_by=approved_by_user_id,
        po_date=payload.po_date or date.today(),
    )
    db.add(obj)
    db.flush()

    # Move parent request to ORDERED
    req = get_procurement_request(db, payload.request_id)
    if req:
        old_status = req.status.value
        req.status = ProcurementStatus.ORDERED
        _append_status_history(
            db=db,
            request_id=req.id,
            old_status=old_status,
            new_status=ProcurementStatus.ORDERED.value,
            changed_by=approved_by_user_id,
            remarks=f"Purchase Order {po_number} created",
        )

    db.commit()
    db.refresh(obj)
    return obj


def get_purchase_order(db: Session, po_id: int) -> Optional[PurchaseOrder]:
    return db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()


def list_purchase_orders(
    db: Session, skip: int = 0, limit: int = 50
) -> List[PurchaseOrder]:
    return (
        db.query(PurchaseOrder)
        .order_by(PurchaseOrder.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_purchase_order(
    db: Session, po_id: int, payload: PurchaseOrderUpdate
) -> Optional[PurchaseOrder]:
    obj = get_purchase_order(db, po_id)
    if not obj:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


# ---------------------------------------------------------------------------
# ProcurementStatusHistory (read only from service)
# ---------------------------------------------------------------------------

def _append_status_history(
    db: Session,
    request_id: int,
    old_status: Optional[str],
    new_status: str,
    changed_by: int,
    remarks: Optional[str] = None,
) -> ProcurementStatusHistory:
    h = ProcurementStatusHistory(
        request_id=request_id,
        old_status=old_status,
        new_status=new_status,
        changed_by=changed_by,
        remarks=remarks,
    )
    db.add(h)
    return h


def list_status_history(db: Session, request_id: int) -> List[ProcurementStatusHistory]:
    return (
        db.query(ProcurementStatusHistory)
        .filter(ProcurementStatusHistory.request_id == request_id)
        .order_by(ProcurementStatusHistory.changed_at.asc())
        .all()
    )


# ---------------------------------------------------------------------------
# OrderTracking CRUD
# ---------------------------------------------------------------------------

def create_order_tracking(
    db: Session, payload: OrderTrackingCreate
) -> OrderTracking:
    delay = _compute_delay_days(
        payload.expected_delivery_date, payload.actual_delivery_date
    )
    obj = OrderTracking(
        po_id=payload.po_id,
        dispatch_date=payload.dispatch_date,
        expected_delivery_date=payload.expected_delivery_date,
        actual_delivery_date=payload.actual_delivery_date,
        delivery_status=payload.delivery_status,
        delay_days=delay,
        remarks=payload.remarks,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_order_tracking_by_po(db: Session, po_id: int) -> Optional[OrderTracking]:
    return db.query(OrderTracking).filter(OrderTracking.po_id == po_id).first()


def update_order_tracking(
    db: Session, po_id: int, payload: OrderTrackingUpdate
) -> Optional[OrderTracking]:
    obj = get_order_tracking_by_po(db, po_id)
    if not obj:
        return None
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(obj, field, value)
    # recompute delay_days whenever dates are present
    obj.delay_days = _compute_delay_days(
        obj.expected_delivery_date, obj.actual_delivery_date
    )
    db.commit()
    db.refresh(obj)
    return obj


# ---------------------------------------------------------------------------
# Invoice CRUD
# ---------------------------------------------------------------------------

def create_invoice(
    db: Session,
    payload: InvoiceCreate,
    verified_by_user_id: Optional[int] = None,
) -> Invoice:
    obj = Invoice(
        invoice_number=payload.invoice_number,
        po_id=payload.po_id,
        vendor_id=payload.vendor_id,
        invoice_date=payload.invoice_date,
        invoice_amount=payload.invoice_amount,
        tax_amount=payload.tax_amount or Decimal("0"),
        total_amount=payload.total_amount,
        due_date=payload.due_date,
        payment_status=payload.payment_status,
        invoice_document_url=payload.invoice_document_url,
        verified_by=verified_by_user_id,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_invoice(db: Session, invoice_id: int) -> Optional[Invoice]:
    return db.query(Invoice).filter(Invoice.id == invoice_id).first()


def list_invoices_for_po(db: Session, po_id: int) -> List[Invoice]:
    return (
        db.query(Invoice)
        .filter(Invoice.po_id == po_id)
        .order_by(Invoice.invoice_date.desc())
        .all()
    )


def update_invoice(
    db: Session, invoice_id: int, payload: InvoiceUpdate
) -> Optional[Invoice]:
    obj = get_invoice(db, invoice_id)
    if not obj:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj
