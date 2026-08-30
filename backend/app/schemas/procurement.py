"""
Module 3 - Procurement Management: Pydantic Schemas
Provides Create / Update / Response schemas for all six procurement tables.
"""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.procurement import (
    ApprovalStatus,
    DeliveryStatus,
    PaymentStatus,
    ProcurementPriority,
    ProcurementStatus,
)


# ---------------------------------------------------------------------------
# ProcurementRequest
# ---------------------------------------------------------------------------

class ProcurementRequestCreate(BaseModel):
    request_title: str = Field(..., max_length=255)
    department_name: str = Field(..., max_length=150)
    # requested_by is taken from the authenticated user — never from client
    item_name: str = Field(..., max_length=255)
    product_category: str = Field(..., max_length=150)
    quantity: Decimal = Field(..., gt=0)
    unit_of_measurement: str = Field(..., max_length=50)
    estimated_budget: Decimal = Field(..., gt=0)
    required_delivery_date: date
    priority: ProcurementPriority = ProcurementPriority.MEDIUM
    business_justification: str
    additional_remarks: Optional[str] = None
    supporting_document_url: Optional[str] = Field(None, max_length=500)
    assigned_vendor_id: Optional[int] = None


class ProcurementRequestUpdate(BaseModel):
    request_title: Optional[str] = Field(None, max_length=255)
    department_name: Optional[str] = Field(None, max_length=150)
    item_name: Optional[str] = Field(None, max_length=255)
    product_category: Optional[str] = Field(None, max_length=150)
    quantity: Optional[Decimal] = Field(None, gt=0)
    unit_of_measurement: Optional[str] = Field(None, max_length=50)
    estimated_budget: Optional[Decimal] = Field(None, gt=0)
    required_delivery_date: Optional[date] = None
    priority: Optional[ProcurementPriority] = None
    business_justification: Optional[str] = None
    additional_remarks: Optional[str] = None
    supporting_document_url: Optional[str] = Field(None, max_length=500)
    status: Optional[ProcurementStatus] = None
    assigned_vendor_id: Optional[int] = None


class ProcurementRequestResponse(BaseModel):
    id: int
    request_number: str
    request_title: str
    department_name: str
    requested_by: int
    item_name: str
    product_category: str
    quantity: Decimal
    unit_of_measurement: str
    estimated_budget: Decimal
    required_delivery_date: date
    priority: ProcurementPriority
    business_justification: str
    additional_remarks: Optional[str] = None
    supporting_document_url: Optional[str] = None
    status: ProcurementStatus
    assigned_vendor_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# ProcurementApproval
# ---------------------------------------------------------------------------

class ProcurementApprovalCreate(BaseModel):
    request_id: int
    approval_status: ApprovalStatus
    # approved_by is taken from the authenticated user — never from client
    remarks: Optional[str] = None


class ProcurementApprovalUpdate(BaseModel):
    approval_status: Optional[ApprovalStatus] = None
    remarks: Optional[str] = None


class ProcurementApprovalResponse(BaseModel):
    id: int
    request_id: int
    approval_status: ApprovalStatus
    approved_by: int
    approval_date: datetime
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# PurchaseOrder
# ---------------------------------------------------------------------------

class PurchaseOrderCreate(BaseModel):
    request_id: int
    vendor_id: int
    product_details: str
    quantity_ordered: Decimal = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)
    total_cost: Decimal = Field(..., ge=0)
    tax_details: Optional[str] = None
    shipping_address: Optional[str] = None
    expected_delivery_date: Optional[date] = None
    payment_terms: Optional[str] = Field("Net 30", max_length=100)
    po_status: Optional[str] = "Draft"
    po_date: Optional[date] = None
    # approved_by comes from the authenticated user in the service layer


class PurchaseOrderUpdate(BaseModel):
    vendor_id: Optional[int] = None
    product_details: Optional[str] = None
    quantity_ordered: Optional[Decimal] = Field(None, gt=0)
    unit_price: Optional[Decimal] = Field(None, ge=0)
    total_cost: Optional[Decimal] = Field(None, ge=0)
    tax_details: Optional[str] = None
    shipping_address: Optional[str] = None
    expected_delivery_date: Optional[date] = None
    payment_terms: Optional[str] = Field(None, max_length=100)
    po_status: Optional[str] = None
    po_date: Optional[date] = None


class PurchaseOrderResponse(BaseModel):
    id: int
    po_number: str
    request_id: int
    vendor_id: int
    product_details: str
    quantity_ordered: Decimal
    unit_price: Decimal
    total_cost: Decimal
    tax_details: Optional[str] = None
    shipping_address: Optional[str] = None
    expected_delivery_date: Optional[date] = None
    payment_terms: Optional[str] = None
    po_status: str
    approved_by: Optional[int] = None
    po_date: Optional[date] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# ProcurementStatusHistory
# ---------------------------------------------------------------------------

class ProcurementStatusHistoryCreate(BaseModel):
    request_id: int
    old_status: Optional[str] = None
    new_status: str
    # changed_by is taken from the authenticated user in the service layer
    remarks: Optional[str] = None


class ProcurementStatusHistoryResponse(BaseModel):
    id: int
    request_id: int
    old_status: Optional[str] = None
    new_status: str
    changed_by: int
    changed_at: datetime
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# OrderTracking
# ---------------------------------------------------------------------------

class OrderTrackingCreate(BaseModel):
    po_id: int
    dispatch_date: Optional[date] = None
    expected_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    delivery_status: DeliveryStatus = DeliveryStatus.AWAITING_SHIPMENT
    remarks: Optional[str] = None


class OrderTrackingUpdate(BaseModel):
    dispatch_date: Optional[date] = None
    expected_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    delivery_status: Optional[DeliveryStatus] = None
    remarks: Optional[str] = None
    # delay_days is computed by the service layer, not accepted from client


class OrderTrackingResponse(BaseModel):
    id: int
    po_id: int
    dispatch_date: Optional[date] = None
    expected_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    delivery_status: DeliveryStatus
    delay_days: Optional[int] = None
    remarks: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Invoice
# ---------------------------------------------------------------------------

class InvoiceCreate(BaseModel):
    invoice_number: str = Field(..., max_length=50)
    po_id: int
    vendor_id: int
    invoice_date: date
    invoice_amount: Decimal = Field(..., ge=0)
    tax_amount: Optional[Decimal] = Field(Decimal("0"), ge=0)
    total_amount: Decimal = Field(..., ge=0)
    due_date: Optional[date] = None
    payment_status: PaymentStatus = PaymentStatus.PENDING
    invoice_document_url: Optional[str] = Field(None, max_length=500)
    # verified_by comes from the authenticated user in the service layer


class InvoiceUpdate(BaseModel):
    invoice_date: Optional[date] = None
    invoice_amount: Optional[Decimal] = Field(None, ge=0)
    tax_amount: Optional[Decimal] = Field(None, ge=0)
    total_amount: Optional[Decimal] = Field(None, ge=0)
    due_date: Optional[date] = None
    payment_status: Optional[PaymentStatus] = None
    invoice_document_url: Optional[str] = Field(None, max_length=500)
    verified_by: Optional[int] = None


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    po_id: int
    vendor_id: int
    invoice_date: date
    invoice_amount: Decimal
    tax_amount: Optional[Decimal] = None
    total_amount: Decimal
    due_date: Optional[date] = None
    payment_status: PaymentStatus
    invoice_document_url: Optional[str] = None
    verified_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Nested / enriched response used for list views
# ---------------------------------------------------------------------------

class ProcurementRequestListItem(BaseModel):
    """Lightweight response for paginated list views — no nested relations."""
    id: int
    request_number: str
    request_title: str
    department_name: str
    requested_by: int
    product_category: str
    estimated_budget: Decimal
    required_delivery_date: date
    priority: ProcurementPriority
    status: ProcurementStatus
    created_at: datetime

    class Config:
        from_attributes = True
