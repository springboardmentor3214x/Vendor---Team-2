from datetime import datetime, date
from pydantic import BaseModel, Field


class VendorPerformanceCreate(BaseModel):
    vendor_id: str
    purchase_order_id: str | None = None
    record_date: date

    # Delivery
    expected_delivery_date: date | None = None
    actual_delivery_date: date | None = None
    on_time_delivery: bool | None = None
    delivery_delay_days: int = 0
    delivery_remarks: str | None = None

    # Quality
    material_quality: float | None = Field(default=None, ge=0, le=5)
    packaging_quality: float | None = Field(default=None, ge=0, le=5)
    quantity_accuracy: float | None = Field(default=None, ge=0, le=5)
    specification_compliance: float | None = Field(default=None, ge=0, le=5)
    product_defects: str | None = None
    quality_rating: float | None = Field(default=None, ge=0, le=5)
    quality_remarks: str | None = None

    # Communication
    message_sent_time: datetime | None = None
    vendor_response_time: datetime | None = None
    response_time_hours: float | None = None
    communication_status: str | None = None
    communication_remarks: str | None = None

    # Service
    professionalism: float | None = Field(default=None, ge=0, le=5)
    customer_support: float | None = Field(default=None, ge=0, le=5)
    documentation_quality: float | None = Field(default=None, ge=0, le=5)
    flexibility: float | None = Field(default=None, ge=0, le=5)
    communication_effectiveness: float | None = Field(default=None, ge=0, le=5)
    issue_resolution_time_hours: float | None = None
    issue_resolution: float | None = Field(default=None, ge=0, le=5)
    service_rating: float | None = Field(default=None, ge=0, le=5)
    service_comments: str | None = None

    order_completed: bool = False
    remarks: str | None = None


class VendorPerformanceOut(VendorPerformanceCreate):
    id: str
    recorded_by: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class VendorPerformanceSummary(BaseModel):
    vendor_id: str
    total_orders: int
    on_time_deliveries: int
    delayed_deliveries: int
    on_time_delivery_rate: float
    avg_quality_rating: float | None
    avg_response_time_hours: float | None
    avg_issue_resolution_time_hours: float | None
    order_completion_rate: float
