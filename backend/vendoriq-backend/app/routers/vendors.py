import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_procurement, require_admin
from app.models.user import User
from app.models.vendor import Vendor, VendorCategory, VendorStatus, VendorDocument
from app.schemas.vendor import VendorCreate, VendorUpdate, VendorOut, VendorApproval, VendorDocumentOut

router = APIRouter(prefix="/vendors", tags=["Vendor Management"])

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads", "vendor_documents")


@router.post("", response_model=VendorOut, status_code=201)
def register_vendor(payload: VendorCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if db.query(Vendor).filter(Vendor.contact_email == payload.contact_email).first():
        raise HTTPException(status_code=409, detail="A vendor with this contact email already exists")
    vendor = Vendor(**payload.model_dump(), created_by=current_user.id)
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.get("", response_model=list[VendorOut])
def list_vendors(
    category: VendorCategory | None = None,
    status_: VendorStatus | None = Query(default=None, alias="status"),
    search: str | None = None,
    skip: int = 0,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Vendor)
    if category:
        query = query.filter(Vendor.category == category)
    if status_:
        query = query.filter(Vendor.status == status_)
    if search:
        like = f"%{search}%"
        query = query.filter(Vendor.company_name.ilike(like))
    return query.order_by(Vendor.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{vendor_id}", response_model=VendorOut)
def get_vendor(vendor_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    vendor = db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@router.put("/{vendor_id}", response_model=VendorOut)
def update_vendor(vendor_id: str, payload: VendorUpdate, db: Session = Depends(get_db), _: User = Depends(require_procurement)):
    vendor = db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(vendor, field, value)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.put("/{vendor_id}/approval", response_model=VendorOut)
def approve_or_reject_vendor(
    vendor_id: str, payload: VendorApproval, db: Session = Depends(get_db), current_user: User = Depends(require_admin)
):
    vendor = db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if payload.approve:
        vendor.status = VendorStatus.APPROVED
        vendor.approved_by = current_user.id
        vendor.approved_at = datetime.now(timezone.utc)
        vendor.rejection_reason = None
    else:
        vendor.status = VendorStatus.REJECTED
        vendor.rejection_reason = payload.rejection_reason or "Not specified"

    db.commit()
    db.refresh(vendor)
    return vendor


@router.put("/{vendor_id}/suspend", response_model=VendorOut)
def suspend_vendor(vendor_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    vendor = db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor.status = VendorStatus.SUSPENDED
    db.commit()
    db.refresh(vendor)
    return vendor


@router.delete("/{vendor_id}", status_code=204)
def deactivate_vendor(vendor_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    vendor = db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor.status = VendorStatus.INACTIVE
    vendor.is_active = False
    db.commit()
    return None


@router.post("/{vendor_id}/documents", response_model=VendorDocumentOut, status_code=201)
def upload_vendor_document(
    vendor_id: str,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    vendor = db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1]
    stored_name = f"{uuid.uuid4()}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, stored_name)
    with open(dest_path, "wb") as f:
        f.write(file.file.read())

    doc = VendorDocument(
        vendor_id=vendor_id,
        document_type=document_type,
        file_name=file.filename or stored_name,
        file_path=dest_path,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{vendor_id}/documents", response_model=list[VendorDocumentOut])
def list_vendor_documents(vendor_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    vendor = db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return db.query(VendorDocument).filter(VendorDocument.vendor_id == vendor_id).all()
