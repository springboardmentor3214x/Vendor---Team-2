import uuid
from datetime import datetime, date

from sqlalchemy import String, DateTime, Float, Integer, Date, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class VendorPerformance(Base):
    """A per-purchase-order performance record used to compute reliability.

    Grouped by the four categories the UI tracks per PO: delivery, quality,
    communication, and service. All the category-specific sub-metrics are
    optional so a record can be filled in incrementally as each stage
    happens (e.g. delivery fields at receipt, quality fields after
    inspection).
    """
    __tablename__ = "vendor_performance"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_id: Mapped[str] = mapped_column(String(36), ForeignKey("vendors.id"), nullable=False)
    purchase_order_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("purchase_orders.id"), nullable=True)

    record_date: Mapped[date] = mapped_column(Date, nullable=False)

    # ── Delivery ────────────────────────────────────────────────────────
    expected_delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    on_time_delivery: Mapped[bool | None] = mapped_column(nullable=True)
    delivery_delay_days: Mapped[int] = mapped_column(Integer, default=0)
    delivery_remarks: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # ── Quality ──────────────────────────────────────────────────────────
    material_quality: Mapped[float | None] = mapped_column(Float, nullable=True)          # 1-5
    packaging_quality: Mapped[float | None] = mapped_column(Float, nullable=True)          # 1-5
    quantity_accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)          # 1-5
    specification_compliance: Mapped[float | None] = mapped_column(Float, nullable=True)   # 1-5
    product_defects: Mapped[str | None] = mapped_column(String(500), nullable=True)
    quality_rating: Mapped[float | None] = mapped_column(Float, nullable=True)   # 0-5 overall (derived client-side, stored for convenience)
    quality_remarks: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # ── Communication ────────────────────────────────────────────────────
    message_sent_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    vendor_response_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    response_time_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    communication_status: Mapped[str | None] = mapped_column(String(30), nullable=True)  # Awaiting Response|Responded|SLA Breach
    communication_remarks: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # ── Service ──────────────────────────────────────────────────────────
    professionalism: Mapped[float | None] = mapped_column(Float, nullable=True)             # 1-5
    customer_support: Mapped[float | None] = mapped_column(Float, nullable=True)             # 1-5
    documentation_quality: Mapped[float | None] = mapped_column(Float, nullable=True)        # 1-5
    flexibility: Mapped[float | None] = mapped_column(Float, nullable=True)                  # 1-5
    communication_effectiveness: Mapped[float | None] = mapped_column(Float, nullable=True)  # 1-5
    issue_resolution_time_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    issue_resolution: Mapped[float | None] = mapped_column(Float, nullable=True)             # 1-5 rating
    service_rating: Mapped[float | None] = mapped_column(Float, nullable=True)  # 0-5 overall (derived client-side, stored for convenience)
    service_comments: Mapped[str | None] = mapped_column(String(500), nullable=True)

    order_completed: Mapped[bool] = mapped_column(default=False)

    remarks: Mapped[str | None] = mapped_column(String(500), nullable=True)
    recorded_by: Mapped[str | None] = mapped_column(String(36), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    vendor = relationship("Vendor", back_populates="performance_records")
