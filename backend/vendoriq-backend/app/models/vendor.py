import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, Enum, Float, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class VendorCategory(str, enum.Enum):
    RAW_MATERIAL_SUPPLIER = "RAW_MATERIAL_SUPPLIER"
    EQUIPMENT_VENDOR = "EQUIPMENT_VENDOR"
    IT_VENDOR = "IT_VENDOR"
    SERVICE_PROVIDER = "SERVICE_PROVIDER"
    LOGISTICS_PARTNER = "LOGISTICS_PARTNER"
    MAINTENANCE_VENDOR = "MAINTENANCE_VENDOR"


class VendorStatus(str, enum.Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"
    INACTIVE = "INACTIVE"


class Vendor(Base):
    __tablename__ = "vendors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    registration_number: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    category: Mapped[VendorCategory] = mapped_column(Enum(VendorCategory), nullable=False)
    status: Mapped[VendorStatus] = mapped_column(Enum(VendorStatus), default=VendorStatus.PENDING_APPROVAL)

    contact_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)

    address_line: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)

    tax_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Contact detail — single primary contact (the UI only ever shows one)
    designation: Mapped[str | None] = mapped_column(String(150), nullable=True)
    alternate_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Compliance / financial detail (India-specific fields the frontend expects)
    gst_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    pan_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    bank_account_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ifsc_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    payment_terms: Mapped[str | None] = mapped_column(String(50), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    approved_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    performance_records = relationship("VendorPerformance", back_populates="vendor", cascade="all, delete-orphan")
    reliability_scores = relationship("ReliabilityScore", back_populates="vendor", cascade="all, delete-orphan")
    contracts = relationship("Contract", back_populates="vendor", cascade="all, delete-orphan")
    purchase_orders = relationship("PurchaseOrder", back_populates="vendor")
    communications = relationship("Communication", back_populates="vendor")
    documents = relationship("VendorDocument", back_populates="vendor", cascade="all, delete-orphan")


class VendorDocument(Base):
    __tablename__ = "vendor_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_id: Mapped[str] = mapped_column(String(36), ForeignKey("vendors.id"), nullable=False, index=True)
    document_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    vendor = relationship("Vendor", back_populates="documents")
