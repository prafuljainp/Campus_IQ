"""
Gamification System
Badges, points, leaderboards, and rewards
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models import Student
from enum import Enum

class BadgeType(str, Enum):
    """Achievement badge types"""
    ACADEMIC = "academic"
    PLACEMENT = "placement"
    ATTENDANCE = "attendance"
    SKILLS = "skills"
    LEADERSHIP = "leadership"
    MILESTONE = "milestone"

class GamificationService:
    """Gamification and rewards system"""
    
    # Badge definitions
    BADGES = {
        "perfect_attendance": {
            "id": 1,
            "name": "Perfect Attendance",
            "description": "100% attendance for entire semester",
            "icon": "📚",
            "category": BadgeType.ATTENDANCE,
            "points": 50,
            "rarity": "gold"
        },
        "high_achiever": {
            "id": 2,
            "name": "High Achiever",
            "description": "Maintain CGPA above 9.0",
            "icon": "🏆",
            "category": BadgeType.ACADEMIC,
            "points": 100,
            "rarity": "platinum"
        },
        "skill_master": {
            "id": 3,
            "name": "Skill Master",
            "description": "Learn 10+ skills",
            "icon": "🛠️",
            "category": BadgeType.SKILLS,
            "points": 75,
            "rarity": "gold"
        },
        "placement_ready": {
            "id": 4,
            "name": "Placement Ready",
            "description": "Achieve 75%+ placement probability",
            "icon": "💼",
            "category": BadgeType.PLACEMENT,
            "points": 80,
            "rarity": "silver"
        },
        "zero_backlogs": {
            "id": 5,
            "name": "Zero Backlogs",
            "description": "Complete semester with no backlogs",
            "icon": "✨",
            "category": BadgeType.ACADEMIC,
            "points": 60,
            "rarity": "silver"
        },
        "early_bird": {
            "id": 6,
            "name": "Early Bird",
            "description": "Submit assignment 1 week early",
            "icon": "🐦",
            "category": BadgeType.ACADEMIC,
            "points": 20,
            "rarity": "bronze"
        },
        "problem_solver": {
            "id": 7,
            "name": "Problem Solver",
            "description": "Solve 100+ problems",
            "icon": "🧩",
            "category": BadgeType.SKILLS,
            "points": 40,
            "rarity": "silver"
        },
        "networking_pro": {
            "id": 8,
            "name": "Networking Pro",
            "description": "Connect with 50+ alumni",
            "icon": "🌐",
            "category": BadgeType.LEADERSHIP,
            "points": 50,
            "rarity": "silver"
        }
    }
    
    @staticmethod
    def calculate_student_points(db: Session, student: Student) -> Dict[str, Any]:
        """Calculate total points for a student."""
        try:
            points = 0
            breakdown = {}
            
            # CGPA points
            cgpa = student.cgpa or 0
            cgpa_points = int(cgpa * 20)  # Max 200 points
            points += cgpa_points
            breakdown["cgpa"] = cgpa_points
            
            # Attendance points (mock)
            attendance_points = 50
            points += attendance_points
            breakdown["attendance"] = attendance_points
            
            # Completion points (mock)
            completion_points = 30
            points += completion_points
            breakdown["completion"] = completion_points
            
            # Milestone bonus
            milestone_points = 0
            if cgpa >= 9.0:
                milestone_points += 100
            if cgpa >= 8.5:
                milestone_points += 50
            
            points += milestone_points
            breakdown["milestones"] = milestone_points
            
            return {
                "total_points": points,
                "breakdown": breakdown,
                "level": GamificationService._calculate_level(points),
                "next_level_points": GamificationService._get_next_level_threshold(
                    GamificationService._calculate_level(points)
                )
            }
        except Exception as e:
            return {
                "total_points": 0,
                "breakdown": {},
                "error": str(e)
            }
    
    @staticmethod
    def check_earned_badges(db: Session, student: Student) -> Dict[str, Any]:
        """Check which badges student has earned."""
        try:
            earned = []
            available = []
            
            # Check each badge criteria
            cgpa = student.cgpa or 0
            
            # CGPA badges
            if cgpa >= 9.0:
                earned.append("high_achiever")
            else:
                available.append({
                    "id": "high_achiever",
                    "name": "High Achiever",
                    "progress": f"{cgpa}/9.0",
                    "percentage": int((cgpa / 9.0) * 100)
                })
            
            if cgpa >= 8.0:
                earned.append("placement_ready")
            
            # Zero backlogs badge (mock)
            earned.append("zero_backlogs")
            
            # Skills badge (mock)
            earned.append("skill_master")
            
            earned_badges = [
                {
                    **GamificationService.BADGES[badge_id],
                    "earned_date": datetime.now().isoformat()
                }
                for badge_id in earned
                if badge_id in GamificationService.BADGES
            ]
            
            total_points = sum(b.get("points", 0) for b in earned_badges)
            
            return {
                "earned_badges": earned_badges,
                "total_earned": len(earned_badges),
                "total_points_from_badges": total_points,
                "available_badges": available
            }
        except Exception as e:
            return {
                "earned_badges": [],
                "error": str(e)
            }
    
    @staticmethod
    def get_leaderboard(db: Session, department: Optional[str] = None, limit: int = 20) -> Dict[str, Any]:
        """Get student leaderboard."""
        try:
            # Mock leaderboard data
            students = db.query(Student).all()
            
            leaderboard = []
            for i, student in enumerate(students[:limit], 1):
                points = GamificationService.calculate_student_points(db, student).get("total_points", 0)
                leaderboard.append({
                    "rank": i,
                    "student_name": student.name,
                    "student_id": student.id,
                    "cgpa": student.cgpa,
                    "points": points,
                    "level": GamificationService._calculate_level(points),
                    "badges": len(GamificationService.check_earned_badges(db, student).get("earned_badges", []))
                })
            
            # Sort by points
            leaderboard.sort(key=lambda x: x["points"], reverse=True)
            
            return {
                "leaderboard": leaderboard,
                "total": len(leaderboard),
                "generated_at": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "leaderboard": [],
                "error": str(e)
            }
    
    @staticmethod
    def get_student_profile(db: Session, student: Student) -> Dict[str, Any]:
        """Get gamified student profile."""
        try:
            points = GamificationService.calculate_student_points(db, student)
            badges = GamificationService.check_earned_badges(db, student)
            
            return {
                "student_id": student.id,
                "name": student.name,
                "level": points["level"],
                "total_points": points["total_points"],
                "next_level_at": points.get("next_level_points"),
                "badges_earned": badges["total_earned"],
                "recent_badges": badges["earned_badges"][:5],
                "achievements": {
                    "total_badges": badges["total_earned"],
                    "points": points["total_points"],
                    "level": points["level"]
                }
            }
        except Exception as e:
            return {"error": str(e)}
    
    @staticmethod
    def _calculate_level(points: int) -> int:
        """Calculate player level from points."""
        if points < 100:
            return 1
        elif points < 300:
            return 2
        elif points < 600:
            return 3
        elif points < 1000:
            return 4
        elif points < 1500:
            return 5
        else:
            return 6
    
    @staticmethod
    def _get_next_level_threshold(current_level: int) -> int:
        """Get points needed for next level."""
        thresholds = {
            1: 100, 2: 300, 3: 600, 4: 1000, 5: 1500, 6: 2000
        }
        return thresholds.get(current_level + 1, 9999)


class AcademicChatbotService:
    """AI Chatbot for academic guidance"""
    
    COMMON_QUESTIONS = {
        "how_to_improve_cgpa": {
            "question": "How can I improve my CGPA?",
            "answer": "Here are proven strategies:\n1. Attend all classes - Perfect attendance = 90% grade\n2. Study in groups - Discuss concepts with peers\n3. Use active recall - Test yourself frequently\n4. Seek help early - Don't wait for exams\n5. Manage time - Create a study schedule"
        },
        "backlog_clearing": {
            "question": "How do I clear my backlogs?",
            "answer": "Backlog clearing tips:\n1. Register immediately - Don't delay\n2. Create study plan - Focus on weak areas\n3. Practice problems - Solve past papers\n4. Attend extra classes - Available from faculty\n5. Form study group - Learn together"
        },
        "placement_prep": {
            "question": "How to prepare for placements?",
            "answer": "Placement preparation checklist:\n1. Build technical skills - Core CS concepts\n2. Practice coding - LeetCode 200+ problems\n3. Resume building - Highlight projects\n4. Interview prep - Mock interviews\n5. Networking - Connect on LinkedIn"
        },
        "skill_development": {
            "question": "Which skills should I learn?",
            "answer": "Essential tech skills for 2026:\n1. Cloud: AWS, Azure, GCP\n2. AI/ML: Python, TensorFlow\n3. DevOps: Docker, Kubernetes\n4. Full-stack: React, Node.js, Databases\n5. Problem-solving: DSA, System Design"
        },
        "internship_tips": {
            "question": "Tips for getting internship?",
            "answer": "Internship success tips:\n1. Apply early - Opportunities in Jan-Feb\n2. Strong resume - Highlight projects\n3. Technical interview - Prepare well\n4. Portfolio - Show GitHub projects\n5. Networking - Connect with seniors"
        }
    }
    
    @staticmethod
    def get_chat_response(query: str) -> Dict[str, Any]:
        """Get chatbot response to user query."""
        try:
            query_lower = query.lower()
            
            # Exact match
            for key, response in AcademicChatbotService.COMMON_QUESTIONS.items():
                if key.replace("_", " ") in query_lower or any(word in query_lower for word in key.split("_")):
                    return {
                        "status": "success",
                        "response": response["answer"],
                        "type": "guidance",
                        "timestamp": datetime.now().isoformat()
                    }
            
            # Default response
            return {
                "status": "success",
                "response": "I can help with: CGPA improvement, backlog clearing, placement preparation, skill development, and internships. Try asking one of these topics!",
                "type": "suggestion",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
    
    @staticmethod
    def get_faq() -> Dict[str, Any]:
        """Get FAQ list."""
        return {
            "faqs": list(AcademicChatbotService.COMMON_QUESTIONS.values()),
            "total": len(AcademicChatbotService.COMMON_QUESTIONS)
        }


class AlumniMentorshipService:
    """Alumni and mentorship network"""
    
    @staticmethod
    def get_mentors(db: Session, student: Student) -> Dict[str, Any]:
        """Get available mentors for student."""
        try:
            # Mock mentor data
            mentors = [
                {
                    "id": 1,
                    "name": "Rajesh Kumar",
                    "current_role": "Senior Engineer at Google",
                    "batch": "2022",
                    "specialization": "Cloud & DevOps",
                    "availability": "Weekends",
                    "mentoring_areas": ["Career", "Technical", "Interview"],
                    "rating": 4.8,
                    "students_mentored": 25
                },
                {
                    "id": 2,
                    "name": "Priya Sharma",
                    "current_role": "Data Scientist at Amazon",
                    "batch": "2021",
                    "specialization": "AI/ML",
                    "availability": "Evenings",
                    "mentoring_areas": ["ML Projects", "Career", "Research"],
                    "rating": 4.9,
                    "students_mentored": 18
                },
                {
                    "id": 3,
                    "name": "Arjun Singh",
                    "current_role": "Founder, TechStartup",
                    "batch": "2019",
                    "specialization": "Entrepreneurship",
                    "availability": "Flexible",
                    "mentoring_areas": ["Startup", "Leadership", "Product"],
                    "rating": 4.7,
                    "students_mentored": 12
                }
            ]
            
            return {
                "available_mentors": len(mentors),
                "mentors": mentors
            }
        except Exception as e:
            return {
                "error": str(e),
                "mentors": []
            }
    
    @staticmethod
    def request_mentorship(db: Session, student: Student, mentor_id: int, areas: List[str]) -> Dict[str, Any]:
        """Request mentorship from alumnus."""
        try:
            return {
                "status": "success",
                "request_id": f"MENTOR_{datetime.now().timestamp()}",
                "message": f"Mentorship request sent successfully!",
                "mentor_id": mentor_id,
                "areas": areas,
                "status_message": "Waiting for mentor approval",
                "created_at": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
    
    @staticmethod
    def get_alumni_network(db: Session) -> Dict[str, Any]:
        """Get alumni network statistics."""
        try:
            return {
                "total_alumni": 5000,
                "active_mentors": 250,
                "alumni_by_company": {
                    "Google": 120,
                    "Amazon": 95,
                    "Microsoft": 85,
                    "Meta": 75,
                    "Others": 2625
                },
                "alumni_by_role": {
                    "Senior Engineer": 800,
                    "Manager": 600,
                    "Founder": 150,
                    "Director": 100,
                    "Others": 3350
                },
                "network_events": 12,
                "alumni_helping": 250
            }
        except Exception as e:
            return {"error": str(e)}


class CertificationService:
    """Certification and skill validation"""
    
    CERTIFICATIONS = [
        {
            "id": 1,
            "title": "AWS Solutions Architect",
            "issuer": "Amazon",
            "level": "associate",
            "skills": ["AWS", "Cloud", "Architecture"],
            "duration": "12 weeks",
            "cost": "$150",
            "difficulty": "intermediate"
        },
        {
            "id": 2,
            "title": "Google Cloud Engineer",
            "issuer": "Google",
            "level": "professional",
            "skills": ["GCP", "Cloud", "DevOps"],
            "duration": "10 weeks",
            "cost": "$200",
            "difficulty": "advanced"
        },
        {
            "id": 3,
            "title": "Kubernetes Administrator",
            "issuer": "Linux Foundation",
            "level": "professional",
            "skills": ["Kubernetes", "Docker", "DevOps"],
            "duration": "8 weeks",
            "cost": "$300",
            "difficulty": "advanced"
        }
    ]
    
    @staticmethod
    def get_recommended_certifications(db: Session, student: Student) -> Dict[str, Any]:
        """Get recommended certifications based on student profile."""
        try:
            cgpa = student.cgpa or 0
            recommendations = []
            
            for cert in CertificationService.CERTIFICATIONS:
                score = 0
                if cgpa >= 7.5:
                    score += 30
                if cert["level"] == "associate":
                    score += 40
                elif cert["level"] == "professional" and cgpa >= 8.0:
                    score += 30
                
                if score > 0:
                    recommendations.append({
                        **cert,
                        "match_score": score
                    })
            
            recommendations.sort(key=lambda x: x["match_score"], reverse=True)
            
            return {
                "recommendations": recommendations[:5],
                "total": len(recommendations)
            }
        except Exception as e:
            return {
                "error": str(e),
                "recommendations": []
            }
    
    @staticmethod
    def issue_certificate(student: Student, certification_id: int) -> Dict[str, Any]:
        """Issue certificate to student."""
        try:
            return {
                "status": "success",
                "certificate_id": f"CERT_{datetime.now().timestamp()}",
                "student_name": student.name,
                "issued_date": datetime.now().isoformat(),
                "validity": "Lifetime",
                "verification_url": f"https://campusiq.local/verify/{student.id}"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
