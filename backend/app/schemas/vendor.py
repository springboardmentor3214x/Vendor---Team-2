from pydantic import BaseModel, EmailStr
from typing import Optional, List
from app.models.vendor import VendorCategory, VendorStatus, VendorApprovalStatus
from datetime import datetime

# --- Vendor Document ---
class VendorDocumentBase(BaseModel):
    document_type: str
    file_name: str
    file_path: str
    file_size: Optional[str] = None

class VendorDocumentCreate(VendorDocumentBase):
    vendor_id: int
    uploaded_by: Optional[str] = None

class VendorDocumentOut(VendorDocumentBase):
    id: int
    vendor_id: int
    upload_date: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Vendor ---
class VendorBase(BaseModel):
    company_name: str
    category: VendorCategory

    # Primary Contact
    contact_person: str
    designation: Optional[str] = None
    email: EmailStr
    phone: str
    alternate_phone: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None

    # Tax & Compliance
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    company_registration_number: Optional[str] = None

    # Address
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    pincode: Optional[str] = None

    # Bank Info
    bank_account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_name: Optional[str] = None
    payment_terms: Optional[str] = "Net 30"

class VendorCreate(VendorBase):
    created_by: Optional[str] = None

class VendorUpdate(BaseModel):
    company_name: Optional[str] = None
    category: Optional[VendorCategory] = None
    contact_person: Optional[str] = None
    designation: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    alternate_phone: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    company_registration_number: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None
    bank_account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_name: Optional[str] = None
    payment_terms: Optional[str] = None
    status: Optional[VendorStatus] = None
    last_updated_by: Optional[str] = None

class VendorApprovalAction(BaseModel):
    approved_by: str

class VendorOut(VendorBase):
    id: int
    vendor_code: Optional[str] = None
    status: VendorStatus
    approval_status: VendorApprovalStatus
    created_by: Optional[str] = None
    created_date: Optional[datetime] = None
    last_updated_by: Optional[str] = None
    last_updated_date: Optional[datetime] = None
    approved_by: Optional[str] = None
    approved_date: Optional[datetime] = None
    documents: List[VendorDocumentOut] = []

    class Config:
        from_attributes = True

# For listing (no documents)
class VendorListItem(BaseModel):
    id: int
    vendor_code: Optional[str] = None
    company_name: str
    category: VendorCategory
    contact_person: str
    email: str
    phone: str
    status: VendorStatus
    approval_status: VendorApprovalStatus
    city: Optional[str] = None
    state: Optional[str] = None
    created_date: Optional[datetime] = None

    class Config:
        from_attributes = True
