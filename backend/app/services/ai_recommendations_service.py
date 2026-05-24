"""
AI Recommendations Service
Generates actionable recommendations, action plans, and smart alerts.
"""
from sqlalchemy.orm import Session
from app.models import Student
from typing import Dict, List
from datetime import datetime, timedelta
from enum import Enum


class AlertSeverity(str, Enum):
    """Alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertType(str, Enum):
    """Alert types."""
    ATTENDANCE = "attendance"
    BACKLOG = "backlog"
    PLACEMENT = "placement"
    SKILL = "skill"
    EXAM = "exam"
    EVENT = "event"


class RecommendationService:
    """Service for generating personalized recommendations and action plans."""
    
    @staticmethod
    def generate_action_plan(db: Session, student_id: int, health_score: float = None) -> Dict:
        """
        Generate a prioritized action plan for student improvement.
        
        Returns:
        - Priority-ranked actions
        - Timeline estimates
        - Expected improvements
        - Success rate
        """
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")
        
        # Identify weak areas
        weak_areas = RecommendationService._identify_weak_areas(student)
        
        # Generate priority actions
        actions = []
        for area in weak_areas:
            area_actions = RecommendationService._generate_area_actions(student, area)
            actions.extend(area_actions)
        
        # Sort by priority score
        actions.sort(key=lambda x: x["priority_score"], reverse=True)
        
        # Limit to top 5 actions
        actions = actions[:5]
        
        # Assign priority rank
        for i, action in enumerate(actions, 1):
            action["priority"] = i
            del action["priority_score"]
        
        # Calculate estimated improvement
        current_health = health_score or 65  # Default assumption
        estimated_health_improvement = sum(a.get("health_score_impact", 0) for a in actions) - current_health
        
        return {
            "student_id": student_id,
            "critical_area": weak_areas[0]["area"] if weak_areas else "Overall",
            "action_plan": actions,
            "estimated_improvement": {
                "current_health_score": round(current_health, 1),
                "projected_health_score": round(current_health + estimated_health_improvement, 1),
                "total_improvement": round(estimated_health_improvement, 1),
                "timeline": "6-8 weeks"
            },
            "success_factors": RecommendationService._get_success_factors(student),
            "generated_at": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def _identify_weak_areas(student: Student) -> List[Dict]:
        """Identify weak areas in student's profile."""
        weak_areas = []
        
        # Check CGPA
        if student.cgpa is None or student.cgpa < 6.0:
            weak_areas.append({
                "area": "CGPA",
                "current_value": student.cgpa or 0,
                "target_value": 7.0,
                "severity": "Critical" if (student.cgpa or 0) < 5.0 else "High"
            })
        elif student.cgpa < 7.0:
            weak_areas.append({
                "area": "CGPA",
                "current_value": student.cgpa,
                "target_value": 7.5,
                "severity": "Medium"
            })
        
        # Check Attendance
        attendance = 75  # Placeholder
        if attendance < 75:
            weak_areas.append({
                "area": "Attendance",
                "current_value": attendance,
                "target_value": 85,
                "severity": "Critical"
            })
        
        # Check Skills
        num_skills = len(student.skills) if student.skills else 0
        if num_skills < 5:
            weak_areas.append({
                "area": "Skills",
                "current_value": num_skills,
                "target_value": 10,
                "severity": "High"
            })
        
        # Check Backlogs
        if student.backlog_count and student.backlog_count > 0:
            weak_areas.append({
                "area": "Backlogs",
                "current_value": student.backlog_count,
                "target_value": 0,
                "severity": "Critical"
            })
        
        # Sort by severity
        severity_order = {"Critical": 0, "High": 1, "Medium": 2}
        weak_areas.sort(key=lambda x: severity_order.get(x["severity"], 3))
        
        return weak_areas
    
    @staticmethod
    def _generate_area_actions(student: Student, weak_area: Dict) -> List[Dict]:
        """Generate specific actions for a weak area."""
        area = weak_area["area"]
        actions = []
        
        if area == "CGPA":
            actions = [
                {
                    "action": "Identify your weakest subject and create a 4-week study plan",
                    "why": "Focus mastery on subjects bringing down your average",
                    "specific_steps": [
                        "1. Review last semester's marks to identify lowest scores",
                        "2. Schedule daily 3-hour dedicated study blocks",
                        "3. Solve previous year papers weekly",
                        "4. Take mock tests after each topic"
                    ],
                    "success_metrics": ["+0.3 CGPA improvement"],
                    "duration": "4 weeks",
                    "effort": "High",
                    "health_score_impact": 72,
                    "placement_prob_impact": 77,
                    "priority_score": 95
                },
                {
                    "action": "Attend extra classes or hire a tutor for tough subjects",
                    "why": "Professional guidance accelerates learning",
                    "specific_steps": [
                        "1. List subjects where you scored <6/10",
                        "2. Find senior mentors or tutors",
                        "3. Schedule 2 sessions per week",
                        "4. Review concept notes before each session"
                    ],
                    "success_metrics": ["+0.2 CGPA", "Better conceptual clarity"],
                    "duration": "8 weeks",
                    "effort": "Medium",
                    "health_score_impact": 75,
                    "placement_prob_impact": 78,
                    "priority_score": 85
                }
            ]
        
        elif area == "Attendance":
            actions = [
                {
                    "action": "Commit to attending ALL classes for the next 4 weeks",
                    "why": "Regular attendance blocks unlock placement eligibility",
                    "specific_steps": [
                        "1. Set phone reminders 5 min before each class",
                        "2. Plan commute timing to never miss a class",
                        "3. Create a calendar marking attended dates",
                        "4. Join a peer group for accountability"
                    ],
                    "success_metrics": ["+15% attendance", "Better class notes"],
                    "duration": "4 weeks",
                    "effort": "High",
                    "health_score_impact": 80,
                    "placement_prob_impact": 85,
                    "priority_score": 98
                },
                {
                    "action": "Meet with your faculty to discuss attendance issues",
                    "why": "Faculty can provide extensions or alternative arrangements",
                    "specific_steps": [
                        "1. Request meeting with class advisor",
                        "2. Discuss genuine reasons for missing classes",
                        "3. Ask about make-up class options",
                        "4. Get written confirmation of plan"
                    ],
                    "success_metrics": ["Plan flexibility", "Faculty support"],
                    "duration": "1 week",
                    "effort": "Low",
                    "health_score_impact": 76,
                    "placement_prob_impact": 78,
                    "priority_score": 80
                }
            ]
        
        elif area == "Skills":
            actions = [
                {
                    "action": "Complete 2 technical certifications within 6 weeks",
                    "why": "Certifications are hard evidence of skill and boost placement chances",
                    "specific_steps": [
                        "1. Choose 2 high-demand skills (React, Docker, AWS, etc.)",
                        "2. Enroll in Coursera/Udemy courses",
                        "3. Allocate 2 hours daily for learning",
                        "4. Build 1 project per certification to validate skills"
                    ],
                    "success_metrics": ["2 certifications earned", "+2 skills portfolio"],
                    "duration": "6 weeks",
                    "effort": "Medium",
                    "health_score_impact": 75,
                    "placement_prob_impact": 82,
                    "priority_score": 90
                },
                {
                    "action": f"Contribute to 2 open-source projects in {', '.join(['Backend', 'Web Dev'][:2])}",
                    "why": "Real-world project experience is highly valued by recruiters",
                    "specific_steps": [
                        "1. Find beginner-friendly open-source projects on GitHub",
                        "2. Make 5-10 Pull Requests over 4 weeks",
                        "3. Document your contributions",
                        "4. Add projects to LinkedIn/resume"
                    ],
                    "success_metrics": ["Active GitHub profile", "Real-world experience"],
                    "duration": "4 weeks",
                    "effort": "Medium",
                    "health_score_impact": 76,
                    "placement_prob_impact": 80,
                    "priority_score": 85
                }
            ]
        
        elif area == "Backlogs":
            actions = [
                {
                    "action": "Clear backlogs in next 2-3 weeks of exams/supplementary exams",
                    "why": "Backlogs are the #1 placement blocker - clearing them opens all opportunities",
                    "specific_steps": [
                        "1. Get last year's exam papers and solutions",
                        "2. Dedicate 4 hours daily to backlog subjects",
                        "3. Take practice tests daily",
                        "4. Sleep well before exam day"
                    ],
                    "success_metrics": ["All backlogs cleared", "+15% placement probability"],
                    "duration": "3 weeks",
                    "effort": "Very High",
                    "health_score_impact": 85,
                    "placement_prob_impact": 90,
                    "priority_score": 100
                }
            ]
        
        return [
            {**action, "area": area}
            for action in actions
        ]
    
    @staticmethod
    def _get_success_factors(student: Student) -> List[str]:
        """Get factors that will help student succeed."""
        factors = []
        
        if student.cgpa and student.cgpa >= 6.0:
            factors.append("✅ You have a solid academic foundation")
        
        num_skills = len(student.skills) if student.skills else 0
        if num_skills >= 3:
            factors.append(f"✅ You have {num_skills} technical skills")
        
        if not student.backlog_count or student.backlog_count == 0:
            factors.append("✅ No active backlogs - Clear path to placement")
        
        if hasattr(student, 'internships') and student.internships and len(student.internships) > 0:
            factors.append(f"✅ You have {len(student.internships)} internship experience")
        
        if not factors:
            factors = ["Starting from scratch - You can do this with focused effort!"]
        
        return factors
    
    @staticmethod
    def generate_alerts(db: Session, student_id: int) -> Dict:
        """
        Generate smart alerts for student.
        """
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")
        
        alerts = []
        
        # Attendance alert
        attendance = 75  # Placeholder
        if attendance < 75:
            alerts.append({
                "type": AlertType.ATTENDANCE,
                "severity": AlertSeverity.CRITICAL,
                "title": f"Low Attendance ({attendance}%)",
                "message": "Your attendance is below 75%, which blocks placement eligibility",
                "action_url": "/attendance",
                "action_label": "View Attendance",
                "cta": "Attend classes regularly"
            })
        elif attendance < 85:
            alerts.append({
                "type": AlertType.ATTENDANCE,
                "severity": AlertSeverity.WARNING,
                "title": f"Attendance Below Target ({attendance}%)",
                "message": "Aim for 85%+ attendance for best opportunities",
                "action_url": "/attendance",
                "action_label": "Track Attendance"
            })
        
        # Backlog alert
        if student.backlog_count and student.backlog_count > 0:
            alerts.append({
                "type": AlertType.BACKLOG,
                "severity": AlertSeverity.CRITICAL,
                "title": f"{student.backlog_count} Active Backlog(s)",
                "message": f"Clear your backlogs to unlock placements. Next exam: {RecommendationService._get_next_exam_date()}",
                "action_url": "/marks",
                "action_label": "View Marks"
            })
        
        # Placement readiness alert
        if student.cgpa and student.cgpa < 6.0:
            alerts.append({
                "type": AlertType.PLACEMENT,
                "severity": AlertSeverity.WARNING,
                "title": f"Low CGPA ({student.cgpa})",
                "message": "Most companies require CGPA 6.0+. Work on improving your grades",
                "action_url": "/ai/action-plan",
                "action_label": "See Action Plan"
            })
        
        # Skills alert
        num_skills = len(student.skills) if student.skills else 0
        if num_skills < 3:
            alerts.append({
                "type": AlertType.SKILL,
                "severity": AlertSeverity.WARNING,
                "title": f"Build Technical Skills ({num_skills} currently)",
                "message": "Learn 5-10 technical skills to be placement-ready",
                "action_url": "/skills",
                "action_label": "Add Skills"
            })
        
        # Positive alerts
        if student.cgpa and student.cgpa >= 8.0 and num_skills >= 5 and not student.backlog_count:
            alerts.append({
                "type": AlertType.EVENT,
                "severity": AlertSeverity.INFO,
                "title": "🎉 You're Placement-Ready!",
                "message": "Excellent profile! You're eligible for most companies",
                "action_url": "/placements",
                "action_label": "View Companies",
                "highlight": True
            })
        
        return {
            "student_id": student_id,
            "total_alerts": len(alerts),
            "critical_alerts": len([a for a in alerts if a["severity"] == AlertSeverity.CRITICAL]),
            "alerts": alerts,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def _get_next_exam_date() -> str:
        """Get next exam date (placeholder)."""
        next_exam = datetime.utcnow() + timedelta(days=45)
        return next_exam.strftime("%B %d, %Y")


class SmartAlertService:
    """Service for managing student alerts and notifications."""
    
    @staticmethod
    def create_alert(
        db: Session,
        student_id: int,
        alert_type: AlertType,
        severity: AlertSeverity,
        message: str,
        action_url: str = None
    ) -> Dict:
        """Create a new alert for student."""
        # This would integrate with StudentAlert model in database
        return {
            "student_id": student_id,
            "type": alert_type,
            "severity": severity,
            "message": message,
            "action_url": action_url,
            "created_at": datetime.utcnow().isoformat(),
            "read": False
        }
    
    @staticmethod
    def dismiss_alert(db: Session, alert_id: int) -> bool:
        """Mark alert as dismissed/read."""
        # Update alert in database
        return True
