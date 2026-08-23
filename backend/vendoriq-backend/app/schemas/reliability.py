from datetime import datetime
from pydantic import BaseModel

from app.models.reliability import RiskLevel, TrendDirection


class ReliabilityScoreOut(BaseModel):
    id: str
    vendor_id: str
    delivery_score: float
    quality_score: float
    communication_score: float
    compliance_score: float
    purchase_history_score: float
    issue_resolution_score: float
    overall_score: float
    risk_level: RiskLevel
    trend: TrendDirection
    rank: int | None = None
    recommendation: str | None = None
    calculated_at: datetime

    class Config:
        from_attributes = True


class VendorRankingEntry(BaseModel):
    vendor_id: str
    company_name: str
    overall_score: float
    risk_level: RiskLevel
    rank: int
