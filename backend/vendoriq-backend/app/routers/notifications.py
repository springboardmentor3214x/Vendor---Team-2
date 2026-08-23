from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationOut
from app.services.notification_service import create_notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.post("", response_model=NotificationOut, status_code=201)
def send_notification(payload: NotificationCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return create_notification(
        db, user_id=payload.user_id, title=payload.title, message=payload.message,
        type=payload.type, channel=payload.channel, link=payload.link,
    )


@router.get("/me", response_model=list[NotificationOut])
def my_notifications(
    unread_only: bool = False,
    skip: int = 0,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))
    return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()


@router.put("/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notif = db.get(Notification, notification_id)
    if not notif or notif.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.put("/read-all", status_code=200)
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.is_read.is_(False)
    ).update({"is_read": True})
    db.commit()
    return {"detail": "All notifications marked as read."}
