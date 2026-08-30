from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class VendorCategory(str, enum.Enum):
    RAW_MATERIALS = "Raw Material Suppliers"
    EQUIPMENT = "Equipment Vendors"
    IT = "IT Vendors"
    SERVICES = "Service Providers"
    LOGISTICS = "Logistics Partners"
    MAINTENANCE = "Maintenance Vendors"

class VendorStatus(str, enum.Enum):
    ACTIVE = "Active"
    PENDING = "Pending"
    INACTIVE = "Inactive"
    SUSPENDED = "Suspended"
    REJECTED = "Rejected"

class VendorApprovalStatus(str, enum.Enum):
    APPROVED = "Approved"
    PENDING = "Pending"
    REJECTED = "Rejected"

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    vendor_code = Column(String, unique=True, nullable=True, index=True)  # e.g. VND-001
    company_name = Column(String, nullable=False, index=True, unique=True)
    category = Column(Enum(VendorCategory), nullable=False)
    
    # Primary Contact Info
    contact_person = Column(String, nullable=False)
    designation = Column(String, nullable=True)
    email = Column(String, nullable=False, unique=True)
    phone = Column(String, nullable=False)
    alternate_phone = Column(String, nullable=True)
    website = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    
    # Tax and Compliance Info
    gst_number = Column(String, nullable=True, unique=True)
    pan_number = Column(String, nullable=True, unique=True)
    company_registration_number = Column(String, nullable=True, unique=True)
    
    # Address Info
    address_line_1 = Column(String, nullable=True)
    address_line_2 = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True, default="India")
    pincode = Column(String, nullable=True)
    
    # Bank Info
    bank_account_number = Column(String, nullable=True)
    ifsc_code = Column(String, nullable=True)
    bank_name = Column(String, nullable=True)
    payment_terms = Column(String, nullable=True, default="Net 30")

    # Status
    status = Column(Enum(VendorStatus), default=VendorStatus.PENDING)
    approval_status = Column(Enum(VendorApprovalStatus), default=VendorApprovalStatus.PENDING)

    # Audit Info
    created_by = Column(String, nullable=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    last_updated_by = Column(String, nullable=True)
    last_updated_date = Column(DateTime(timezone=True), onupdate=func.now())
    approved_by = Column(String, nullable=True)
    approved_date = Column(DateTime(timezone=True), nullable=True)

    documents = relationship("VendorDocument", back_populates="vendor", cascade="all, delete-orphan")


class VendorDocument(Base):
    __tablename__ = "vendor_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    document_type = Column(String, nullable=False)  # "GST Certificate", "PAN", "ISO", "Other"
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(String, nullable=True)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    uploaded_by = Column(String, nullable=True)
    
    vendor = relationship("Vendor", back_populates="documents")
