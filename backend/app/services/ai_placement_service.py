"""
AI Placement Probability Service
Predicts student placement success likelihood with detailed factor analysis.
"""
from sqlalchemy.orm import Session
from app.models import Student
from typing import Dict, List
from datetime import datetime


class PlacementProbabilityService:
    """Service for calculating placement probability and improvement opportunities."""
    
    @staticmethod
    def calculate_placement_probability(db: Session, student_id: int) -> Dict:
        """
        Calculate placement probability (0-100%) with factor breakdown.
        
        Base factors:
        - CGPA (40%): Critical threshold is 6.0
        - Skills (25%): Dev skills highly valued
        - Attendance (20%): Must be >= 75%
        - Academic Standing (15%): Backlogs are major barrier
        
        Modifiers applied:
        - Attendance < 75%: -10%
        - Active backlog: -15% per backlog
        - 3+ skills: +5% per skill (max +20%)
        - Internship experience: +10%
        - Projects/portfolio: +10%
        """
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")
        
        # Calculate base probability components
        cgpa_component = PlacementProbabilityService._calculate_cgpa_component(student)
        skills_component = PlacementProbabilityService._calculate_skills_component(student)
        attendance_component = PlacementProbabilityService._calculate_attendance_component(student)
        standing_component = PlacementProbabilityService._calculate_standing_component(student)
        
        base_probability = (
            cgpa_component * 0.40 +
            skills_component * 0.25 +
            attendance_component * 0.20 +
            standing_component * 0.15
        )
        
        # Apply modifiers
        modifiers = PlacementProbabilityService._calculate_modifiers(student)
        modifier_impact = sum(m["value"] for m in modifiers)
        
        final_probability = max(0, min(100, base_probability + modifier_impact))
        
        # Determine confidence level
        confidence = PlacementProbabilityService._get_confidence_level(student, final_probability)
        
        # Risk factors
        risk_factors = PlacementProbabilityService._identify_risk_factors(student)
        
        # Improvement opportunities
        improvement_opportunities = PlacementProbabilityService._calculate_improvement_opportunities(
            student, final_probability
        )
        
        return {
            "student_id": student_id,
            "placement_probability": round(final_probability, 1),
            "probability_percentage": f"{round(final_probability)}%",
            "confidence": confidence,
            "base_probability": round(base_probability, 1),
            "factors": {
                "cgpa": {
                    "value": round(cgpa_component, 1),
                    "weight": 0.40,
                    "contribution": round(cgpa_component * 0.40, 1),
                    "current": student.cgpa,
                    "threshold": 6.0
                },
                "skills": {
                    "value": round(skills_component, 1),
                    "weight": 0.25,
                    "contribution": round(skills_component * 0.25, 1),
                    "count": len(student.skills) if student.skills else 0
                },
                "attendance": {
                    "value": round(attendance_component, 1),
                    "weight": 0.20,
                    "contribution": round(attendance_component * 0.20, 1),
                    "current": 75  # Placeholder
                },
                "academic_standing": {
                    "value": round(standing_component, 1),
                    "weight": 0.15,
                    "contribution": round(standing_component * 0.15, 1),
                    "backlogs": student.backlog_count or 0
                }
            },
            "modifiers": modifiers,
            "modifier_impact": round(modifier_impact, 1),
            "risk_factors": risk_factors,
            "improvement_opportunities": improvement_opportunities,
            "interpretation": PlacementProbabilityService._get_interpretation(final_probability),
            "calculated_at": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def _calculate_cgpa_component(student: Student) -> float:
        """
        CGPA component (0-100 scale).
        - 8.5+: 100
        - 7.0-8.4: 80-99
        - 6.0-6.9: 60-79
        - Below 6.0: <60
        """
        if student.cgpa is None:
            return 20
        
        cgpa = student.cgpa
        if cgpa >= 9.0:
            return 100
        elif cgpa >= 8.5:
            return 90 + (cgpa - 8.5) * 20
        elif cgpa >= 7.0:
            return 70 + (cgpa - 7.0) * 2.86
        elif cgpa >= 6.0:
            return 50 + (cgpa - 6.0) * 20
        else:
            return max(0, (cgpa / 6.0) * 50)
    
    @staticmethod
    def _calculate_skills_component(student: Student) -> float:
        """
        Skills component (0-100 scale).
        - 10+ skills: 100
        - 7-9 skills: 75-99
        - 4-6 skills: 50-74
        - 1-3 skills: 25-49
        - 0 skills: 10 (penalty, but not zero)
        """
        num_skills = len(student.skills) if student.skills else 0
        
        if num_skills == 0:
            return 10
        elif num_skills <= 3:
            return 25 + (num_skills - 1) * 12  # 25-49
        elif num_skills <= 6:
            return 50 + (num_skills - 4) * 8  # 50-74
        elif num_skills <= 9:
            return 75 + (num_skills - 7) * 8  # 75-99
        else:
            return 100
    
    @staticmethod
    def _calculate_attendance_component(student: Student) -> float:
        """
        Attendance component (0-100 scale).
        Attendance must be >= 75% for placements.
        """
        attendance = 75  # Placeholder - integrate with actual data
        
        if attendance >= 90:
            return 100
        elif attendance >= 75:
            return 50 + (attendance - 75) * 2
        elif attendance >= 60:
            return 20 + (attendance - 60) * 2
        else:
            return max(0, attendance / 3)
    
    @staticmethod
    def _calculate_standing_component(student: Student) -> float:
        """
        Academic standing component (0-100 scale).
        Backlogs are major barriers to placement.
        """
        backlogs = student.backlog_count if student.backlog_count else 0
        
        if backlogs == 0:
            return 100
        elif backlogs == 1:
            return 50
        elif backlogs == 2:
            return 20
        else:
            return max(0, 10 - (backlogs - 2) * 5)
    
    @staticmethod
    def _calculate_modifiers(student: Student) -> List[Dict]:
        """Calculate and return modifier factors."""
        modifiers = []
        
        # Attendance modifier
        attendance = 75  # Placeholder
        if attendance < 75:
            modifiers.append({
                "factor": "Low Attendance",
                "value": -10,
                "reason": f"Attendance {attendance}% is below 75% threshold",
                "action": "Focus on regular class attendance"
            })
        
        # Backlog modifiers
        backlogs = student.backlog_count if student.backlog_count else 0
        if backlogs > 0:
            modifier_value = -15 * backlogs
            modifiers.append({
                "factor": f"Backlogs ({backlogs})",
                "value": modifier_value,
                "reason": f"{backlogs} active backlog(s) block placement eligibility",
                "action": f"Clear all backlogs immediately"
            })
        
        # Skills bonus
        num_skills = len(student.skills) if student.skills else 0
        if num_skills >= 3:
            skills_bonus = min(20, (num_skills - 3) * 2.5)  # +5% per skill, max 20%
            modifiers.append({
                "factor": "Strong Skill Set",
                "value": skills_bonus,
                "reason": f"You have {num_skills} valuable technical skills",
                "action": "Continue learning emerging technologies"
            })
        
        # Experience bonuses
        if hasattr(student, 'internships') and student.internships and len(student.internships) > 0:
            modifiers.append({
                "factor": "Internship Experience",
                "value": 10,
                "reason": f"You have {len(student.internships)} internship(s)",
                "action": "Highlight achievements from internships in resume"
            })
        
        if hasattr(student, 'projects') and student.projects and len(student.projects) > 0:
            modifiers.append({
                "factor": "Projects/Portfolio",
                "value": 10,
                "reason": f"You have {len(student.projects)} projects in portfolio",
                "action": "Create a GitHub portfolio with live project links"
            })
        
        return modifiers
    
    @staticmethod
    def _identify_risk_factors(student: Student) -> List[str]:
        """Identify placement-related risk factors."""
        risk_factors = []
        
        if student.cgpa is None or student.cgpa < 6.0:
            risk_factors.append("Low CGPA - Most companies prefer 6.0+")
        
        if student.backlog_count and student.backlog_count > 0:
            risk_factors.append(f"Active backlogs ({student.backlog_count}) - Major placement barrier")
        
        num_skills = len(student.skills) if student.skills else 0
        if num_skills < 3:
            risk_factors.append(f"Limited skills ({num_skills}) - Aim for 5+ technical skills")
        
        attendance = 75  # Placeholder
        if attendance < 75:
            risk_factors.append(f"Low attendance ({attendance}%) - Must be 75%+")
        
        if not risk_factors:
            risk_factors.append("No major risk factors - You're placement-ready!")
        
        return risk_factors
    
    @staticmethod
    def _calculate_improvement_opportunities(student: Student, current_prob: float) -> List[Dict]:
        """
        Calculate specific actions that would improve placement probability.
        """
        opportunities = []
        
        # CGPA improvement
        if student.cgpa and student.cgpa < 8.5:
            cgpa_increase = 0.5
            new_prob = current_prob + ((cgpa_increase / 10) * 100 * 0.40)  # CGPA is 40% factor
            opportunities.append({
                "action": f"Improve CGPA from {student.cgpa} to {student.cgpa + cgpa_increase}",
                "current_value": student.cgpa,
                "target_value": student.cgpa + cgpa_increase,
                "estimated_increase": round(new_prob - current_prob, 1),
                "new_probability": round(min(100, new_prob), 1),
                "timeline": "1 semester",
                "priority": "High",
                "effort": "High"
            })
        
        # Backlog clearance
        if student.backlog_count and student.backlog_count > 0:
            new_prob = current_prob + (15 * student.backlog_count)
            opportunities.append({
                "action": f"Clear all {student.backlog_count} backlogs",
                "current_value": student.backlog_count,
                "target_value": 0,
                "estimated_increase": round(min(100, new_prob) - current_prob, 1),
                "new_probability": round(min(100, new_prob), 1),
                "timeline": "2-4 weeks",
                "priority": "Critical",
                "effort": "High"
            })
        
        # Skills development
        current_skills = len(student.skills) if student.skills else 0
        if current_skills < 10:
            skills_to_add = max(1, 10 - current_skills)
            new_prob = current_prob + (skills_to_add * 2)
            opportunities.append({
                "action": f"Learn {skills_to_add} new technical skills",
                "current_value": current_skills,
                "target_value": 10,
                "estimated_increase": round(new_prob - current_prob, 1),
                "new_probability": round(min(100, new_prob), 1),
                "timeline": "6 weeks",
                "priority": "High",
                "effort": "Medium",
                "skills_suggested": ["React", "Docker", "AWS", "Database Design", "System Design"]
            })
        
        # Attendance improvement
        attendance = 75
        if attendance < 85:
            new_prob = current_prob + 5
            opportunities.append({
                "action": "Improve attendance to 85%+",
                "current_value": attendance,
                "target_value": 85,
                "estimated_increase": 5,
                "new_probability": round(min(100, new_prob), 1),
                "timeline": "1 semester",
                "priority": "Medium",
                "effort": "Low"
            })
        
        return opportunities
    
    @staticmethod
    def _get_confidence_level(student: Student, probability: float) -> str:
        """Determine confidence level based on data completeness and probability."""
        num_skills = len(student.skills) if student.skills else 0
        backlogs = student.backlog_count if student.backlog_count else 0
        
        # More data = higher confidence
        if probability >= 80 and num_skills >= 5 and backlogs == 0:
            return "Very High"
        elif probability >= 60 and num_skills >= 3:
            return "High"
        elif probability >= 40 or num_skills >= 1:
            return "Medium"
        else:
            return "Low"
    
    @staticmethod
    def _get_interpretation(probability: float) -> str:
        """Get interpretation of probability score."""
        if probability >= 90:
            return "Excellent placement prospects - You're highly competitive!"
        elif probability >= 80:
            return "Good placement prospects - Focus on skill development"
        elif probability >= 70:
            return "Decent prospects - Clear any backlogs & improve skills"
        elif probability >= 50:
            return "Moderate prospects - Need significant improvements"
        elif probability >= 30:
            return "Challenging prospects - Create an action plan now"
        else:
            return "Critical - Severe action needed for placement eligibility"


class PlacementWhatIfService:
    """Service for what-if placement probability simulations."""
    
    @staticmethod
    def simulate_improvement(db: Session, student_id: int, scenario: Dict) -> Dict:
        """
        Simulate placement probability with hypothetical improvements.
        
        Scenario format:
        {
            "cgpa": 7.5,      # Projected CGPA
            "skills_count": 8,  # Additional skills
            "clear_backlogs": true
        }
        """
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")
        
        # Current probability
        current_result = PlacementProbabilityService.calculate_placement_probability(db, student_id)
        current_prob = current_result["placement_probability"]
        
        # Create simulated student object
        original_cgpa = student.cgpa
        original_skills = len(student.skills) if student.skills else 0
        original_backlogs = student.backlog_count or 0
        
        # Apply scenario changes
        if "cgpa" in scenario:
            student.cgpa = scenario["cgpa"]
        
        if "skills_count" in scenario:
            # Add dummy skills for calculation
            student.skills = student.skills or []
            while len(student.skills) < scenario["skills_count"]:
                student.skills.append(None)
        
        if scenario.get("clear_backlogs"):
            student.backlog_count = 0
        
        # Simulate new probability
        simulated_result = PlacementProbabilityService.calculate_placement_probability(db, student_id)
        simulated_prob = simulated_result["placement_probability"]
        
        # Restore original values
        student.cgpa = original_cgpa
        student.skills = student.skills[:original_skills] if student.skills else []
        student.backlog_count = original_backlogs
        
        # Return comparison
        return {
            "student_id": student_id,
            "current_scenario": {
                "cgpa": original_cgpa,
                "skills": original_skills,
                "backlogs": original_backlogs,
                "probability": round(current_prob, 1)
            },
            "simulated_scenario": {
                "cgpa": scenario.get("cgpa", original_cgpa),
                "skills": scenario.get("skills_count", original_skills),
                "backlogs": 0 if scenario.get("clear_backlogs") else original_backlogs,
                "probability": round(simulated_prob, 1)
            },
            "improvement": {
                "absolute_increase": round(simulated_prob - current_prob, 1),
                "percentage_increase": round(((simulated_prob - current_prob) / current_prob * 100) if current_prob > 0 else 0, 1),
                "interpretation": f"Probability improves from {round(current_prob)}% to {round(simulated_prob)}%"
            }
        }
