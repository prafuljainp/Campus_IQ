"""
PHASE 4 Router
Gamification, Chatbot, Alumni Mentorship, Certifications
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.dependencies import get_db, get_current_user
from app.models import User, Student
from app.services.gamification_service import (
    GamificationService, AcademicChatbotService, 
    AlumniMentorshipService, CertificationService
)

router = APIRouter(prefix="/api/phase4", tags=["Phase 4: Gamification & Advanced"])

def _get_student_or_403(db: Session, student_id: Optional[int], current_user: User) -> Student:
    """Helper to validate student access."""
    if not student_id:
        if current_user.role != "student" or not current_user.student:
            raise HTTPException(status_code=400, detail="student_id required")
        student_id = current_user.student.id
    
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if current_user.role == "student" and current_user.student.id != student_id:
        raise HTTPException(status_code=403, detail="Cannot access other student's data")
    
    return student

# ── GAMIFICATION SYSTEM ────────────────────────────────────────────────────
@router.get("/gamification/profile")
def get_gamification_profile(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get gamified student profile with points and badges."""
    student = _get_student_or_403(db, student_id, current_user)
    profile = GamificationService.get_student_profile(db, student)
    return {"status": "success", "data": profile}

@router.get("/gamification/badges")
def get_student_badges(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get earned and available badges."""
    student = _get_student_or_403(db, student_id, current_user)
    badges = GamificationService.check_earned_badges(db, student)
    return {"status": "success", "data": badges}

@router.get("/gamification/leaderboard")
def get_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get global leaderboard."""
    result = GamificationService.get_leaderboard(db, limit=limit)
    return {"status": "success", "data": result}

@router.get("/gamification/points")
def get_student_points(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get student points breakdown."""
    student = _get_student_or_403(db, student_id, current_user)
    points = GamificationService.calculate_student_points(db, student)
    return {"status": "success", "data": points}

# ── ACADEMIC CHATBOT ───────────────────────────────────────────────────────
@router.post("/chatbot/message")
def send_chatbot_message(
    message: str,
    current_user: User = Depends(get_current_user)
):
    """Send message to academic chatbot."""
    response = AcademicChatbotService.get_chat_response(message)
    return response

@router.get("/chatbot/faq")
def get_chatbot_faq(current_user: User = Depends(get_current_user)):
    """Get chatbot FAQ."""
    faq = AcademicChatbotService.get_faq()
    return {"status": "success", "data": faq}

# ── ALUMNI & MENTORSHIP ────────────────────────────────────────────────────
@router.get("/mentorship/mentors")
def get_available_mentors(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available mentors."""
    student = _get_student_or_403(db, student_id, current_user)
    mentors = AlumniMentorshipService.get_mentors(db, student)
    return {"status": "success", "data": mentors}

@router.post("/mentorship/request")
def request_mentorship(
    mentor_id: int,
    areas: List[str],
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Request mentorship from alumnus."""
    student = _get_student_or_403(db, student_id, current_user)
    result = AlumniMentorshipService.request_mentorship(db, student, mentor_id, areas)
    return result

@router.get("/mentorship/network")
def get_alumni_network(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get alumni network statistics."""
    network = AlumniMentorshipService.get_alumni_network(db)
    return {"status": "success", "data": network}

# ── CERTIFICATIONS ────────────────────────────────────────────────────────
@router.get("/certifications/recommended")
def get_recommended_certifications(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recommended certifications."""
    student = _get_student_or_403(db, student_id, current_user)
    certifications = CertificationService.get_recommended_certifications(db, student)
    return {"status": "success", "data": certifications}

@router.post("/certifications/{certification_id}/issue")
def issue_certification(
    certification_id: int,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Issue certificate to student (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    result = CertificationService.issue_certificate(student, certification_id)
    return result

@router.get("/certifications/all")
def get_all_certifications(
    current_user: User = Depends(get_current_user)
):
    """Get all available certifications."""
    return {
        "status": "success",
        "data": {
            "certifications": CertificationService.CERTIFICATIONS,
            "total": len(CertificationService.CERTIFICATIONS)
        }
    }

# ── COMBINED DASHBOARD ────────────────────────────────────────────────────
@router.get("/dashboard/phase4")
def get_phase4_dashboard(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get combined Phase 4 dashboard."""
    student = _get_student_or_403(db, student_id, current_user)
    
    return {
        "status": "success",
        "data": {
            "gamification": GamificationService.get_student_profile(db, student),
            "badges": GamificationService.check_earned_badges(db, student),
            "mentors": AlumniMentorshipService.get_mentors(db, student),
            "certifications": CertificationService.get_recommended_certifications(db, student)
        }
    }
