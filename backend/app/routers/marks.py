"""Marks router — fixed RBAC and response structure."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.database import get_db
from app.models import Marks, Student, Subject, ActivityLog
from app.schemas import MarksCreate
from app.core.dependencies import get_current_user, require_admin_hod_faculty, get_user_dept

router = APIRouter(prefix="/api/marks", tags=["Marks"])

GRADES = [(90,"O",10),(80,"A+",9),(70,"A",8),(60,"B+",7),(50,"B",6),(45,"C",5),(0,"F",0)]

def compute_grade(total):
    for t, g, gp in GRADES:
        if total >= t:
            return g, gp
    return "F", 0


def _enrich_mark(m: Marks) -> dict:
    d = {c.key: getattr(m, c.key) for c in m.__table__.columns}
    d["subject_name"] = m.subject.name if m.subject else None
    d["subject_code"] = m.subject.code if m.subject else None
    d["student_name"] = m.student.name if m.student else None
    d["student_usn"] = m.student.usn if m.student else None
    return d


@router.get("")
def list_marks(
    student_id: Optional[int] = None,
    semester: Optional[int] = None,
    subject_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = db.query(Marks).options(
        joinedload(Marks.subject),
        joinedload(Marks.student).joinedload(Student.department)
    )
    if current_user.role == "student":
        sid = current_user.student.id if current_user.student else -1
        q = q.filter(Marks.student_id == sid)
    elif current_user.role in ("hod", "faculty"):
        dept_id = get_user_dept(current_user)
        if dept_id:
            q = q.join(Student, Marks.student_id == Student.id).filter(
                Student.department_id == dept_id
            )
        if student_id:
            q = q.filter(Marks.student_id == student_id)
    else:
        if student_id:
            q = q.filter(Marks.student_id == student_id)

    if semester:
        q = q.filter(Marks.semester == semester)
    if subject_id:
        q = q.filter(Marks.subject_id == subject_id)

    marks = q.all()
    return [_enrich_mark(m) for m in marks]


@router.post("", status_code=201)
def add_marks(
    data: MarksCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_hod_faculty)
):
    total = data.internal_marks + data.external_marks
    grade, gp = compute_grade(total)
    is_pass = total >= 40

    existing = db.query(Marks).filter(
        Marks.student_id == data.student_id,
        Marks.subject_id == data.subject_id,
        Marks.semester == data.semester
    ).first()

    if existing:
        existing.internal_marks = data.internal_marks
        existing.external_marks = data.external_marks
        existing.total_marks = total
        existing.grade = grade
        existing.grade_points = gp
        existing.is_pass = is_pass
        mark_id = existing.id
    else:
        m = Marks(
            student_id=data.student_id, subject_id=data.subject_id,
            semester=data.semester, internal_marks=data.internal_marks,
            external_marks=data.external_marks, total_marks=total,
            grade=grade, grade_points=gp, is_pass=is_pass
        )
        db.add(m)
        db.flush()
        mark_id = m.id

    # Recalculate CGPA for student
    student = db.query(Student).filter(Student.id == data.student_id).first()
    if student:
        all_marks = db.query(Marks).filter(Marks.student_id == student.id).all()
        total_gp = total_credits = 0
        for mk in all_marks:
            credits = mk.subject.credits if mk.subject else 3
            total_gp += mk.grade_points * credits
            total_credits += credits
        student.cgpa = round(total_gp / total_credits, 2) if total_credits else 0
        student.backlog_count = sum(1 for mk in all_marks if not mk.is_pass)

    db.add(ActivityLog(user_id=current_user.id, action="MARKS_UPDATED",
                       entity_type="marks", entity_id=mark_id,
                       details=f"Marks for student {data.student_id}, subject {data.subject_id}"))
    db.commit()
    return {"message": "Marks saved", "grade": grade, "grade_points": gp, "total": total}


@router.delete("/{mark_id}")
def delete_marks(
    mark_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_hod_faculty)
):
    m = db.query(Marks).filter(Marks.id == mark_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(m)
    db.commit()
    return {"message": "Deleted"}
