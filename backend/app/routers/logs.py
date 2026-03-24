"""Activity logs / audit trail router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import ActivityLog, User
from app.core.dependencies import require_admin

router = APIRouter(prefix="/api/logs", tags=["Activity Logs"])


@router.get("")
def list_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    q = db.query(ActivityLog).order_by(ActivityLog.created_at.desc())
    if action:
        q = q.filter(ActivityLog.action.ilike(f"%{action}%"))
    total = q.count()
    logs = q.offset((page - 1) * per_page).limit(per_page).all()
    result = []
    for log in logs:
        d = {c.key: getattr(log, c.key) for c in log.__table__.columns}
        if log.user:
            d["user_email"] = log.user.email
            d["user_role"] = log.user.role
        else:
            d["user_email"] = None
            d["user_role"] = None
        result.append(d)
    return {"items": result, "total": total, "page": page, "per_page": per_page}
