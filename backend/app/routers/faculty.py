"""Faculty router with proper RBAC."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.database import get_db
from app.models import Faculty, User, Department, ActivityLog
from app.schemas import FacultyCreate, FacultyUpdate
from app.core.security import get_password_hash
from app.core.dependencies import get_current_user, require_admin, require_admin_or_hod, get_user_dept

router = APIRouter(prefix="/api/faculty", tags=["Faculty"])


def _enrich(f: Faculty) -> dict:
    d = {c.key: getattr(f, c.key) for c in f.__table__.columns}
    d["department_name"] = f.department.name if f.department else None
    d["department_code"] = f.department.code if f.department else None
    return d


@router.get("")
def list_faculty(
    department_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = db.query(Faculty).options(
        joinedload(Faculty.department)
    ).filter(Faculty.is_active == True)

    if current_user.role in ("hod", "faculty"):
        dept_id = get_user_dept(current_user)
        if dept_id:
            q = q.filter(Faculty.department_id == dept_id)
    elif department_id:
        q = q.filter(Faculty.department_id == department_id)

    if search:
        q = q.filter(Faculty.name.ilike(f"%{search}%"))

    faculty = q.order_by(Faculty.name).all()
    return [_enrich(f) for f in faculty]


@router.post("", status_code=201)
def create_faculty(
    data: FacultyCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    if db.query(Faculty).filter(Faculty.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password or "Faculty@123"),
        role="faculty"
    )
    db.add(user)
    db.flush()
    fac = Faculty(**data.dict(exclude={"password"}), user_id=user.id)
    db.add(fac)
    db.add(ActivityLog(user_id=current_user.id, action="FACULTY_CREATED",
                       entity_type="faculty", details=data.name))
    db.commit()
    db.refresh(fac)
    fac2 = db.query(Faculty).options(joinedload(Faculty.department)).filter(Faculty.id == fac.id).first()
    return _enrich(fac2)


@router.get("/{faculty_id}")
def get_faculty(faculty_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    f = db.query(Faculty).options(joinedload(Faculty.department)).filter(Faculty.id == faculty_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Faculty not found")
    return _enrich(f)


@router.put("/{faculty_id}")
def update_faculty(
    faculty_id: int,
    data: FacultyUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    f = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Faculty not found")
    for k, v in data.dict(exclude_none=True).items():
        setattr(f, k, v)
    db.add(ActivityLog(user_id=current_user.id, action="FACULTY_UPDATED",
                       entity_type="faculty", entity_id=faculty_id))
    db.commit()
    db.refresh(f)
    f2 = db.query(Faculty).options(joinedload(Faculty.department)).filter(Faculty.id == f.id).first()
    return _enrich(f2)


@router.delete("/{faculty_id}")
def delete_faculty(
    faculty_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    f = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Not found")
    f.is_active = False
    db.add(ActivityLog(user_id=current_user.id, action="FACULTY_DELETED",
                       entity_type="faculty", entity_id=faculty_id))
    db.commit()
    return {"message": "Faculty deactivated"}
