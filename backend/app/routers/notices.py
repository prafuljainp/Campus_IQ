"""Notices router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import Notice
from app.schemas import NoticeCreate
from app.core.dependencies import get_current_user, require_admin_hod_faculty

router = APIRouter(prefix="/api/notices", tags=["Notices"])


@router.get("")
def list_notices(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    q = db.query(Notice).filter(Notice.is_active == True)
    if department_id:
        q = q.filter((Notice.department_id == department_id) | (Notice.department_id == None))
    return q.order_by(Notice.created_at.desc()).all()


@router.post("")
def create_notice(
    data: NoticeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_hod_faculty)
):
    notice = Notice(**data.dict(), created_by=current_user.id)
    db.add(notice)
    db.commit()
    db.refresh(notice)
    return notice


@router.put("/{notice_id}")
def update_notice(
    notice_id: int,
    data: dict,
    db: Session = Depends(get_db),
    _=Depends(require_admin_hod_faculty)
):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    for k, v in data.items():
        if hasattr(notice, k):
            setattr(notice, k, v)
    db.commit()
    db.refresh(notice)
    return notice


@router.delete("/{notice_id}")
def delete_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin_hod_faculty)
):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    notice.is_active = False
    db.commit()
    return {"message": "Notice deleted"}
