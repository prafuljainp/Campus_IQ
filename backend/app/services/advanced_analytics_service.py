"""
Advanced Analytics Service
Handles predictive models for graduation, career recommendations, and placement prediction
"""
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Student, Marks, Attendance, Skill
import statistics

class AdvancedAnalyticsService:
    """Advanced ML-based analytics for student predictions"""

    @staticmethod
    def predict_graduation_probability(db: Session, student: Student) -> Dict[str, Any]:
        """
        Predict likelihood of graduation based on CGPA, attendance, and backlogs.
        
        Scoring:
        - CGPA: 0-100% (higher CGPA = higher probability)
        - Attendance: 0-100% (higher attendance = higher probability)
        - Backlogs: Negative impact (more backlogs = lower probability)
        - Semester Progress: Based on how far into program
        """
        try:
            # Get student data
            marks = db.query(Marks).filter(Marks.student_id == student.id).all()
            attendance = db.query(Attendance).filter(Attendance.student_id == student.id).all()
            
            if not marks:
                return {
                    "status": "insufficient_data",
                    "probability": 0,
                    "message": "Not enough data for prediction",
                    "factors": {}
                }

            # Calculate metrics
            cgpa = student.cgpa or 0
            cgpa_score = min(100, (cgpa / 10) * 100) if cgpa > 0 else 0
            
            # Calculate attendance percentage
            attendance_percentage = 0
            if attendance:
                present = len([a for a in attendance if a.is_present])
                total = len(attendance)
                attendance_percentage = (present / total) * 100 if total > 0 else 0
            
            # Count backlogs
            backlogs = len([m for m in marks if not m.is_pass])
            backlog_score = max(0, 100 - (backlogs * 15))  # 15% penalty per backlog
            
            # Calculate semester progression
            semesters = len(set([m.semester for m in marks])) if marks else 1
            semester_score = min(100, (semesters / 8) * 100)  # 8 semesters typical
            
            # Weighted calculation
            weights = {
                'cgpa': 0.35,
                'attendance': 0.30,
                'backlogs': 0.20,
                'semester': 0.15
            }
            
            graduation_probability = (
                (cgpa_score * weights['cgpa']) +
                (attendance_percentage * weights['attendance']) +
                (backlog_score * weights['backlogs']) +
                (semester_score * weights['semester'])
            )
            
            # Determine risk level
            if graduation_probability >= 80:
                risk_level = "excellent"
                status_message = "✅ On track for graduation!"
            elif graduation_probability >= 60:
                risk_level = "good"
                status_message = "📈 Good progress, maintain focus"
            elif graduation_probability >= 40:
                risk_level = "moderate"
                status_message = "⚠️ Need improvement to graduate"
            else:
                risk_level = "critical"
                status_message = "🔴 At risk - immediate action needed"
            
            return {
                "status": "success",
                "probability": round(graduation_probability, 2),
                "risk_level": risk_level,
                "message": status_message,
                "factors": {
                    "cgpa_contribution": round(cgpa_score * weights['cgpa'], 2),
                    "attendance_contribution": round(attendance_percentage * weights['attendance'], 2),
                    "backlog_contribution": round(backlog_score * weights['backlogs'], 2),
                    "semester_contribution": round(semester_score * weights['semester'], 2)
                },
                "metrics": {
                    "cgpa": round(cgpa, 2),
                    "attendance_percentage": round(attendance_percentage, 2),
                    "backlogs_count": backlogs,
                    "semesters_completed": semesters
                },
                "recommendations": AdvancedAnalyticsService._get_graduation_recommendations(
                    cgpa, attendance_percentage, backlogs, graduation_probability
                )
            }
        except Exception as e:
            return {
                "status": "error",
                "probability": 0,
                "message": f"Prediction failed: {str(e)}",
                "factors": {}
            }

    @staticmethod
    def recommend_career_paths(db: Session, student: Student) -> Dict[str, Any]:
        """
        Recommend career paths based on skills, CGPA, and academic performance.
        Uses rule-based recommendations with skill matching.
        """
        try:
            skills = db.query(Skill).join(
                Skill.students
            ).filter(
                Student.id == student.id
            ).all()
            
            marks = db.query(Marks).filter(Marks.student_id == student.id).all()
            
            skill_names = [s.name.lower() for s in skills]
            cgpa = student.cgpa or 0
            
            career_recommendations = []
            
            # Rule-based career mapping
            career_profiles = {
                "Software Engineer": {
                    "skills": ["python", "java", "javascript", "c++", "database"],
                    "min_cgpa": 6.5,
                    "description": "Develop and maintain software applications"
                },
                "Data Scientist": {
                    "skills": ["python", "machine learning", "statistics", "sql", "data analysis"],
                    "min_cgpa": 7.0,
                    "description": "Analyze data and build predictive models"
                },
                "DevOps Engineer": {
                    "skills": ["docker", "kubernetes", "linux", "ci/cd", "cloud"],
                    "min_cgpa": 7.0,
                    "description": "Manage infrastructure and deployment pipelines"
                },
                "Frontend Developer": {
                    "skills": ["javascript", "react", "html", "css", "ui/ux"],
                    "min_cgpa": 6.5,
                    "description": "Build user interfaces and web applications"
                },
                "Backend Developer": {
                    "skills": ["java", "python", "databases", "api design", "microservices"],
                    "min_cgpa": 7.0,
                    "description": "Build server-side applications and APIs"
                },
                "Product Manager": {
                    "skills": ["communication", "leadership", "analytics", "product thinking"],
                    "min_cgpa": 7.5,
                    "description": "Manage product strategy and features"
                },
                "QA Engineer": {
                    "skills": ["testing", "automation", "sql", "python", "attention to detail"],
                    "min_cgpa": 6.0,
                    "description": "Ensure software quality through testing"
                }
            }
            
            # Score each career path
            career_scores = {}
            for career, profile in career_profiles.items():
                if cgpa < profile["min_cgpa"]:
                    continue  # Skip if CGPA requirement not met
                
                skill_matches = sum(1 for skill in profile["skills"] if any(s in skill_name for s in skill for skill_name in skill_names))
                skill_match_percentage = (skill_matches / len(profile["skills"])) * 100 if profile["skills"] else 0
                
                career_scores[career] = {
                    "match_percentage": round(skill_match_percentage, 1),
                    "description": profile["description"],
                    "required_skills": profile["skills"],
                    "missing_skills": [s for s in profile["skills"] if not any(s in skill_name for s in skill for skill_name in skill_names)]
                }
            
            # Sort by match percentage
            sorted_careers = sorted(career_scores.items(), key=lambda x: x[1]["match_percentage"], reverse=True)
            career_recommendations = [
                {
                    "career_path": career,
                    **details
                }
                for career, details in sorted_careers[:5]  # Top 5
            ]
            
            return {
                "status": "success",
                "recommendations": career_recommendations,
                "current_skills": skill_names,
                "cgpa": cgpa,
                "message": f"Based on {len(skill_names)} skills and {cgpa} CGPA"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Career recommendation failed: {str(e)}",
                "recommendations": []
            }

    @staticmethod
    def predict_placement_probability(db: Session, student: Student) -> Dict[str, Any]:
        """
        Predict placement success probability using multiple factors.
        """
        try:
            marks = db.query(Marks).filter(Marks.student_id == student.id).all()
            attendance = db.query(Attendance).filter(Attendance.student_id == student.id).all()
            skills = db.query(Skill).join(
                Skill.students
            ).filter(
                Student.id == student.id
            ).all()
            
            # Calculate factors
            cgpa = student.cgpa or 0
            cgpa_score = min(100, (cgpa / 10) * 100)
            
            backlogs = len([m for m in marks if not m.is_pass])
            backlog_score = max(0, 100 - (backlogs * 20))
            
            attendance_percentage = 0
            if attendance:
                present = len([a for a in attendance if a.is_present])
                total = len(attendance)
                attendance_percentage = (present / total) * 100 if total > 0 else 0
            
            skills_count = len(skills)
            skills_score = min(100, (skills_count / 10) * 100)
            
            # Weighted calculation
            placement_probability = (
                (cgpa_score * 0.40) +
                (backlog_score * 0.25) +
                (attendance_percentage * 0.20) +
                (skills_score * 0.15)
            )
            
            # Improvement suggestions
            suggestions = []
            if cgpa < 6.5:
                suggestions.append("📚 Improve CGPA - Aim for 7.0+ for better placements")
            if backlogs > 0:
                suggestions.append(f"🔴 Clear {backlogs} backlog(s) - Companies prefer clean records")
            if attendance_percentage < 75:
                suggestions.append("📅 Maintain 75%+ attendance - Required for most companies")
            if skills_count < 5:
                suggestions.append("🛠️ Learn more technical skills - Minimum 5-6 relevant skills needed")
            
            return {
                "status": "success",
                "probability": round(placement_probability, 2),
                "likelihood": "High" if placement_probability >= 75 else "Moderate" if placement_probability >= 50 else "Low",
                "factors": {
                    "cgpa_score": round(cgpa_score, 2),
                    "backlog_score": round(backlog_score, 2),
                    "attendance_score": round(attendance_percentage, 2),
                    "skills_score": round(skills_score, 2)
                },
                "metrics": {
                    "cgpa": round(cgpa, 2),
                    "backlogs": backlogs,
                    "attendance_percentage": round(attendance_percentage, 2),
                    "skills_count": skills_count
                },
                "suggestions": suggestions[:3]
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Placement prediction failed: {str(e)}",
                "probability": 0
            }

    @staticmethod
    def _get_graduation_recommendations(cgpa: float, attendance: float, backlogs: int, probability: float) -> List[str]:
        """Generate specific recommendations based on metrics."""
        recommendations = []
        
        if probability >= 80:
            recommendations.append("✅ Maintain current performance level")
            recommendations.append("🎯 Start placement preparation")
        else:
            if cgpa < 7.0:
                recommendations.append("📖 Focus on improving GPA - Take difficult courses strategically")
            if attendance < 80:
                recommendations.append("📅 Improve attendance - Attend all classes and labs")
            if backlogs > 0:
                recommendations.append(f"🔴 Clear backlogs immediately - Take extra classes if needed")
        
        recommendations.append("💬 Meet with academic advisor regularly")
        return recommendations[:3]


class DataWarehouseSchema:
    """
    Schema design for data warehouse analytics storage.
    Prepared for large-scale data aggregation and reporting.
    """
    
    @staticmethod
    def get_schema_structure() -> Dict[str, Any]:
        """Return data warehouse schema structure."""
        return {
            "fact_tables": {
                "fact_student_performance": {
                    "columns": [
                        "student_id", "semester", "cgpa", "attendance_percentage",
                        "marks_average", "backlogs_count", "skills_count", "placement_status"
                    ],
                    "primary_key": ["student_id", "semester"],
                    "purpose": "Track student performance metrics over time"
                },
                "fact_placement": {
                    "columns": [
                        "student_id", "placement_year", "placed", "company_id",
                        "salary", "profile_type", "prediction_probability"
                    ],
                    "primary_key": ["student_id", "placement_year"],
                    "purpose": "Track placement outcomes and predictions"
                }
            },
            "dimension_tables": {
                "dim_student": {
                    "columns": ["student_id", "department", "batch", "specialization"],
                    "purpose": "Student master data"
                },
                "dim_company": {
                    "columns": ["company_id", "company_name", "industry", "salary_range"],
                    "purpose": "Company master data"
                },
                "dim_time": {
                    "columns": ["semester_id", "year", "semester_number"],
                    "purpose": "Time dimension for trend analysis"
                }
            }
        }
