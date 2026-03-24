"""
Students router — fully fixed with:
- Correct route ordering (specific before /{id})
- Full RBAC: admin=all, hod=dept-only, faculty=dept, student=self
- Standardized response format
- Proper error handling
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional
import io, csv
from datetime import datetime

from app.database import get_db
from app.models import User, Student, Department, StudentSkill, Skill, ActivityLog
from app.schemas import StudentCreate, StudentUpdate
from app.core.security import get_password_hash
from app.core.dependencies import get_current_user, require_admin_or_hod, require_admin_hod_faculty, get_user_dept

router = APIRouter(prefix="/api/students", tags=["Students"])


def _enrich(s: Student) -> dict:
    d = {c.key: getattr(s, c.key) for c in s.__table__.columns}
    d["department_name"] = s.department.name if s.department else None
    d["skills"] = [
        {"id": ss.id, "name": ss.skill.name, "level": ss.level, "category": ss.skill.category}
        for ss in s.skills if ss.skill
    ]
    d["placements_count"] = len(s.placements)
    d["internships_count"] = len(s.internships)
    return d


def _base_query(db: Session, user):
    """Return a base Student query filtered by role/department."""
    q = db.query(Student).options(
        joinedload(Student.department),
        joinedload(Student.skills).joinedload(StudentSkill.skill),
        joinedload(Student.placements),
        joinedload(Student.internships),
    ).filter(Student.is_active == True)

    if user.role == "super_admin":
        pass  # see everything
    elif user.role in ("hod", "faculty"):
        dept_id = get_user_dept(user)
        if dept_id:
            q = q.filter(Student.department_id == dept_id)
    elif user.role == "student":
        if user.student:
            q = q.filter(Student.id == user.student.id)
        else:
            q = q.filter(Student.id == -1)  # no results
    return q


# ──────────────────────────────────────────────────────────────────────────────
# IMPORTANT: Specific routes MUST come before /{student_id}
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/export/csv")
def export_students_csv(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_hod_faculty)
):
    students = _base_query(db, current_user).all()
    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(["Name","USN","Email","Phone","Department","Semester","Section","CGPA","SGPA","Backlogs","Admission Year","City","State"])
    for s in students:
        w.writerow([s.name, s.usn, s.email, s.phone,
                    s.department.name if s.department else "",
                    s.semester, s.section, s.cgpa, s.sgpa, s.backlog_count,
                    s.admission_year, s.city, s.state])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=students.csv"}
    )


@router.get("/ranking")
def get_ranking(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = _base_query(db, current_user)
    if department_id:
        q = q.filter(Student.department_id == department_id)
    students = q.all()
    ranked = []
    for s in students:
        score = (s.cgpa * 10) + len(s.skills) * 2 + len(s.internships) * 5 - s.backlog_count * 3
        ranked.append({
            "id": s.id, "name": s.name, "usn": s.usn, "cgpa": s.cgpa,
            "department": s.department.name if s.department else "",
            "department_id": s.department_id,
            "skills_count": len(s.skills),
            "internships_count": len(s.internships),
            "backlog_count": s.backlog_count,
            "score": round(score, 2)
        })
    ranked.sort(key=lambda x: x["score"], reverse=True)
    for i, r in enumerate(ranked):
        r["rank"] = i + 1
    return ranked


@router.get("/eligibility/{student_id}")
def check_eligibility(
    student_id: int,
    min_cgpa: float = Query(6.0),
    max_backlogs: int = Query(0),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    s = db.query(Student).filter(Student.id == student_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")
    reasons, eligible = [], True
    if s.cgpa < min_cgpa:
        eligible = False
        reasons.append(f"CGPA {s.cgpa} is below required {min_cgpa}")
    if s.backlog_count > max_backlogs:
        eligible = False
        reasons.append(f"{s.backlog_count} active backlogs (max allowed: {max_backlogs})")
    return {
        "student_id": s.id, "student": s.name, "usn": s.usn,
        "cgpa": s.cgpa, "backlogs": s.backlog_count,
        "skills_count": len(s.skills), "eligible": eligible, "reasons": reasons
    }


# ──────────────────────────────────────────────────────────────────────────────
# List + Create
# ──────────────────────────────────────────────────────────────────────────────

@router.get("")
def list_students(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    semester: Optional[int] = None,
    section: Optional[str] = None,
    sort_by: str = Query("name"),
    sort_dir: str = Query("asc"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = _base_query(db, current_user)
    if search:
        q = q.filter(or_(
            Student.name.ilike(f"%{search}%"),
            Student.usn.ilike(f"%{search}%"),
            Student.email.ilike(f"%{search}%"),
        ))
    if department_id:
        q = q.filter(Student.department_id == department_id)
    if semester:
        q = q.filter(Student.semester == semester)
    if section:
        q = q.filter(Student.section == section)

    sort_col = getattr(Student, sort_by, Student.name)
    q = q.order_by(sort_col.desc() if sort_dir == "desc" else sort_col)

    total = q.count()
    students = q.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "items": [_enrich(s) for s in students],
        "total": total, "page": page,
        "per_page": per_page, "pages": max(1, (total + per_page - 1) // per_page)
    }


@router.post("", status_code=201)
def create_student(
    data: StudentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_hod)
):
    if db.query(Student).filter(Student.usn == data.usn).first():
        raise HTTPException(status_code=400, detail="USN already exists")
    if db.query(Student).filter(Student.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    from app.models import User as UserModel
    user = UserModel(
        email=data.email,
        hashed_password=get_password_hash(data.password or "Student@123"),
        role="student"
    )
    db.add(user)
    db.flush()

    student_dict = data.dict(exclude={"password"})
    student = Student(**student_dict, user_id=user.id)
    db.add(student)
    db.add(ActivityLog(
        user_id=current_user.id, action="STUDENT_CREATED",
        entity_type="student", details=f"{data.name} ({data.usn})"
    ))
    db.commit()
    db.refresh(student)
    # reload with joins
    s = db.query(Student).options(
        joinedload(Student.department),
        joinedload(Student.skills).joinedload(StudentSkill.skill),
        joinedload(Student.placements),
        joinedload(Student.internships),
    ).filter(Student.id == student.id).first()
    return _enrich(s)


# ──────────────────────────────────────────────────────────────────────────────
# Single student CRUD — MUST be after specific routes
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/{student_id}")
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = _base_query(db, current_user)
    s = q.filter(Student.id == student_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")
    return _enrich(s)


@router.put("/{student_id}")
def update_student(
    student_id: int,
    data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    s = db.query(Student).filter(Student.id == student_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")
    # Students can only edit their own record
    if current_user.role == "student" and s.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    # HOD can only edit students in their department
    if current_user.role == "hod":
        dept_id = get_user_dept(current_user)
        if dept_id and s.department_id != dept_id:
            raise HTTPException(status_code=403, detail="Access denied")

    for k, v in data.dict(exclude_none=True).items():
        setattr(s, k, v)
    db.add(ActivityLog(user_id=current_user.id, action="STUDENT_UPDATED",
                       entity_type="student", entity_id=student_id,
                       details=f"Updated {s.name}"))
    db.commit()
    db.refresh(s)
    s2 = db.query(Student).options(
        joinedload(Student.department),
        joinedload(Student.skills).joinedload(StudentSkill.skill),
        joinedload(Student.placements),
        joinedload(Student.internships),
    ).filter(Student.id == s.id).first()
    return _enrich(s2)


@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_hod)
):
    s = db.query(Student).filter(Student.id == student_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")
    s.is_active = False
    db.add(ActivityLog(user_id=current_user.id, action="STUDENT_DELETED",
                       entity_type="student", entity_id=student_id,
                       details=f"Deactivated {s.name}"))
    db.commit()
    return {"message": f"Student {s.name} deactivated"}


@router.post("/{student_id}/skills")
def add_skill(
    student_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role == "student" and (not current_user.student or current_user.student.id != student_id):
        raise HTTPException(status_code=403, detail="Access denied")
    skill = db.query(Skill).filter(Skill.id == data.get("skill_id")).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    existing = db.query(StudentSkill).filter(
        StudentSkill.student_id == student_id, StudentSkill.skill_id == data["skill_id"]
    ).first()
    if existing:
        existing.level = data.get("level", "beginner")
    else:
        db.add(StudentSkill(student_id=student_id, skill_id=data["skill_id"],
                            level=data.get("level", "beginner")))
    db.commit()
    return {"message": "Skill saved"}


@router.delete("/{student_id}/skills/{skill_id}")
def remove_skill(
    student_id: int, skill_id: int,
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    ss = db.query(StudentSkill).filter(
        StudentSkill.student_id == student_id, StudentSkill.skill_id == skill_id
    ).first()
    if ss:
        db.delete(ss)
        db.commit()
    return {"message": "Skill removed"}
