from datetime import datetime, date
from pydantic import BaseModel

from app.models.procurement import ProcurementStatus, POStatus, ProcurementPriority


class ProcurementRequestBase(BaseModel):
    title: str
    description: str | None = None
    department: str | None = None
    vendor_id: str | None = None
    estimated_cost: float | None = None
    quantity: int | None = None
    unit: str | None = None
    needed_by: date | None = None
    priority: ProcurementPriority = ProcurementPriority.MEDIUM


class ProcurementRequestCreate(ProcurementRequestBase):
    pass


class ProcurementRequestUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    vendor_id: str | None = None
    estimated_cost: float | None = None
    quantity: int | None = None
    unit: str | None = None
    needed_by: date | None = None
    priority: ProcurementPriority | None = None


class ProcurementApproval(BaseModel):
    approve: bool
    rejection_reason: str | None = None


class ProcurementStatusUpdate(BaseModel):
    status: ProcurementStatus
    remarks: str | None = None


class ProcurementRequestOut(ProcurementRequestBase):
    id: str
    request_code: str
    requested_by: str
    status: ProcurementStatus
    approved_by: str | None = None
    approved_at: datetime | None = None
    rejection_reason: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PurchaseOrderBase(BaseModel):
    vendor_id: str
    procurement_request_id: str | None = None
    item_description: str
    quantity: int
    unit_price: float
    currency: str = "INR"
    expected_delivery_date: date | None = None


class PurchaseOrderCreate(PurchaseOrderBase):
    pass


class PurchaseOrderUpdate(BaseModel):
    item_description: str | None = None
    quantity: int | None = None
    unit_price: float | None = None
    expected_delivery_date: date | None = None
    actual_delivery_date: date | None = None


class PurchaseOrderStatusUpdate(BaseModel):
    status: POStatus
    actual_delivery_date: date | None = None


class InvoiceUpdate(BaseModel):
    invoice_number: str
    invoice_amount: float
    invoice_due_date: date | None = None


class PaymentStatusUpdate(BaseModel):
    payment_status: str  # Unpaid|Partial|Paid


class PurchaseOrderOut(PurchaseOrderBase):
    id: str
    po_number: str
    total_amount: float
    status: POStatus
    actual_delivery_date: date | None = None
    is_invoiced: bool
    invoice_number: str | None = None
    invoice_amount: float | None = None
    invoice_due_date: date | None = None
    payment_status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
