import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class StatusHistory(Base):
    """Generic status-change audit log, shared by procurement requests and
    purchase orders (entity_type distinguishes them) — powers the
    Order Tracking / status-history timeline views."""
    __tablename__ = "status_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_type: Mapped[str] = mapped_column(String(30), nullable=False)  # "procurement_request" | "purchase_order"
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    old_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    changed_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    remarks: Mapped[str | None] = mapped_column(String(500), nullable=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
