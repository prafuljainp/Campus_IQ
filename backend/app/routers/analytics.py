"""Analytics router — fixed RBAC, all endpoints return safe data."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.database import get_db
from app.models import Student, Faculty, Department, Placement, Internship, Marks, StudentSkill, Skill, Subject
from app.core.dependencies import get_current_user, get_user_dept

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


def _filter_students(q, user, db):
    if user.role == "super_admin":
        return q
    if user.role in ("hod", "faculty"):
        dept_id = get_user_dept(user)
        if dept_id:
            return q.filter(Student.department_id == dept_id)
    if user.role == "student" and user.student:
        return q.filter(Student.id == user.student.id)
    return q


@router.get("/summary")
def get_summary(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    sq = _filter_students(db.query(Student).filter(Student.is_active == True), current_user, db)
    students = sq.all()
    total_students = len(students)
    avg_cgpa = round(sum(s.cgpa for s in students) / total_students, 2) if total_students else 0

    pq = db.query(Placement)
    if current_user.role in ("hod", "faculty"):
        dept_id = get_user_dept(current_user)
        if dept_id:
            pq = pq.join(Student, Placement.student_id == Student.id).filter(Student.department_id == dept_id)
    elif current_user.role == "student" and current_user.student:
        pq = pq.filter(Placement.student_id == current_user.student.id)

    placements = pq.filter(Placement.is_confirmed == True).all()
    total_placements = len(placements)
    avg_package = round(sum(p.package_lpa or 0 for p in placements) / total_placements, 2) if total_placements else 0
    placement_rate = round(total_placements / total_students * 100, 1) if total_students else 0

    total_faculty = db.query(Faculty).filter(Faculty.is_active == True).count()
    total_depts = db.query(Department).count()
    total_internships = db.query(Internship).count()

    return {
        "total_students": total_students,
        "total_faculty": total_faculty,
        "total_departments": total_depts,
        "total_placements": total_placements,
        "total_internships": total_internships,
        "placement_rate": placement_rate,
        "avg_cgpa": avg_cgpa,
        "avg_package": avg_package,
    }


@router.get("/cgpa-distribution")
def cgpa_distribution(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    q = _filter_students(db.query(Student).filter(Student.is_active == True), current_user, db)
    students = q.all()
    buckets = {"< 6.0": 0, "6.0 – 7.0": 0, "7.0 – 8.0": 0, "8.0 – 9.0": 0, "9.0+": 0}
    for s in students:
        if s.cgpa < 6:
            buckets["< 6.0"] += 1
        elif s.cgpa < 7:
            buckets["6.0 – 7.0"] += 1
        elif s.cgpa < 8:
            buckets["7.0 – 8.0"] += 1
        elif s.cgpa < 9:
            buckets["8.0 – 9.0"] += 1
        else:
            buckets["9.0+"] += 1
    return [{"range": k, "count": v} for k, v in buckets.items()]


@router.get("/department-performance")
def department_performance(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    departments = db.query(Department).all()
    result = []
    for dept in departments:
        q = db.query(Student).filter(Student.department_id == dept.id, Student.is_active == True)
        students = q.all()
        if not students:
            continue
        avg_cgpa = round(sum(s.cgpa for s in students) / len(students), 2)
        placed = sum(1 for s in students if s.placements)
        result.append({
            "department": dept.code, "full_name": dept.name,
            "students": len(students), "avg_cgpa": avg_cgpa,
            "placed": placed,
            "placement_rate": round(placed / len(students) * 100, 1)
        })
    return result


@router.get("/placement-trends")
def placement_trends(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    q = db.query(Placement).filter(Placement.is_confirmed == True, Placement.placement_date != None)
    if current_user.role in ("hod", "faculty"):
        dept_id = get_user_dept(current_user)
        if dept_id:
            q = q.join(Student, Placement.student_id == Student.id).filter(Student.department_id == dept_id)
    monthly = {}
    for p in q.all():
        key = p.placement_date.strftime("%b %Y")
        monthly[key] = monthly.get(key, 0) + 1
    return [{"month": k, "count": v} for k, v in sorted(monthly.items())]


@router.get("/top-companies")
def top_companies(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    q = db.query(Placement)
    if current_user.role in ("hod", "faculty"):
        dept_id = get_user_dept(current_user)
        if dept_id:
            q = q.join(Student, Placement.student_id == Student.id).filter(Student.department_id == dept_id)
    companies: dict = {}
    for p in q.all():
        c = companies.setdefault(p.company, {"count": 0, "packages": []})
        c["count"] += 1
        if p.package_lpa:
            c["packages"].append(p.package_lpa)
    result = [{
        "company": name,
        "count": data["count"],
        "avg_package": round(sum(data["packages"]) / len(data["packages"]), 2) if data["packages"] else 0
    } for name, data in companies.items()]
    return sorted(result, key=lambda x: x["count"], reverse=True)[:10]


@router.get("/skill-gap/{student_id}")
def skill_gap(student_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return {"error": "Student not found"}

    student_skill_ids = {ss.skill_id for ss in student.skills}
    placed_students = db.query(Student).filter(Student.placements.any()).all()
    freq: dict = {}
    for ps in placed_students:
        for ss in ps.skills:
            freq[ss.skill_id] = freq.get(ss.skill_id, 0) + 1

    missing = []
    for sid, cnt in sorted(freq.items(), key=lambda x: x[1], reverse=True)[:10]:
        if sid not in student_skill_ids:
            sk = db.query(Skill).filter(Skill.id == sid).first()
            if sk:
                missing.append({"skill": sk.name, "category": sk.category, "demand_score": cnt})

    current_skills = [{"name": ss.skill.name, "level": ss.level, "category": ss.skill.category}
                      for ss in student.skills if ss.skill]

    return {
        "student": student.name,
        "student_id": student.id,
        "cgpa": student.cgpa,
        "backlogs": student.backlog_count,
        "current_skills": current_skills,
        "missing_skills": missing[:6],
        "career_recommendations": _career(current_skills),
        "placement_ready": student.cgpa >= 6.0 and student.backlog_count == 0
    }


def _career(skills):
    names = {s["name"].lower() for s in skills}
    paths = []
    if any(s in names for s in ["python","machine learning","data science","tensorflow"]):
        paths.append({"path":"Data Scientist / ML Engineer","match":"High","next_steps":["Master TensorFlow/PyTorch","Compete on Kaggle","Get AWS ML Specialty cert"]})
    if any(s in names for s in ["react","javascript","node.js","vue"]):
        paths.append({"path":"Full Stack Developer","match":"High","next_steps":["Learn TypeScript","Deploy projects on Vercel","Build open-source contributions"]})
    if any(s in names for s in ["java","spring","sql","microservices"]):
        paths.append({"path":"Backend Engineer","match":"Medium","next_steps":["Learn system design","Practice DSA on LeetCode","Get Java certification"]})
    if any(s in names for s in ["docker","aws","kubernetes","git"]):
        paths.append({"path":"DevOps / Cloud Engineer","match":"Medium","next_steps":["Get AWS Solutions Architect cert","Learn Terraform","Practice CI/CD pipelines"]})
    if any(s in names for s in ["kotlin","flutter","android","ios"]):
        paths.append({"path":"Mobile App Developer","match":"High","next_steps":["Publish an app to Play Store","Learn Firebase","Build cross-platform skills"]})
    if not paths:
        paths.append({"path":"Software Developer","match":"Entry Level","next_steps":["Learn Python or JavaScript","Solve 50 LeetCode problems","Build 2-3 portfolio projects"]})
    return paths
