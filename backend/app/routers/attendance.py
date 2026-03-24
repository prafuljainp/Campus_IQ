"""Attendance router — fixed RBAC and data visibility."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from datetime import date
from app.database import get_db
from app.models import Attendance, Student, Subject
from app.schemas import AttendanceCreate, AttendanceBulk
from app.core.dependencies import get_current_user, require_admin_hod_faculty, get_user_dept

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


@router.get("")
def list_attendance(
    student_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = db.query(Attendance).options(
        joinedload(Attendance.student),
        joinedload(Attendance.subject)
    )

    if current_user.role == "student":
        sid = current_user.student.id if current_user.student else -1
        q = q.filter(Attendance.student_id == sid)
    elif current_user.role in ("hod", "faculty"):
        dept_id = get_user_dept(current_user)
        if dept_id:
            q = q.join(Student, Attendance.student_id == Student.id).filter(
                Student.department_id == dept_id
            )
        if student_id:
            q = q.filter(Attendance.student_id == student_id)
    else:
        if student_id:
            q = q.filter(Attendance.student_id == student_id)

    if subject_id:
        q = q.filter(Attendance.subject_id == subject_id)
    if from_date:
        q = q.filter(Attendance.date >= from_date)
    if to_date:
        q = q.filter(Attendance.date <= to_date)

    records = q.order_by(Attendance.date.desc()).limit(500).all()
    result = []
    for r in records:
        d = {c.key: getattr(r, c.key) for c in r.__table__.columns}
        d["student_name"] = r.student.name if r.student else None
        d["student_usn"] = r.student.usn if r.student else None
        d["subject_name"] = r.subject.name if r.subject else None
        result.append(d)
    return result


@router.post("", status_code=201)
def mark_attendance(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_hod_faculty)
):
    existing = db.query(Attendance).filter(
        Attendance.student_id == data.student_id,
        Attendance.subject_id == data.subject_id,
        Attendance.date == data.date
    ).first()
    faculty_id = current_user.faculty.id if current_user.faculty else None
    if existing:
        existing.is_present = data.is_present
        existing.marked_by = faculty_id
    else:
        att = Attendance(**data.dict(), marked_by=faculty_id)
        db.add(att)
    db.commit()
    return {"message": "Attendance marked"}


@router.post("/bulk")
def mark_bulk_attendance(
    data: AttendanceBulk,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_hod_faculty)
):
    faculty_id = current_user.faculty.id if current_user.faculty else None
    count = 0
    for record in data.records:
        existing = db.query(Attendance).filter(
            Attendance.student_id == record["student_id"],
            Attendance.subject_id == data.subject_id,
            Attendance.date == data.date
        ).first()
        if existing:
            existing.is_present = record.get("is_present", False)
        else:
            db.add(Attendance(
                student_id=record["student_id"],
                subject_id=data.subject_id,
                date=data.date,
                is_present=record.get("is_present", False),
                marked_by=faculty_id
            ))
        count += 1
    db.commit()
    return {"message": f"Attendance marked for {count} students"}


@router.get("/summary")
def attendance_summary(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Per-student attendance summary with percentage."""
    q = db.query(Student).filter(Student.is_active == True)
    if current_user.role == "student":
        sid = current_user.student.id if current_user.student else -1
        q = q.filter(Student.id == sid)
    elif current_user.role in ("hod", "faculty"):
        dept_id = get_user_dept(current_user)
        if dept_id:
            q = q.filter(Student.department_id == dept_id)
    elif department_id:
        q = q.filter(Student.department_id == department_id)

    students = q.all()
    result = []
    for s in students:
        records = db.query(Attendance).filter(Attendance.student_id == s.id).all()
        total = len(records)
        present = sum(1 for r in records if r.is_present)
        pct = round((present / total) * 100, 1) if total else 0
        result.append({
            "student_id": s.id, "student_name": s.name, "usn": s.usn,
            "department": s.department.name if s.department else None,
            "total_classes": total, "present": present,
            "absent": total - present, "percentage": pct,
            "low_attendance": pct < 75 and total > 0
        })
    result.sort(key=lambda x: x["percentage"])
    return result


@router.get("/percentage/{student_id}")
def get_percentage(
    student_id: int,
    subject_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Students can only see their own
    if current_user.role == "student":
        if not current_user.student or current_user.student.id != student_id:
            raise HTTPException(status_code=403, detail="Access denied")

    q = db.query(Attendance).filter(Attendance.student_id == student_id)
    if subject_id:
        q = q.filter(Attendance.subject_id == subject_id)
    records = q.all()
    total = len(records)
    present = sum(1 for r in records if r.is_present)
    pct = round((present / total) * 100, 1) if total else 0
    return {
        "total_classes": total, "present": present,
        "absent": total - present, "percentage": pct, "low_attendance": pct < 75
    }


@router.delete("/{attendance_id}")
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_hod_faculty)
):
    att = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(att)
    db.commit()
    return {"message": "Deleted"}
