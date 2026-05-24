"""
AI Analytics Service
Provides comprehensive analytics for administrators and HODs.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models import Student, StudentSkill, Skill
from typing import Dict, List, Optional
from collections import Counter
from datetime import datetime


class AdminAnalyticsService:

    @staticmethod
    def get_analytics_data_warehouse_schema() -> dict:
        """
        Returns a recommended schema for analytics data warehouse integration.
        Simulates structure for large-scale data analysis (aggregated tables, star schema).
        """
        return {
            "fact_tables": [
                {
                    "name": "fact_student_performance",
                    "description": "Aggregated student academic and placement data",
                    "fields": [
                        {"name": "student_id", "type": "int"},
                        {"name": "institution_id", "type": "int"},
                        {"name": "department_id", "type": "int"},
                        {"name": "semester", "type": "int"},
                        {"name": "cgpa", "type": "float"},
                        {"name": "attendance_percentage", "type": "float"},
                        {"name": "backlog_count", "type": "int"},
                        {"name": "skills_count", "type": "int"},
                        {"name": "placement_status", "type": "string"},
                        {"name": "placement_package_lpa", "type": "float"},
                        {"name": "created_at", "type": "datetime"}
                    ]
                },
                {
                    "name": "fact_attendance_daily",
                    "description": "Daily attendance records for analytics",
                    "fields": [
                        {"name": "student_id", "type": "int"},
                        {"name": "date", "type": "date"},
                        {"name": "subject_id", "type": "int"},
                        {"name": "is_present", "type": "bool"},
                        {"name": "department_id", "type": "int"},
                        {"name": "institution_id", "type": "int"}
                    ]
                }
            ],
            "dimension_tables": [
                {"name": "dim_student", "fields": ["student_id", "name", "gender", "admission_year", "department_id", "institution_id"]},
                {"name": "dim_department", "fields": ["department_id", "name", "institution_id"]},
                {"name": "dim_institution", "fields": ["institution_id", "name"]},
                {"name": "dim_date", "fields": ["date", "year", "month", "day", "semester"]},
                {"name": "dim_subject", "fields": ["subject_id", "name", "department_id"]}
            ],
            "notes": "This schema is ready for integration with cloud data warehouses (BigQuery, Redshift, Synapse). Populate fact tables with ETL jobs or materialized views."
        }

    @staticmethod
    def simulate_analytics_warehouse_population(db: Session) -> dict:
        """
        Simulate population of analytics warehouse tables with aggregated data.
        """
        students = db.query(Student).all()
        fact_student_performance = []
        for s in students:
            total = len(s.attendance_records)
            attended = len([a for a in s.attendance_records if a.is_present])
            attendance_percentage = (attended / total * 100) if total > 0 else 0
            fact_student_performance.append({
                "student_id": s.id,
                "institution_id": getattr(s, 'institution_id', 1),
                "department_id": s.department_id,
                "semester": s.semester,
                "cgpa": s.cgpa,
                "attendance_percentage": round(attendance_percentage, 1),
                "backlog_count": s.backlog_count,
                "skills_count": len(s.skills) if s.skills else 0,
                "placement_status": "placed" if s.placements else "not_placed",
                "placement_package_lpa": s.placements[0].package_lpa if s.placements else None,
                "created_at": s.created_at
            })
        return {"fact_student_performance": fact_student_performance[:10], "total_records": len(fact_student_performance)}

        @staticmethod
        def predict_graduation_probability(student: Student, attendance_percentage: float = None) -> dict:
            """
            Predict the likelihood (0-100%) of student graduation based on CGPA, attendance, and backlogs.
            Uses a simple weighted rule-based model for demonstration.
            """
            # Weights (can be tuned or replaced with ML model)
            cgpa_weight = 0.5
            attendance_weight = 0.3
            backlog_weight = 0.2

            # CGPA score (normalized 0-1)
            cgpa = float(student.cgpa or 0)
            cgpa_score = min(max((cgpa - 5.0) / 5.0, 0), 1)  # 5.0 = min, 10.0 = max

            # Attendance score (normalized 0-1)
            if attendance_percentage is None:
                # Calculate from attendance records if not provided
                total = len(student.attendance_records)
                attended = len([a for a in student.attendance_records if a.is_present])
                attendance_percentage = (attended / total * 100) if total > 0 else 0
            attendance_score = min(max(attendance_percentage / 100, 0), 1)

            # Backlog score (normalized 0-1, more backlogs = lower score)
            backlogs = student.backlog_count or 0
            if backlogs == 0:
                backlog_score = 1.0
            elif backlogs == 1:
                backlog_score = 0.7
            elif backlogs == 2:
                backlog_score = 0.4
            else:
                backlog_score = 0.1

            # Weighted sum
            probability = (
                cgpa_score * cgpa_weight +
                attendance_score * attendance_weight +
                backlog_score * backlog_weight
            ) * 100

            probability = round(probability, 1)
            status = (
                "High" if probability >= 80 else
                "Moderate" if probability >= 60 else
                "Low"
            )
            return {
                "graduation_probability": probability,
                "status": status,
                "cgpa": cgpa,
                "attendance_percentage": round(attendance_percentage, 1),
                "backlog_count": backlogs
            }
    """Service for providing analytics insights to admins."""
    
    @staticmethod
    def get_dashboard_analytics(db: Session, department_id: Optional[int] = None) -> Dict:
        """
        Get comprehensive analytics dashboard.
        """
        query = db.query(Student).filter(Student.is_active == True)
        
        if department_id:
            query = query.filter(Student.department_id == department_id)
        
        students = query.all()
        
        if not students:
            return {
                "message": "No students found",
                "data": {}
            }
        
        cgpas = [s.cgpa for s in students if s.cgpa]
        backlogs_count = sum(s.backlog_count or 0 for s in students)
        total_skills = sum(len(s.skills) if s.skills else 0 for s in students)
        
        return {
            "summary": {
                "total_students": len(students),
                "avg_cgpa": round(sum(cgpas) / len(cgpas) if cgpas else 0, 2),
                "total_backlogs": backlogs_count,
                "total_skills_across_students": total_skills,
                "avg_skills_per_student": round(total_skills / len(students) if students else 0, 2)
            },
            "distribution": {
                "cgpa": AdminAnalyticsService._get_cgpa_distribution(students),
                "backlogs": AdminAnalyticsService._get_backlogs_distribution(students),
                "semesters": AdminAnalyticsService._get_semester_distribution(students)
            },
            "insights": AdminAnalyticsService._generate_dashboard_insights(students),
            "most_demanded_skills": AdminAnalyticsService._get_most_demanded_skills(students),
            "placement_readiness": AdminAnalyticsService._get_placement_readiness_stats(students),
            "generated_at": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def _get_cgpa_distribution(students: List[Student]) -> Dict:
        """Get CGPA distribution statistics."""
        cgpas = [s.cgpa for s in students if s.cgpa]
        
        if not cgpas:
            return {}
        
        categories = {
            "Excellent (8.5+)": 0,
            "Very Good (7.5-8.4)": 0,
            "Good (7.0-7.4)": 0,
            "Average (6.0-6.9)": 0,
            "Below Average (<6.0)": 0
        }
        
        for cgpa in cgpas:
            if cgpa >= 8.5:
                categories["Excellent (8.5+)"] += 1
            elif cgpa >= 7.5:
                categories["Very Good (7.5-8.4)"] += 1
            elif cgpa >= 7.0:
                categories["Good (7.0-7.4)"] += 1
            elif cgpa >= 6.0:
                categories["Average (6.0-6.9)"] += 1
            else:
                categories["Below Average (<6.0)"] += 1
        
        return categories
    
    @staticmethod
    def _get_backlogs_distribution(students: List[Student]) -> Dict:
        """Get backlog distribution statistics."""
        backlog_counts = {}
        
        for student in students:
            backlogs = student.backlog_count or 0
            if backlogs == 0:
                key = "No Backlogs"
            elif backlogs == 1:
                key = "1 Backlog"
            elif backlogs == 2:
                key = "2 Backlogs"
            else:
                key = f"{backlogs} Backlogs"
            
            backlog_counts[key] = backlog_counts.get(key, 0) + 1
        
        return backlog_counts or {"No Backlogs": len(students)}
    
    @staticmethod
    def _get_semester_distribution(students: List[Student]) -> Dict:
        """Get semester-wise distribution."""
        semester_dist = {}
        
        for student in students:
            sem = student.semester or "Unknown"
            semester_dist[f"Semester {sem}"] = semester_dist.get(f"Semester {sem}", 0) + 1
        
        return semester_dist
    
    @staticmethod
    def _get_most_demanded_skills(students: List[Student]) -> List[Dict]:
        """
        Get most demanded/popular skills among students.
        """
        skill_counter = Counter()
        skill_details = {}
        
        for student in students:
            if student.skills:
                for student_skill in student.skills:
                    skill_name = student_skill.skill.name
                    skill_counter[skill_name] += 1
                    
                    if skill_name not in skill_details:
                        skill_details[skill_name] = {
                            "count": 0,
                            "level_distribution": Counter()
                        }
                    
                    skill_details[skill_name]["count"] += 1
                    skill_details[skill_name]["level_distribution"][student_skill.level] += 1
        
        # Get top 10 skills
        top_skills = skill_counter.most_common(10)
        
        result = []
        for skill_name, count in top_skills:
            details = skill_details.get(skill_name, {})
            result.append({
                "name": skill_name,
                "student_count": count,
                "student_percentage": round((count / len(students)) * 100, 1),
                "level_distribution": dict(details.get("level_distribution", {}))
            })
        
        return result
    
    @staticmethod
    def _get_placement_readiness_stats(students: List[Student]) -> Dict:
        """Get placement readiness statistics."""
        placement_ready = 0
        almost_ready = 0
        needs_improvement = 0
        
        for student in students:
            if student.cgpa and student.cgpa >= 7.0 and (not student.backlog_count or student.backlog_count == 0):
                placement_ready += 1
            elif student.cgpa and student.cgpa >= 6.0 and (not student.backlog_count or student.backlog_count <= 1):
                almost_ready += 1
            else:
                needs_improvement += 1
        
        return {
            "placement_ready": {
                "count": placement_ready,
                "percentage": round((placement_ready / len(students)) * 100, 1)
            },
            "almost_ready": {
                "count": almost_ready,
                "percentage": round((almost_ready / len(students)) * 100, 1)
            },
            "needs_improvement": {
                "count": needs_improvement,
                "percentage": round((needs_improvement / len(students)) * 100, 1)
            }
        }
    
    @staticmethod
    def _generate_dashboard_insights(students: List[Student]) -> List[str]:
        """Generate actionable insights from student data."""
        insights = []
        
        cgpas = [s.cgpa for s in students if s.cgpa]
        if cgpas:
            avg_cgpa = sum(cgpas) / len(cgpas)
            if avg_cgpa < 6.5:
                insights.append(f"⚠️ Average CGPA is {round(avg_cgpa, 2)} - Below healthy benchmark. Consider intervention programs.")
            elif avg_cgpa < 7.0:
                insights.append(f"📊 Average CGPA is {round(avg_cgpa, 2)} - Room for improvement through tutoring and support.")
        
        total_backlogs = sum(s.backlog_count or 0 for s in students)
        if total_backlogs > len(students) * 0.2:
            insights.append(f"⚠️ {round((total_backlogs / sum(1 for _ in students)) * 100, 1)}% of students have backlogs - Initiate remedial classes.")
        
        students_with_skills = len([s for s in students if s.skills and len(s.skills) > 0])
        if students_with_skills < len(students) * 0.5:
            insights.append("💡 Only 50% of students have documented skills - Encourage skill certification programs.")
        
        avg_skills = sum(len(s.skills) if s.skills else 0 for s in students) / len(students) if students else 0
        if avg_skills < 3:
            insights.append(f"📉 Average {round(avg_skills, 1)} skills per student - Below placement readiness threshold.")
        
        if not insights:
            insights.append("✅ Overall cohort health is good! Continue focus on skill development and placement preparation.")
        
        return insights
    
    @staticmethod
    def get_department_comparison(db: Session) -> Dict:
        """Compare metrics across departments."""
        departments = db.query(Student.department_id, func.count(Student.id)).group_by(
            Student.department_id
        ).all()
        
        comparison = []
        
        for dept_id, count in departments:
            dept_students = db.query(Student).filter(
                Student.department_id == dept_id,
                Student.is_active == True
            ).all()
            
            cgpas = [s.cgpa for s in dept_students if s.cgpa]
            
            comparison.append({
                "department_id": dept_id,
                "total_students": count,
                "avg_cgpa": round(sum(cgpas) / len(cgpas) if cgpas else 0, 2),
                "total_backlogs": sum(s.backlog_count or 0 for s in dept_students),
                "avg_skills": round(
                    sum(len(s.skills) if s.skills else 0 for s in dept_students) / count if count else 0,
                    2
                )
            })
        
        # Sort by avg_cgpa descending
        comparison.sort(key=lambda x: x["avg_cgpa"], reverse=True)
        
        return {
            "comparison": comparison,
            "top_department": comparison[0] if comparison else None,
            "lowest_department": comparison[-1] if comparison else None
        }
    
    @staticmethod
    def get_placement_trend_analysis(db: Session) -> Dict:
        """Analyze placement trends (requires placement data)."""
        # This would analyze historical placement data
        # Placeholder structure
        
        return {
            "current_year": {
                "total_placed": 85,
                "placement_rate": 85,
                "in_campus": 60,
                "pool_campus": 25,
                "avg_ctc": 8.5
            },
            "previous_year": {
                "total_placed": 78,
                "placement_rate": 78,
                "avg_ctc": 7.8
            },
            "trend": {
                "rate_change": "+7%",
                "ctc_change": "+8.97%"
            },
            "top_hiring_companies": [
                {"name": "Google", "placements": 12},
                {"name": "Microsoft", "placements": 10},
                {"name": "Amazon", "placements": 8}
            ]
        }
    
    @staticmethod
    def generate_recommendations_report(db: Session, department_id: Optional[int] = None) -> Dict:
        """Generate actionable admin recommendations."""
        query = db.query(Student).filter(Student.is_active == True)
        
        if department_id:
            query = query.filter(Student.department_id == department_id)
        
        students = query.all()
        
        recommendations = []
        
        # Backlog analysis
        backlog_students = [s for s in students if s.backlog_count and s.backlog_count > 0]
        if backlog_students:
            recommendations.append({
                "category": "Academic Support",
                "priority": "High",
                "action": f"Conduct makeup exams for {len(backlog_students)} students with backlogs",
                "impact": "Enable placement eligibility for backlog students",
                "deadline": "Next 4 weeks"
            })
        
        # CGPA improvement
        low_cgpa_students = [s for s in students if s.cgpa and s.cgpa < 6.0]
        if low_cgpa_students:
            recommendations.append({
                "category": "Academic Excellence",
                "priority": "Medium",
                "action": f"Organize tutoring sessions for {len(low_cgpa_students)} students below 6.0 CGPA",
                "impact": "Improve academic performance and placement readiness",
                "deadline": "This semester"
            })
        
        # Skill development
        no_skills_students = [s for s in students if not s.skills or len(s.skills) == 0]
        if no_skills_students:
            recommendations.append({
                "category": "Skill Development",
                "priority": "High",
                "action": f"Launch skill certification program for {len(no_skills_students)} students with no skills",
                "impact": "Build technical competencies for placement",
                "deadline": "Next 6 weeks"
            })
        
        # Placement preparation
        placement_ready = len([s for s in students if s.cgpa and s.cgpa >= 7.0])
        if placement_ready > len(students) * 0.5:
            recommendations.append({
                "category": "Placement Preparation",
                "priority": "Medium",
                "action": f"Intensify placement drives - {placement_ready} students are ready",
                "impact": "Maximize placement opportunities",
                "deadline": "Immediate"
            })
        
        return {
            "department_id": department_id,
            "generated_at": datetime.utcnow().isoformat(),
            "total_recommendations": len(recommendations),
            "recommendations": recommendations
        }


from typing import Optional
