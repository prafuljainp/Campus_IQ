"""
Placements & Internships router — FIXED:
- HOD sees only their department's placements
- Student sees only their own
- Proper error handling
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from typing import Optional
import io, csv

from app.database import get_db
from app.models import Placement, Internship, Student
from app.schemas import PlacementCreate, InternshipCreate
from app.core.dependencies import get_current_user, require_admin_or_hod, require_admin_hod_faculty, get_user_dept

placements_router = APIRouter(prefix="/api/placements", tags=["Placements"])
internships_router = APIRouter(prefix="/api/internships", tags=["Internships"])


def _placement_query(db, user):
    q = db.query(Placement).join(Student, Placement.student_id == Student.id)
    if user.role == "super_admin":
        pass
    elif user.role in ("hod", "faculty"):
        dept_id = get_user_dept(user)
        if dept_id:
            q = q.filter(Student.department_id == dept_id)
    elif user.role == "student":
        if user.student:
            q = q.filter(Placement.student_id == user.student.id)
        else:
            q = q.filter(Placement.id == -1)
    return q


def _enrich_placement(p: Placement) -> dict:
    d = {c.key: getattr(p, c.key) for c in p.__table__.columns}
    if p.student:
        d["student_name"] = p.student.name
        d["student_usn"] = p.student.usn
        d["department_name"] = p.student.department.name if p.student.department else None
        d["department_id"] = p.student.department_id
    else:
        d["student_name"] = None
        d["student_usn"] = None
        d["department_name"] = None
        d["department_id"] = None
    return d


@placements_router.get("/export/csv")
def export_placements_csv(db: Session = Depends(get_db), current_user=Depends(require_admin_hod_faculty)):
    placements = _placement_query(db, current_user).all()
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(["Student","USN","Department","Company","Role","Package (LPA)","Location","Date","Status"])
    for p in placements:
        w.writerow([p.student.name if p.student else "", p.student.usn if p.student else "",
                    p.student.department.name if p.student and p.student.department else "",
                    p.company, p.role, p.package_lpa, p.location, p.placement_date,
                    "Confirmed" if p.is_confirmed else "Pending"])
    out.seek(0)
    return StreamingResponse(iter([out.getvalue()]), media_type="text/csv",
                             headers={"Content-Disposition": "attachment; filename=placements.csv"})


@placements_router.get("")
def list_placements(
    department_id: Optional[int] = None,
    company: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = _placement_query(db, current_user).options(
        joinedload(Placement.student).joinedload(Student.department)
    )
    if department_id and current_user.role == "super_admin":
        q = q.filter(Student.department_id == department_id)
    if company:
        q = q.filter(Placement.company.ilike(f"%{company}%"))
    placements = q.order_by(Placement.created_at.desc()).all()
    return [_enrich_placement(p) for p in placements]


@placements_router.post("", status_code=201)
def add_placement(
    data: PlacementCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_hod)
):
    # HOD can only add placements for their department
    if current_user.role == "hod":
        dept_id = get_user_dept(current_user)
        student = db.query(Student).filter(Student.id == data.student_id).first()
        if not student or (dept_id and student.department_id != dept_id):
            raise HTTPException(status_code=403, detail="Access denied for this student")

    p = Placement(**data.dict())
    db.add(p)
    db.commit()
    db.refresh(p)
    s = db.query(Placement).options(
        joinedload(Placement.student).joinedload(Student.department)
    ).filter(Placement.id == p.id).first()
    return _enrich_placement(s)


@placements_router.put("/{placement_id}")
def update_placement(
    placement_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_hod)
):
    p = db.query(Placement).filter(Placement.id == placement_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.items():
        if hasattr(p, k):
            setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return _enrich_placement(p)


@placements_router.delete("/{placement_id}")
def delete_placement(
    placement_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_hod)
):
    p = db.query(Placement).filter(Placement.id == placement_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(p)
    db.commit()
    return {"message": "Placement deleted"}


# ── Internships ────────────────────────────────────────────────────────────────

@internships_router.get("")
def list_internships(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    q = db.query(Internship).join(Student, Internship.student_id == Student.id)
    if current_user.role == "student" and current_user.student:
        q = q.filter(Internship.student_id == current_user.student.id)
    elif current_user.role in ("hod", "faculty"):
        dept_id = get_user_dept(current_user)
        if dept_id:
            q = q.filter(Student.department_id == dept_id)
    internships = q.order_by(Internship.created_at.desc()).all()
    result = []
    for i in internships:
        d = {c.key: getattr(i, c.key) for c in i.__table__.columns}
        d["student_name"] = i.student.name if i.student else None
        d["student_usn"] = i.student.usn if i.student else None
        result.append(d)
    return result


@internships_router.post("", status_code=201)
def add_internship(data: InternshipCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    internship = Internship(**data.dict())
    db.add(internship)
    db.commit()
    db.refresh(internship)
    return internship


@internships_router.delete("/{internship_id}")
def delete_internship(internship_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin_or_hod)):
    i = db.query(Internship).filter(Internship.id == internship_id).first()
    if not i:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(i)
    db.commit()
    return {"message": "Internship deleted"}
