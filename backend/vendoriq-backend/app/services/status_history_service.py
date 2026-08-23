from sqlalchemy.orm import Session

from app.models.status_history import StatusHistory


def log_status_change(
    db: Session,
    entity_type: str,
    entity_id: str,
    old_status: str | None,
    new_status: str,
    changed_by: str | None = None,
    remarks: str | None = None,
) -> StatusHistory:
    """Writes one status-transition row. Caller is responsible for db.commit()
    (typically the same commit that persists the entity's new status)."""
    entry = StatusHistory(
        entity_type=entity_type,
        entity_id=entity_id,
        old_status=old_status,
        new_status=new_status,
        changed_by=changed_by,
        remarks=remarks,
    )
    db.add(entry)
    return entry
