from datetime import datetime
from pydantic import BaseModel

from app.models.notification import NotificationType, NotificationChannel


class NotificationCreate(BaseModel):
    user_id: str
    type: NotificationType = NotificationType.SYSTEM
    channel: NotificationChannel = NotificationChannel.IN_APP
    title: str
    message: str
    link: str | None = None


class NotificationOut(NotificationCreate):
    id: str
    is_read: bool
    sent: bool
    created_at: datetime

    class Config:
        from_attributes = True
