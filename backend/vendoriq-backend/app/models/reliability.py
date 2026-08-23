import enum
import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, Float, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class TrendDirection(str, enum.Enum):
    IMPROVING = "IMPROVING"
    STABLE = "STABLE"
    DECLINING = "DECLINING"


class ReliabilityScore(Base):
    __tablename__ = "reliability_scores"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_id: Mapped[str] = mapped_column(String(36), ForeignKey("vendors.id"), nullable=False)

    # Sub-scores (0-100 each)
    delivery_score: Mapped[float] = mapped_column(Float, default=0)
    quality_score: Mapped[float] = mapped_column(Float, default=0)
    communication_score: Mapped[float] = mapped_column(Float, default=0)
    compliance_score: Mapped[float] = mapped_column(Float, default=0)
    purchase_history_score: Mapped[float] = mapped_column(Float, default=0)
    issue_resolution_score: Mapped[float] = mapped_column(Float, default=0)

    overall_score: Mapped[float] = mapped_column(Float, default=0)  # weighted 0-100
    risk_level: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel), default=RiskLevel.MEDIUM)
    trend: Mapped[TrendDirection] = mapped_column(Enum(TrendDirection), default=TrendDirection.STABLE)
    rank: Mapped[int | None] = mapped_column(nullable=True)

    recommendation: Mapped[str | None] = mapped_column(String(500), nullable=True)

    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    vendor = relationship("Vendor", back_populates="reliability_scores")
