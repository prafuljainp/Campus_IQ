"""Subjects router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import Subject, Faculty
from app.schemas import SubjectCreate
from app.core.dependencies import get_current_user, require_admin_hod_faculty

router = APIRouter(prefix="/api/subjects", tags=["Subjects"])


@router.get("")
def list_subjects(department_id: Optional[int] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(Subject).filter(Subject.is_active == True)
    if department_id:
        q = q.filter(Subject.department_id == department_id)
    subjects = q.all()
    result = []
    for s in subjects:
        d = {c.key: getattr(s, c.key) for c in s.__table__.columns}
        d["faculty_name"] = s.faculty.name if s.faculty else None
        result.append(d)
    return result


@router.post("")
def create_subject(data: SubjectCreate, db: Session = Depends(get_db), _=Depends(require_admin_hod_faculty)):
    if db.query(Subject).filter(Subject.code == data.code).first():
        raise HTTPException(status_code=400, detail="Subject code already exists")
    subj = Subject(**data.dict())
    db.add(subj)
    db.commit()
    db.refresh(subj)
    return subj


@router.delete("/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db), _=Depends(require_admin_hod_faculty)):
    subj = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    subj.is_active = False
    db.commit()
    return {"message": "Subject deleted"}
