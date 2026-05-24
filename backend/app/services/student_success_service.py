"""Student success intelligence service.

The service is deterministic and explainable: every score is built from
existing ERP data and returned with root causes plus action recommendations.
"""
from __future__ import annotations

from datetime import datetime
from statistics import mean
from typing import Any

from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_user_dept
from app.models import Student, StudentSkill


def _clamp(value: float, lower: float = 0, upper: float = 100) -> float:
    return max(lower, min(upper, value))


def _round(value: float, digits: int = 1) -> float:
    return round(float(value or 0), digits)


class StudentSuccessService:
    """Build command-center data for risk, readiness and intervention planning."""

    @staticmethod
    def get_accessible_students(db: Session, user, department_id: int | None = None):
        query = db.query(Student).options(
            joinedload(Student.department),
            joinedload(Student.skills).joinedload(StudentSkill.skill),
            joinedload(Student.attendance_records),
            joinedload(Student.marks_records),
            joinedload(Student.placements),
            joinedload(Student.internships),
        ).filter(Student.is_active == True)

        if user.role == "super_admin":
            if department_id:
                query = query.filter(Student.department_id == department_id)
        elif user.role in ("hod", "faculty"):
            dept_id = get_user_dept(user)
            if dept_id:
                query = query.filter(Student.department_id == dept_id)
            else:
                query = query.filter(Student.id == -1)
            if department_id and dept_id and department_id != dept_id:
                query = query.filter(Student.id == -1)
        elif user.role == "student":
            student_id = user.student.id if user.student else -1
            query = query.filter(Student.id == student_id)
        else:
            query = query.filter(Student.id == -1)

        return query

    @staticmethod
    def get_command_center(
        db: Session,
        user,
        department_id: int | None = None,
        limit: int = 10,
    ) -> dict[str, Any]:
        students = StudentSuccessService.get_accessible_students(db, user, department_id).all()
        profiles = [StudentSuccessService.build_student_profile(student) for student in students]
        profiles.sort(key=lambda item: item["risk"]["score"], reverse=True)

        summary = StudentSuccessService._build_summary(profiles)
        risk_distribution = StudentSuccessService._build_risk_distribution(profiles)
        department_metrics = StudentSuccessService._build_department_metrics(profiles)
        focus_areas = StudentSuccessService._build_focus_areas(profiles)
        interventions = StudentSuccessService._build_intervention_board(profiles, limit=limit)

        return {
            "summary": summary,
            "risk_distribution": risk_distribution,
            "department_metrics": department_metrics,
            "focus_areas": focus_areas,
            "priority_students": profiles[:limit],
            "intervention_board": interventions,
            "generated_at": datetime.utcnow().isoformat(),
        }

    @staticmethod
    def get_student_profile(db: Session, user, student_id: int) -> dict[str, Any] | None:
        student = StudentSuccessService.get_accessible_students(db, user).filter(
            Student.id == student_id
        ).first()
        if not student:
            return None
        return StudentSuccessService.build_student_profile(student)

    @staticmethod
    def simulate_what_if(
        db: Session,
        user,
        student_id: int,
        scenario: dict[str, Any],
    ) -> dict[str, Any] | None:
        student = StudentSuccessService.get_accessible_students(db, user).filter(
            Student.id == student_id
        ).first()
        if not student:
            return None

        current = StudentSuccessService.build_student_profile(student)
        overrides = StudentSuccessService._normalize_scenario(scenario)
        simulated = StudentSuccessService.build_student_profile(student, overrides=overrides)

        return {
            "student": current["student"],
            "scenario": overrides,
            "current": {
                "risk_score": current["risk"]["score"],
                "risk_level": current["risk"]["level"],
                "health_score": current["success_score"],
                "placement_readiness": current["placement_readiness"]["score"],
            },
            "simulated": {
                "risk_score": simulated["risk"]["score"],
                "risk_level": simulated["risk"]["level"],
                "health_score": simulated["success_score"],
                "placement_readiness": simulated["placement_readiness"]["score"],
            },
            "impact": {
                "risk_delta": _round(simulated["risk"]["score"] - current["risk"]["score"]),
                "health_delta": _round(simulated["success_score"] - current["success_score"]),
                "placement_delta": _round(
                    simulated["placement_readiness"]["score"]
                    - current["placement_readiness"]["score"]
                ),
            },
            "next_best_actions": simulated["action_plan"][:3],
        }

    @staticmethod
    def build_student_profile(student: Student, overrides: dict[str, Any] | None = None) -> dict[str, Any]:
        overrides = overrides or {}
        attendance = StudentSuccessService._attendance_metrics(student, overrides)
        academics = StudentSuccessService._academic_metrics(student, overrides)
        skills = StudentSuccessService._skill_metrics(student, overrides)
        professional = StudentSuccessService._professional_metrics(student, overrides)

        success_score = _round(
            academics["cgpa_score"] * 0.28
            + attendance["score"] * 0.22
            + academics["backlog_score"] * 0.20
            + skills["score"] * 0.18
            + professional["score"] * 0.12
        )
        placement_score = _round(
            academics["cgpa_score"] * 0.32
            + skills["score"] * 0.24
            + academics["backlog_score"] * 0.18
            + attendance["score"] * 0.16
            + professional["score"] * 0.10
        )
        risk_score = _round(100 - success_score)
        risk_level = StudentSuccessService._risk_level(risk_score)

        root_causes = StudentSuccessService._root_causes(
            student, academics, attendance, skills, professional
        )
        action_plan = StudentSuccessService._action_plan(student, root_causes, risk_level)

        return {
            "student": {
                "id": student.id,
                "name": student.name,
                "usn": student.usn,
                "email": student.email,
                "semester": student.semester,
                "section": student.section,
                "department_id": student.department_id,
                "department": student.department.code if student.department else None,
                "department_name": student.department.name if student.department else None,
            },
            "success_score": success_score,
            "risk": {
                "score": risk_score,
                "level": risk_level,
                "label": StudentSuccessService._risk_label(risk_level),
            },
            "placement_readiness": {
                "score": placement_score,
                "level": StudentSuccessService._readiness_level(placement_score),
                "confirmed_placements": professional["confirmed_placements"],
            },
            "metrics": {
                "cgpa": academics["cgpa"],
                "cgpa_score": academics["cgpa_score"],
                "backlogs": academics["backlogs"],
                "backlog_score": academics["backlog_score"],
                "attendance_percentage": attendance["percentage"],
                "attendance_score": attendance["score"],
                "attendance_records": attendance["records"],
                "attendance_confidence": attendance["confidence"],
                "skills_count": skills["count"],
                "skill_categories": skills["categories"],
                "skills_score": skills["score"],
                "internships_count": professional["internships"],
                "professional_score": professional["score"],
                "weak_subjects": academics["weak_subjects"],
            },
            "root_causes": root_causes,
            "action_plan": action_plan,
            "intervention": StudentSuccessService._intervention(student, risk_level, root_causes),
            "calculated_at": datetime.utcnow().isoformat(),
        }

    @staticmethod
    def _attendance_metrics(student: Student, overrides: dict[str, Any]) -> dict[str, Any]:
        if "attendance_percentage" in overrides:
            percentage = _clamp(float(overrides["attendance_percentage"]))
            records = len(student.attendance_records or [])
            confidence = "simulated"
        else:
            records_list = student.attendance_records or []
            records = len(records_list)
            if records:
                present = sum(1 for record in records_list if record.is_present)
                percentage = (present / records) * 100
                confidence = "measured"
            else:
                percentage = 75
                confidence = "estimated"

        if percentage >= 90:
            score = 100
        elif percentage >= 75:
            score = 75 + ((percentage - 75) / 15) * 20
        elif percentage >= 60:
            score = 50 + ((percentage - 60) / 15) * 20
        else:
            score = percentage * 0.75

        return {
            "percentage": _round(percentage),
            "score": _round(_clamp(score)),
            "records": records,
            "confidence": confidence,
        }

    @staticmethod
    def _academic_metrics(student: Student, overrides: dict[str, Any]) -> dict[str, Any]:
        cgpa = float(overrides.get("cgpa", student.cgpa or 0))
        backlogs = int(overrides.get("backlog_count", student.backlog_count or 0))
        if overrides.get("clear_backlogs") is True:
            backlogs = 0

        weak_subjects = []
        for mark in student.marks_records or []:
            total = mark.total_marks or 0
            if mark.is_pass is False or total < 50:
                subject_name = mark.subject.name if mark.subject else "Subject"
                weak_subjects.append({
                    "subject": subject_name,
                    "semester": mark.semester,
                    "total_marks": total,
                    "grade": mark.grade,
                })

        if backlogs == 0:
            backlog_score = 100
        elif backlogs == 1:
            backlog_score = 68
        elif backlogs == 2:
            backlog_score = 38
        else:
            backlog_score = max(0, 20 - (backlogs - 3) * 5)

        return {
            "cgpa": _round(cgpa, 2),
            "cgpa_score": _round(_clamp((cgpa / 10) * 100)),
            "backlogs": backlogs,
            "backlog_score": _round(backlog_score),
            "weak_subjects": weak_subjects[:5],
        }

    @staticmethod
    def _skill_metrics(student: Student, overrides: dict[str, Any]) -> dict[str, Any]:
        skill_count = int(overrides.get("skills_count", len(student.skills or [])))
        categories = {
            item.skill.category
            for item in (student.skills or [])
            if item.skill and item.skill.category
        }
        category_bonus = min(len(categories) * 4, 16)
        score = min(skill_count * 8, 84) + category_bonus
        return {
            "count": skill_count,
            "categories": sorted(categories),
            "score": _round(_clamp(score)),
        }

    @staticmethod
    def _professional_metrics(student: Student, overrides: dict[str, Any]) -> dict[str, Any]:
        internships = int(overrides.get("internships_count", len(student.internships or [])))
        confirmed = sum(1 for placement in (student.placements or []) if placement.is_confirmed)
        score = min(internships * 18, 54) + (28 if confirmed else 0)
        if student.resume_url:
            score += 12
        if student.github or student.linkedin:
            score += 6
        return {
            "internships": internships,
            "confirmed_placements": confirmed,
            "score": _round(_clamp(score)),
        }

    @staticmethod
    def _root_causes(
        student: Student,
        academics: dict[str, Any],
        attendance: dict[str, Any],
        skills: dict[str, Any],
        professional: dict[str, Any],
    ) -> list[dict[str, Any]]:
        causes = []
        if academics["backlogs"] > 0:
            causes.append({
                "category": "Backlogs",
                "severity": "critical" if academics["backlogs"] >= 2 else "high",
                "impact": min(38 + academics["backlogs"] * 10, 70),
                "message": f"{student.name} has {academics['backlogs']} active backlog(s).",
                "current": academics["backlogs"],
                "target": 0,
            })
        if attendance["percentage"] < 75:
            causes.append({
                "category": "Attendance",
                "severity": "critical" if attendance["percentage"] < 60 else "high",
                "impact": 65 if attendance["percentage"] < 60 else 45,
                "message": f"Attendance is {attendance['percentage']}%, below the 75% threshold.",
                "current": attendance["percentage"],
                "target": 85,
            })
        if academics["cgpa"] < 7:
            causes.append({
                "category": "CGPA",
                "severity": "high" if academics["cgpa"] < 6 else "moderate",
                "impact": 55 if academics["cgpa"] < 6 else 35,
                "message": f"CGPA is {academics['cgpa']}, limiting academic and placement readiness.",
                "current": academics["cgpa"],
                "target": 7.5,
            })
        if skills["count"] < 6:
            causes.append({
                "category": "Skills",
                "severity": "moderate",
                "impact": 30,
                "message": f"Only {skills['count']} skill(s) are recorded; placement-ready students need broader proof.",
                "current": skills["count"],
                "target": 10,
            })
        if professional["internships"] == 0 and professional["confirmed_placements"] == 0:
            causes.append({
                "category": "Professional Exposure",
                "severity": "moderate",
                "impact": 24,
                "message": "No internship or confirmed placement evidence is recorded.",
                "current": 0,
                "target": 1,
            })
        if attendance["confidence"] == "estimated":
            causes.append({
                "category": "Data Quality",
                "severity": "low",
                "impact": 12,
                "message": "Attendance is estimated because no attendance records are available.",
                "current": "estimated",
                "target": "measured",
            })

        causes.sort(key=lambda item: item["impact"], reverse=True)
        return causes[:5]

    @staticmethod
    def _action_plan(
        student: Student,
        root_causes: list[dict[str, Any]],
        risk_level: str,
    ) -> list[dict[str, Any]]:
        plan = []
        templates = {
            "Backlogs": (
                "Backlog recovery sprint",
                "Create a two-week remedial schedule, assign faculty support, and track mock-test scores.",
                "Faculty mentor",
                "14 days",
            ),
            "Attendance": (
                "Attendance recovery plan",
                "Set weekly attendance targets, notify guardian if needed, and review missed-subject patterns.",
                "Class coordinator",
                "7 days",
            ),
            "CGPA": (
                "Academic performance coaching",
                "Identify weak subjects, schedule focused tutorials, and review internal assessment strategy.",
                "Subject faculty",
                "21 days",
            ),
            "Skills": (
                "Skill portfolio upgrade",
                "Add two role-relevant skills, one proof project, and update the student profile.",
                "Placement cell",
                "30 days",
            ),
            "Professional Exposure": (
                "Experience-building track",
                "Shortlist internships, assign resume review, and prepare one application batch.",
                "Placement mentor",
                "30 days",
            ),
            "Data Quality": (
                "Complete missing records",
                "Audit attendance and profile data so future predictions are measured instead of estimated.",
                "Department admin",
                "3 days",
            ),
        }

        for index, cause in enumerate(root_causes[:4], start=1):
            title, details, owner, timeline = templates.get(
                cause["category"],
                ("Focused intervention", cause["message"], "Faculty mentor", "14 days"),
            )
            plan.append({
                "priority": index,
                "title": title,
                "category": cause["category"],
                "details": details,
                "owner": owner,
                "timeline": timeline,
                "expected_impact": min(cause["impact"], 40),
            })

        if not plan:
            plan.append({
                "priority": 1,
                "title": "Placement excellence track",
                "category": "Growth",
                "details": "Keep performance stable, add an advanced project, and prepare for higher-package roles.",
                "owner": "Placement cell",
                "timeline": "30 days",
                "expected_impact": 12,
            })

        if risk_level in ("critical", "high") and not any(item["category"] == "Mentoring" for item in plan):
            plan.append({
                "priority": len(plan) + 1,
                "title": "Weekly mentor check-in",
                "category": "Mentoring",
                "details": "Schedule a recurring review until the risk score moves below moderate.",
                "owner": "HOD or mentor",
                "timeline": "Every week",
                "expected_impact": 15,
            })

        return plan

    @staticmethod
    def _intervention(
        student: Student,
        risk_level: str,
        root_causes: list[dict[str, Any]],
    ) -> dict[str, Any]:
        primary = root_causes[0] if root_causes else None
        if risk_level == "critical":
            due_days = 2
        elif risk_level == "high":
            due_days = 5
        elif risk_level == "moderate":
            due_days = 10
        else:
            due_days = 21

        return {
            "student_id": student.id,
            "student_name": student.name,
            "risk_level": risk_level,
            "owner": "Faculty mentor" if risk_level in ("critical", "high") else "Placement cell",
            "next_step": primary["message"] if primary else "Continue growth coaching.",
            "due_in_days": due_days,
        }

    @staticmethod
    def _build_summary(profiles: list[dict[str, Any]]) -> dict[str, Any]:
        total = len(profiles)
        levels = [profile["risk"]["level"] for profile in profiles]
        avg_health = mean([profile["success_score"] for profile in profiles]) if profiles else 0
        avg_readiness = mean([
            profile["placement_readiness"]["score"] for profile in profiles
        ]) if profiles else 0
        return {
            "total_students": total,
            "critical": levels.count("critical"),
            "high_risk": levels.count("high"),
            "moderate_risk": levels.count("moderate"),
            "healthy": levels.count("healthy"),
            "avg_success_score": _round(avg_health),
            "avg_placement_readiness": _round(avg_readiness),
            "interventions_due": sum(1 for profile in profiles if profile["risk"]["level"] != "healthy"),
            "low_attendance": sum(
                1 for profile in profiles
                if profile["metrics"]["attendance_percentage"] < 75
            ),
            "students_with_backlogs": sum(
                1 for profile in profiles if profile["metrics"]["backlogs"] > 0
            ),
        }

    @staticmethod
    def _build_risk_distribution(profiles: list[dict[str, Any]]) -> list[dict[str, Any]]:
        labels = [
            ("critical", "Critical"),
            ("high", "High"),
            ("moderate", "Moderate"),
            ("healthy", "Healthy"),
        ]
        return [
            {"level": level, "label": label, "count": sum(1 for p in profiles if p["risk"]["level"] == level)}
            for level, label in labels
        ]

    @staticmethod
    def _build_department_metrics(profiles: list[dict[str, Any]]) -> list[dict[str, Any]]:
        grouped: dict[str, list[dict[str, Any]]] = {}
        for profile in profiles:
            dept = profile["student"]["department"] or "NA"
            grouped.setdefault(dept, []).append(profile)

        result = []
        for dept, items in grouped.items():
            result.append({
                "department": dept,
                "students": len(items),
                "avg_success_score": _round(mean([item["success_score"] for item in items])),
                "avg_placement_readiness": _round(mean([
                    item["placement_readiness"]["score"] for item in items
                ])),
                "critical_or_high": sum(
                    1 for item in items if item["risk"]["level"] in ("critical", "high")
                ),
            })
        return sorted(result, key=lambda item: item["critical_or_high"], reverse=True)

    @staticmethod
    def _build_focus_areas(profiles: list[dict[str, Any]]) -> list[dict[str, Any]]:
        grouped: dict[str, dict[str, Any]] = {}
        for profile in profiles:
            for cause in profile["root_causes"]:
                item = grouped.setdefault(cause["category"], {"category": cause["category"], "count": 0, "impact": 0})
                item["count"] += 1
                item["impact"] += cause["impact"]

        focus = []
        for item in grouped.values():
            focus.append({
                "category": item["category"],
                "affected_students": item["count"],
                "avg_impact": _round(item["impact"] / item["count"]),
            })
        return sorted(focus, key=lambda item: (item["affected_students"], item["avg_impact"]), reverse=True)

    @staticmethod
    def _build_intervention_board(
        profiles: list[dict[str, Any]],
        limit: int,
    ) -> list[dict[str, Any]]:
        interventions = [
            profile["intervention"]
            for profile in profiles
            if profile["risk"]["level"] != "healthy"
        ]
        return interventions[:limit]

    @staticmethod
    def _normalize_scenario(scenario: dict[str, Any]) -> dict[str, Any]:
        clean: dict[str, Any] = {}
        numeric_bounds = {
            "cgpa": (0, 10),
            "attendance_percentage": (0, 100),
            "backlog_count": (0, 20),
            "skills_count": (0, 50),
            "internships_count": (0, 20),
        }
        for key, (lower, upper) in numeric_bounds.items():
            if key in scenario and scenario[key] not in (None, ""):
                value = float(scenario[key])
                if key.endswith("_count") or key == "backlog_count":
                    clean[key] = int(_clamp(value, lower, upper))
                else:
                    clean[key] = _round(_clamp(value, lower, upper), 2)
        if scenario.get("clear_backlogs") is True:
            clean["clear_backlogs"] = True
        return clean

    @staticmethod
    def _risk_level(score: float) -> str:
        if score >= 70:
            return "critical"
        if score >= 50:
            return "high"
        if score >= 30:
            return "moderate"
        return "healthy"

    @staticmethod
    def _risk_label(level: str) -> str:
        return {
            "critical": "Critical",
            "high": "High Risk",
            "moderate": "Moderate",
            "healthy": "Healthy",
        }.get(level, "Unknown")

    @staticmethod
    def _readiness_level(score: float) -> str:
        if score >= 80:
            return "Placement Ready"
        if score >= 60:
            return "Nearly Ready"
        if score >= 40:
            return "Needs Work"
        return "Not Ready"
