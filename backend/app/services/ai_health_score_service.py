"""
AI Health Score Service
Calculates comprehensive student health metrics across multiple dimensions.
"""
from sqlalchemy.orm import Session
from app.models import Student
from typing import Optional, Dict, List
from datetime import datetime, timedelta


class HealthScoreService:
    """Service for calculating and analyzing student health scores."""
    
    @staticmethod
    def calculate_health_score(db: Session, student_id: int) -> Dict:
        """
        Calculate comprehensive health score for a student (0-100).
        
        Components:
        - CGPA (30%): Academic performance
        - Attendance (25%): Class participation
        - Skills (25%): Professional development
        - Backlogs (20%): Academic standing
        """
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")
        
        # Component scores (0-100 each)
        cgpa_score = HealthScoreService._calculate_cgpa_score(student)
        attendance_score = HealthScoreService._calculate_attendance_score(student)
        skills_score = HealthScoreService._calculate_skills_score(student)
        backlogs_score = HealthScoreService._calculate_backlogs_score(student)
        
        # Weighted total
        total_score = (
            cgpa_score * 0.30 +
            attendance_score * 0.25 +
            skills_score * 0.25 +
            backlogs_score * 0.20
        )
        
        total_score = round(total_score, 1)
        status = HealthScoreService._get_status(total_score)
        
        # Component breakdown
        components = [
            {
                "name": "CGPA",
                "score": round(cgpa_score, 1),
                "weight": 0.30,
                "contribution": round(cgpa_score * 0.30, 1),
                "target": 95,
                "current_value": student.cgpa,
                "max_value": 10,
                "unit": "/10"
            },
            {
                "name": "Attendance",
                "score": round(attendance_score, 1),
                "weight": 0.25,
                "contribution": round(attendance_score * 0.25, 1),
                "target": 85,
                "current_value": HealthScoreService._get_attendance_percentage(student),
                "max_value": 100,
                "unit": "%"
            },
            {
                "name": "Skills",
                "score": round(skills_score, 1),
                "weight": 0.25,
                "contribution": round(skills_score * 0.25, 1),
                "target": 80,
                "current_value": len(student.skills),
                "max_value": 15,
                "unit": "count"
            },
            {
                "name": "Academic Standing",
                "score": round(backlogs_score, 1),
                "weight": 0.20,
                "contribution": round(backlogs_score * 0.20, 1),
                "target": 100,
                "current_value": student.backlog_count,
                "max_value": 0,
                "unit": "backlogs"
            }
        ]
        
        # Recommendations
        recommendations = HealthScoreService._generate_recommendations(
            student, cgpa_score, attendance_score, skills_score, backlogs_score
        )
        
        # Next milestone
        next_milestone = ((int(total_score / 10) + 1) * 10)
        if next_milestone > 100:
            next_milestone = 100
        points_to_milestone = next_milestone - total_score
        
        return {
            "student_id": student_id,
            "total_score": total_score,
            "status": status,
            "status_emoji": HealthScoreService._get_status_emoji(status),
            "breakdown": {
                "cgpa": round(cgpa_score, 1),
                "attendance": round(attendance_score, 1),
                "skills": round(skills_score, 1),
                "backlogs": round(backlogs_score, 1)
            },
            "components": components,
            "recommendations": recommendations,
            "next_milestone": next_milestone,
            "progress_to_milestone": f"{points_to_milestone:.1f} points needed",
            "calculated_at": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def _calculate_cgpa_score(student: Student) -> float:
        """
        CGPA score: Convert 0-10 CGPA to 0-100 score.
        - 8.0+ = 90-100
        - 7.0-7.9 = 70-89
        - 6.0-6.9 = 50-69
        - Below 6.0 = <50
        """
        if student.cgpa is None or student.cgpa == 0:
            return 20
        
        cgpa = min(student.cgpa, 10)  # Cap at 10
        score = (cgpa / 10) * 100
        return min(100, score)
    
    @staticmethod
    def _calculate_attendance_score(student: Student) -> float:
        """
        Attendance score based on attendance percentage.
        - 90%+ = 100
        - 75-89% = 75-99
        - 60-74% = 50-74
        - Below 60% = <50
        """
        attendance_pct = HealthScoreService._get_attendance_percentage(student)
        
        if attendance_pct >= 90:
            return 100
        elif attendance_pct >= 75:
            return 75 + (attendance_pct - 75) * 0.96  # 75-99
        elif attendance_pct >= 60:
            return 50 + (attendance_pct - 60) * 0.833  # 50-74
        else:
            return max(0, attendance_pct / 1.2)  # Scale down
    
    @staticmethod
    def _calculate_skills_score(student: Student) -> float:
        """
        Skills score based on number and diversity of skills.
        - 15+ skills = 100
        - 10-14 skills = 75-99
        - 5-9 skills = 50-74
        - 1-4 skills = 20-49
        - 0 skills = 0
        """
        num_skills = len(student.skills) if student.skills else 0
        
        if num_skills == 0:
            return 0
        elif num_skills <= 4:
            return 20 + (num_skills - 1) * 10  # 20-50
        elif num_skills <= 9:
            return 50 + (num_skills - 5) * 4.8  # 50-74
        elif num_skills <= 14:
            return 75 + (num_skills - 10) * 4.8  # 75-99
        else:
            return 100
    
    @staticmethod
    def _calculate_backlogs_score(student: Student) -> float:
        """
        Backlogs score: Penalize for each active backlog.
        - 0 backlogs = 100
        - 1 backlog = 60
        - 2 backlogs = 30
        - 3+ backlogs = 0
        """
        backlogs = student.backlog_count if student.backlog_count else 0
        
        if backlogs == 0:
            return 100
        elif backlogs == 1:
            return 60
        elif backlogs == 2:
            return 30
        else:
            return max(0, 20 - (backlogs - 2) * 5)
    
    @staticmethod
    def _get_attendance_percentage(student: Student) -> float:
        """Get student's current attendance percentage."""
        # Calculate from attendance records
        # This is a placeholder - integrate with actual attendance data
        if hasattr(student, 'attendance') and student.attendance:
            total = len(student.attendance)
            present = sum(1 for a in student.attendance if a.status == 'present')
            if total > 0:
                return (present / total) * 100
        return 75  # Default assumption
    
    @staticmethod
    def _get_status(score: float) -> str:
        """Get status label based on score."""
        if score >= 80:
            return "Excellent"
        elif score >= 60:
            return "Good"
        elif score >= 40:
            return "At Risk"
        else:
            return "Critical"
    
    @staticmethod
    def _get_status_emoji(status: str) -> str:
        """Get emoji for status."""
        status_map = {
            "Excellent": "🟢",
            "Good": "🟡",
            "At Risk": "🟠",
            "Critical": "🔴"
        }
        return status_map.get(status, "⚪")
    
    @staticmethod
    def _generate_recommendations(
        student: Student,
        cgpa_score: float,
        attendance_score: float,
        skills_score: float,
        backlogs_score: float
    ) -> List[str]:
        """
        Generate personalized recommendations based on weak areas.
        """
        recommendations = []
        
        # CGPA recommendations
        if cgpa_score < 60:
            recommendations.append("🎯 Focus on improving CGPA - Start with subjects where you're weakest")
        elif cgpa_score < 75:
            recommendations.append("📚 Take on additional projects/internships to boost CGPA")
        
        # Attendance recommendations
        if attendance_score < 60:
            recommendations.append("📍 Attend classes regularly - Attendance impacts both academics and placements")
        elif attendance_score < 80:
            recommendations.append("🚌 Improve attendance to unlock more opportunities")
        
        # Skills recommendations
        if skills_score < 30:
            recommendations.append(f"💻 Develop technical skills - You have {len(student.skills) or 0} skills, aim for 10+")
        elif skills_score < 70:
            recommendations.append(f"🎓 Learn 5-10 more skills relevant to your career goals")
        
        # Backlogs recommendations
        if student.backlog_count and student.backlog_count > 0:
            recommendations.append(f"⚠️ Clear your {student.backlog_count} backlog(s) - They block placement eligibility")
        
        # Positive reinforcement
        if cgpa_score >= 85 and attendance_score >= 80:
            recommendations.append("🌟 You're on track! Focus on skill development for placements")
        
        return recommendations if recommendations else ["✨ You're doing great! Keep it up!"]


class StudentHealthTrendService:
    """Service for analyzing student health trends over time."""
    
    @staticmethod
    def get_health_trend(db: Session, student_id: int, semesters: int = 8) -> Dict:
        """
        Get health score trend over semesters.
        Returns historical and projected scores.
        """
        # This requires historical data - integrate with marks history
        # Placeholder showing the structure
        
        return {
            "student_id": student_id,
            "current_semester": 1,
            "health_history": [
                {"semester": i, "score": 65 + (i * 2), "status": "Good"} 
                for i in range(1, semesters + 1)
            ],
            "trend": "improving",
            "projection": {
                "next_semester": 75,
                "graduation": 82
            }
        }
