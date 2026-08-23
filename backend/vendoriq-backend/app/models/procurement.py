import enum
import uuid
from datetime import datetime, date

from sqlalchemy import String, DateTime, Enum, Float, Integer, Text, ForeignKey, Date, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ProcurementStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    ORDERED = "ORDERED"
    DELIVERED = "DELIVERED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class ProcurementPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class POStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    ORDERED = "ORDERED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class ProcurementRequest(Base):
    __tablename__ = "procurement_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    requested_by: Mapped[str] = mapped_column(String(36), nullable=False)
    vendor_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("vendors.id"), nullable=True)

    estimated_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)

    status: Mapped[ProcurementStatus] = mapped_column(Enum(ProcurementStatus), default=ProcurementStatus.PENDING)
    priority: Mapped[ProcurementPriority] = mapped_column(Enum(ProcurementPriority), default=ProcurementPriority.MEDIUM)
    approved_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)

    needed_by: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    purchase_orders = relationship("PurchaseOrder", back_populates="procurement_request")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    po_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    procurement_request_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("procurement_requests.id"), nullable=True)
    vendor_id: Mapped[str] = mapped_column(String(36), ForeignKey("vendors.id"), nullable=False)

    item_description: Mapped[str] = mapped_column(String(500), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR")

    status: Mapped[POStatus] = mapped_column(Enum(POStatus), default=POStatus.DRAFT)

    expected_delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    is_invoiced: Mapped[bool] = mapped_column(default=False)
    invoice_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    invoice_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    invoice_due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    payment_status: Mapped[str] = mapped_column(String(20), default="Unpaid")  # Unpaid|Partial|Paid

    created_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    vendor = relationship("Vendor", back_populates="purchase_orders")
    procurement_request = relationship("ProcurementRequest", back_populates="purchase_orders")
