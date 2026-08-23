from datetime import datetime
from pydantic import BaseModel, EmailStr

from app.models.vendor import VendorCategory, VendorStatus


class VendorBase(BaseModel):
    company_name: str
    registration_number: str | None = None
    category: VendorCategory
    contact_name: str | None = None
    contact_email: EmailStr
    contact_phone: str | None = None
    designation: str | None = None
    alternate_phone: str | None = None
    address_line: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    tax_id: str | None = None
    website: str | None = None
    notes: str | None = None
    gst_number: str | None = None
    pan_number: str | None = None
    bank_account_number: str | None = None
    ifsc_code: str | None = None
    bank_name: str | None = None
    payment_terms: str | None = None


class VendorCreate(VendorBase):
    pass


class VendorUpdate(BaseModel):
    company_name: str | None = None
    category: VendorCategory | None = None
    contact_name: str | None = None
    contact_email: EmailStr | None = None
    contact_phone: str | None = None
    designation: str | None = None
    alternate_phone: str | None = None
    address_line: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    tax_id: str | None = None
    website: str | None = None
    notes: str | None = None
    gst_number: str | None = None
    pan_number: str | None = None
    bank_account_number: str | None = None
    ifsc_code: str | None = None
    bank_name: str | None = None
    payment_terms: str | None = None
    is_active: bool | None = None


class VendorApproval(BaseModel):
    approve: bool
    rejection_reason: str | None = None


class VendorDocumentOut(BaseModel):
    id: str
    vendor_id: str
    document_type: str
    file_name: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class VendorOut(VendorBase):
    id: str
    status: VendorStatus
    is_active: bool
    approved_by: str | None = None
    approved_at: datetime | None = None
    rejection_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    documents: list[VendorDocumentOut] = []

    class Config:
        from_attributes = True
