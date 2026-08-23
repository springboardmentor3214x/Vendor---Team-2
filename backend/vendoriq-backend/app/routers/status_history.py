from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.status_history import StatusHistory
from app.schemas.status_history import StatusHistoryOut

router = APIRouter(prefix="/status-history", tags=["Status History"])


@router.get("/{entity_type}/{entity_id}", response_model=list[StatusHistoryOut])
def get_entity_history(
    entity_type: str, entity_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    return (
        db.query(StatusHistory)
        .filter(StatusHistory.entity_type == entity_type, StatusHistory.entity_id == entity_id)
        .order_by(StatusHistory.changed_at.desc())
        .all()
    )


@router.get("", response_model=list[StatusHistoryOut])
def get_all_history(
    entity_type: str | None = Query(default=None),
    limit: int = Query(200, le=1000),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(StatusHistory)
    if entity_type:
        query = query.filter(StatusHistory.entity_type == entity_type)
    return query.order_by(StatusHistory.changed_at.desc()).limit(limit).all()
