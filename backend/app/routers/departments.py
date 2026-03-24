"""Department CRUD router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Department, Faculty, Student
from app.schemas import DepartmentCreate, DepartmentUpdate, DepartmentOut
from app.core.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/departments", tags=["Departments"])


@router.get("", response_model=List[DepartmentOut])
def list_departments(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Department).all()


@router.post("", response_model=DepartmentOut)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    if db.query(Department).filter(Department.code == data.code).first():
        raise HTTPException(status_code=400, detail="Department code already exists")
    dept = Department(**data.dict())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.get("/{dept_id}", response_model=DepartmentOut)
def get_department(dept_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept


@router.put("/{dept_id}", response_model=DepartmentOut)
def update_department(
    dept_id: int,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    for k, v in data.dict(exclude_none=True).items():
        setattr(dept, k, v)
    db.commit()
    db.refresh(dept)
    return dept


@router.delete("/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return {"message": "Department deleted"}


@router.get("/{dept_id}/stats")
def department_stats(dept_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    students = db.query(Student).filter(Student.department_id == dept_id).all()
    total = len(students)
    avg_cgpa = sum(s.cgpa for s in students) / total if total else 0
    return {
        "department": dept.name,
        "total_students": total,
        "total_faculty": db.query(Faculty).filter(Faculty.department_id == dept_id).count(),
        "avg_cgpa": round(avg_cgpa, 2),
        "placed": sum(1 for s in students if s.placements)
    }
