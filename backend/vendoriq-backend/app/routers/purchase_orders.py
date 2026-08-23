from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_procurement, require_finance
from app.models.user import User
from app.models.procurement import PurchaseOrder, POStatus
from app.models.performance import VendorPerformance
from app.schemas.procurement import (
    PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderOut,
    PurchaseOrderStatusUpdate, InvoiceUpdate, PaymentStatusUpdate,
)
from app.services.code_generator import generate_po_number
from app.services.notification_service import create_notification
from app.services.status_history_service import log_status_change
from app.models.notification import NotificationType
from app.models.vendor import Vendor

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])


@router.post("", response_model=PurchaseOrderOut, status_code=201)
def create_purchase_order(payload: PurchaseOrderCreate, db: Session = Depends(get_db), current_user: User = Depends(require_procurement)):
    vendor = db.get(Vendor, payload.vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    total = round(payload.quantity * payload.unit_price, 2)
    po = PurchaseOrder(
        **payload.model_dump(),
        po_number=generate_po_number(),
        total_amount=total,
        created_by=current_user.id,
        status=POStatus.PENDING,
    )
    db.add(po)
    db.flush()
    log_status_change(
        db, entity_type="purchase_order", entity_id=po.id,
        old_status=None, new_status=po.status, changed_by=current_user.id,
        remarks="Purchase order created",
    )
    db.commit()
    db.refresh(po)
    return po


@router.get("", response_model=list[PurchaseOrderOut])
def list_purchase_orders(
    status_: POStatus | None = Query(default=None, alias="status"),
    vendor_id: str | None = None,
    skip: int = 0,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(PurchaseOrder)
    if status_:
        query = query.filter(PurchaseOrder.status == status_)
    if vendor_id:
        query = query.filter(PurchaseOrder.vendor_id == vendor_id)
    return query.order_by(PurchaseOrder.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{po_id}", response_model=PurchaseOrderOut)
def get_purchase_order(po_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    po = db.get(PurchaseOrder, po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return po


@router.put("/{po_id}", response_model=PurchaseOrderOut)
def update_purchase_order(po_id: str, payload: PurchaseOrderUpdate, db: Session = Depends(get_db), _: User = Depends(require_procurement)):
    po = db.get(PurchaseOrder, po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(po, field, value)
    if "quantity" in data or "unit_price" in data:
        po.total_amount = round(po.quantity * po.unit_price, 2)
    db.commit()
    db.refresh(po)
    return po


@router.put("/{po_id}/status", response_model=PurchaseOrderOut)
def update_status(po_id: str, payload: PurchaseOrderStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_procurement)):
    po = db.get(PurchaseOrder, po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    previous_status = po.status
    po.status = payload.status
    if payload.actual_delivery_date:
        po.actual_delivery_date = payload.actual_delivery_date

    log_status_change(
        db, entity_type="purchase_order", entity_id=po.id,
        old_status=previous_status, new_status=po.status, changed_by=current_user.id,
    )

    # Auto-generate a performance record on delivery/completion for reliability scoring
    if payload.status in (POStatus.DELIVERED, POStatus.COMPLETED) and previous_status not in (POStatus.DELIVERED, POStatus.COMPLETED):
        on_time = None
        delay_days = 0
        if po.expected_delivery_date and po.actual_delivery_date:
            delta = (po.actual_delivery_date - po.expected_delivery_date).days
            on_time = delta <= 0
            delay_days = max(0, delta)
        elif po.expected_delivery_date:
            on_time = date.today() <= po.expected_delivery_date

        record = VendorPerformance(
            vendor_id=po.vendor_id,
            purchase_order_id=po.id,
            record_date=date.today(),
            on_time_delivery=on_time,
            delivery_delay_days=delay_days,
            order_completed=payload.status == POStatus.COMPLETED,
            recorded_by=current_user.id,
        )
        db.add(record)

        if delay_days > 0:
            create_notification(
                db, user_id=po.created_by or current_user.id,
                title="Delivery Delay Notification",
                message=f"PO {po.po_number} was delivered {delay_days} day(s) late.",
                type=NotificationType.DELIVERY_DELAY,
            )

    db.commit()
    db.refresh(po)
    return po


@router.put("/{po_id}/invoice", response_model=PurchaseOrderOut)
def update_invoice(po_id: str, payload: InvoiceUpdate, db: Session = Depends(get_db), _: User = Depends(require_finance)):
    po = db.get(PurchaseOrder, po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    po.invoice_number = payload.invoice_number
    po.invoice_amount = payload.invoice_amount
    po.invoice_due_date = payload.invoice_due_date
    po.is_invoiced = True
    db.commit()
    db.refresh(po)
    return po


@router.put("/{po_id}/payment-status", response_model=PurchaseOrderOut)
def update_payment_status(po_id: str, payload: PaymentStatusUpdate, db: Session = Depends(get_db), _: User = Depends(require_finance)):
    po = db.get(PurchaseOrder, po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    po.payment_status = payload.payment_status
    db.commit()
    db.refresh(po)
    return po
