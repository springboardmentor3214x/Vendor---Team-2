from datetime import datetime
from pydantic import BaseModel


class StatusHistoryOut(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    old_status: str | None
    new_status: str
    changed_by: str | None
    remarks: str | None
    changed_at: datetime

    class Config:
        from_attributes = True
