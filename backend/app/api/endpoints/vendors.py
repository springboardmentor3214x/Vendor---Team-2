import os
import uuid
from typing import Any, List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from app import schemas
from app.api import deps
from app.models.vendor import Vendor, VendorDocument, VendorStatus, VendorApprovalStatus
from app.models.user import User, UserRole

router = APIRouter()

UPLOAD_DIR = "uploads/vendor_documents"
ALLOWED_TYPES = {"application/pdf", "image/jpeg", "image/png"}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB


def _generate_vendor_code(db: Session) -> str:
    count = db.query(Vendor).count()
    return f"VND-{str(count + 1).zfill(3)}"


def _check_uniqueness(db: Session, vendor_in, exclude_id: Optional[int] = None):
    """Raises HTTPException if any unique-constrained field already exists."""
    def check(field, value, label):
        if not value:
            return
        q = db.query(Vendor).filter(field == value)
        if exclude_id:
            q = q.filter(Vendor.id != exclude_id)
        if q.first():
            raise HTTPException(status_code=400, detail=f"{label} is already registered to another vendor")
    
    check(Vendor.company_name, getattr(vendor_in, "company_name", None), "Company name")
    check(Vendor.email, getattr(vendor_in, "email", None), "Email address")
    check(Vendor.gst_number, getattr(vendor_in, "gst_number", None), "GST number")
    check(Vendor.pan_number, getattr(vendor_in, "pan_number", None), "PAN number")
    check(Vendor.company_registration_number, getattr(vendor_in, "company_registration_number", None), "Company registration number")


@router.get("/", response_model=List[schemas.VendorListItem])
def read_vendors(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Search by name, ID, or GST"),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    approval_status: Optional[str] = Query(None),
    active_only: Optional[bool] = Query(False, description="Only return Active+Approved vendors (for procurement)"),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Retrieve vendors with optional search/filter. Available to all authenticated users."""
    q = db.query(Vendor)
    
    if active_only:
        q = q.filter(
            Vendor.status == VendorStatus.ACTIVE,
            Vendor.approval_status == VendorApprovalStatus.APPROVED
        )
    else:
        if search:
            q = q.filter(
                Vendor.company_name.ilike(f"%{search}%") |
                Vendor.vendor_code.ilike(f"%{search}%") |
                Vendor.gst_number.ilike(f"%{search}%") |
                Vendor.email.ilike(f"%{search}%") |
                Vendor.contact_person.ilike(f"%{search}%")
            )
        if category:
            q = q.filter(Vendor.category == category)
        if status:
            q = q.filter(Vendor.status == status)
        if approval_status:
            q = q.filter(Vendor.approval_status == approval_status)

    vendors = q.offset(skip).limit(limit).all()
    return vendors


@router.post("/", response_model=schemas.Vendor)
def create_vendor(
    *,
    db: Session = Depends(deps.get_db),
    vendor_in: schemas.VendorCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Create a new vendor. Checks for uniqueness of company name, email, GST, PAN, CRN."""
    _check_uniqueness(db, vendor_in)
    
    vendor = Vendor(
        vendor_code=_generate_vendor_code(db),
        company_name=vendor_in.company_name,
        category=vendor_in.category,
        contact_person=vendor_in.contact_person,
        designation=vendor_in.designation,
        email=vendor_in.email,
        phone=vendor_in.phone,
        alternate_phone=vendor_in.alternate_phone,
        website=vendor_in.website,
        description=vendor_in.description,
        gst_number=vendor_in.gst_number,
        pan_number=vendor_in.pan_number,
        company_registration_number=vendor_in.company_registration_number,
        address_line_1=vendor_in.address_line_1,
        address_line_2=vendor_in.address_line_2,
        city=vendor_in.city,
        state=vendor_in.state,
        country=vendor_in.country or "India",
        pincode=vendor_in.pincode,
        bank_account_number=vendor_in.bank_account_number,
        ifsc_code=vendor_in.ifsc_code,
        bank_name=vendor_in.bank_name,
        payment_terms=vendor_in.payment_terms or "Net 30",
        status=VendorStatus.PENDING,
        approval_status=VendorApprovalStatus.PENDING,
        created_by=vendor_in.created_by or current_user.full_name,
    )
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.get("/{vendor_id}", response_model=schemas.Vendor)
def get_vendor(
    vendor_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get a single vendor by ID (full details)."""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@router.put("/{vendor_id}", response_model=schemas.Vendor)
def update_vendor(
    *,
    db: Session = Depends(deps.get_db),
    vendor_id: int,
    vendor_in: schemas.VendorUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Update a vendor's information. Checks uniqueness of changed fields."""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Only Admin / Procurement Managers can update others
    if current_user.role not in [UserRole.ADMIN, UserRole.PROCUREMENT_MANAGER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    _check_uniqueness(db, vendor_in, exclude_id=vendor_id)
    
    update_data = vendor_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(vendor, key, value)
    vendor.last_updated_by = current_user.full_name
    
    db.commit()
    db.refresh(vendor)
    return vendor


@router.delete("/{vendor_id}")
def delete_vendor(
    *,
    db: Session = Depends(deps.get_db),
    vendor_id: int,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """Delete a vendor (Administrator only)."""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    db.delete(vendor)
    db.commit()
    return {"message": f"Vendor {vendor_id} deleted successfully"}


@router.post("/{vendor_id}/approve", response_model=schemas.Vendor)
def approve_vendor(
    *,
    db: Session = Depends(deps.get_db),
    vendor_id: int,
    current_user: User = Depends(deps.get_current_privileged_user),
) -> Any:
    """Approve a vendor (Administrator or Procurement Manager)."""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if vendor.approval_status == VendorApprovalStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Vendor is already approved")
    
    vendor.approval_status = VendorApprovalStatus.APPROVED
    vendor.status = VendorStatus.ACTIVE
    vendor.approved_by = current_user.full_name
    vendor.approved_date = datetime.utcnow()
    db.commit()
    db.refresh(vendor)
    return vendor


@router.post("/{vendor_id}/reject", response_model=schemas.Vendor)
def reject_vendor(
    *,
    db: Session = Depends(deps.get_db),
    vendor_id: int,
    current_user: User = Depends(deps.get_current_privileged_user),
) -> Any:
    """Reject a vendor (Administrator or Procurement Manager)."""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    vendor.approval_status = VendorApprovalStatus.REJECTED
    vendor.status = VendorStatus.REJECTED
    vendor.last_updated_by = current_user.full_name
    db.commit()
    db.refresh(vendor)
    return vendor


@router.post("/{vendor_id}/documents", response_model=schemas.VendorDocumentOut)
async def upload_vendor_document(
    vendor_id: int,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Upload a document for a vendor. Supports PDF, JPG, PNG up to 2MB."""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF, JPG and PNG are supported"
        )
    
    # Validate file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds maximum allowed 2MB")
    
    # Save file
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "file")[1]
    saved_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, saved_name)
    with open(file_path, "wb") as f:
        f.write(content)
    
    size_str = f"{len(content) / (1024 * 1024):.2f} MB"
    doc = VendorDocument(
        vendor_id=vendor_id,
        document_type=document_type,
        file_name=file.filename or saved_name,
        file_path=file_path,
        file_size=size_str,
        uploaded_by=current_user.full_name,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


# Helper dependency used in this file
def get_current_active_admin(
    current_user: User = Depends(deps.get_current_user),
) -> User:
    if current_user.role not in [UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Administrator access required")
    return current_user


def get_current_privileged_user(
    current_user: User = Depends(deps.get_current_user),
) -> User:
    if current_user.role not in [UserRole.ADMIN, UserRole.PROCUREMENT_MANAGER]:
        raise HTTPException(status_code=403, detail="Administrator or Procurement Manager access required")
    return current_user
