from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.communication import Communication
from app.models.vendor import Vendor
from app.schemas.communication import CommunicationCreate, CommunicationOut

router = APIRouter(prefix="/communications", tags=["Communication"])


@router.post("", response_model=CommunicationOut, status_code=201)
def send_message(payload: CommunicationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vendor = db.get(Vendor, payload.vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    msg = Communication(**payload.model_dump(), sender_id=current_user.id)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.get("", response_model=list[CommunicationOut])
def list_messages(
    vendor_id: str | None = None,
    skip: int = 0,
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Communication)
    if vendor_id:
        query = query.filter(Communication.vendor_id == vendor_id)
    return query.order_by(Communication.created_at.desc()).offset(skip).limit(limit).all()


@router.put("/{message_id}/read", response_model=CommunicationOut)
def mark_read(message_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    msg = db.get(Communication, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.is_read = True
    db.commit()
    db.refresh(msg)
    return msg


@router.put("/{message_id}/respond", response_model=CommunicationOut)
def mark_responded(message_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    msg = db.get(Communication, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.responded_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(msg)
    return msg
