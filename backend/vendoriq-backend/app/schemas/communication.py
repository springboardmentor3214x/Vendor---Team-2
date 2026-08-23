from datetime import datetime
from pydantic import BaseModel

from app.models.communication import MessageChannel


class CommunicationCreate(BaseModel):
    vendor_id: str
    subject: str | None = None
    message: str
    channel: MessageChannel = MessageChannel.IN_APP
    attachment_url: str | None = None


class CommunicationOut(CommunicationCreate):
    id: str
    sender_id: str
    is_read: bool
    responded_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True
