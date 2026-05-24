"""
PHASE 3 Router
Job Portal, Notifications, and LMS Integration
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.dependencies import get_db, get_current_user
from app.models import User, Student
from app.services.job_portal_service import JobPortalService
from app.services.notification_service import NotificationService
from app.services.lms_integration_service import LMSIntegrationService

router = APIRouter(prefix="/api/phase3", tags=["Phase 3: Integration"])

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

# ── JOB PORTAL INTEGRATION ─────────────────────────────────────────────────
@router.get("/jobs/search")
def search_jobs(
    student_id: Optional[int] = None,
    experience_level: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search jobs matched to student profile."""
    student = _get_student_or_403(db, student_id, current_user)
    
    filters = {}
    if experience_level:
        filters["experience_level"] = experience_level
    if location:
        filters["location"] = location
    
    result = JobPortalService.search_jobs(db, student, filters)
    return {"status": "success", "data": result}

@router.get("/jobs/recommendations")
def get_job_recommendations(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get AI-recommended jobs for student."""
    student = _get_student_or_403(db, student_id, current_user)
    result = JobPortalService.get_job_recommendations(db, student)
    return {"status": "success", "data": result}

@router.post("/jobs/{job_id}/apply")
def apply_to_job(
    job_id: int,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Apply to a job."""
    student = _get_student_or_403(db, student_id, current_user)
    result = JobPortalService.apply_to_job(db, student, job_id)
    return result

@router.get("/jobs/statistics")
def get_job_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get job portal statistics."""
    result = JobPortalService.get_job_statistics(db)
    return {"status": "success", "data": result}

# ── NOTIFICATION SYSTEM ────────────────────────────────────────────────────
@router.post("/notifications/send-email")
def send_email_notification(
    recipient_email: str,
    subject: str,
    body: str,
    current_user: User = Depends(get_current_user)
):
    """Send email notification."""
    if current_user.role not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Admin/Faculty access required")
    
    result = NotificationService.send_email(recipient_email, subject, body)
    return result

@router.post("/notifications/send-sms")
def send_sms_notification(
    phone_number: str,
    message: str,
    current_user: User = Depends(get_current_user)
):
    """Send SMS notification."""
    if current_user.role not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Admin/Faculty access required")
    
    result = NotificationService.send_sms(phone_number, message)
    return result

@router.post("/notifications/send-push")
def send_push_notification(
    user_id: int,
    title: str,
    body: str,
    current_user: User = Depends(get_current_user)
):
    """Send push notification."""
    if current_user.role not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Admin/Faculty access required")
    
    result = NotificationService.send_push_notification(user_id, title, body)
    return result

@router.get("/notifications/academic-alerts")
def get_academic_alerts(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get academic alerts for student."""
    student = _get_student_or_403(db, student_id, current_user)
    result = NotificationService.send_academic_alerts(db, student)
    return {"status": "success", "data": result}

@router.get("/notifications/placement-updates")
def get_placement_notifications(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get placement notifications for student."""
    student = _get_student_or_403(db, student_id, current_user)
    result = NotificationService.send_placement_notifications(db, student)
    return {"status": "success", "data": result}

@router.get("/notifications/preferences")
def get_notification_preferences(
    user_id: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """Get notification preferences."""
    user_id = user_id or current_user.id
    result = NotificationService.get_notification_preferences(user_id)
    return {"status": "success", "data": result}

@router.put("/notifications/preferences")
def update_notification_preferences(
    preferences: dict,
    user_id: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """Update notification preferences."""
    user_id = user_id or current_user.id
    result = NotificationService.update_notification_preferences(user_id, preferences)
    return result

# ── LMS INTEGRATION ────────────────────────────────────────────────────────
@router.get("/lms/{platform}/sync-courses")
def sync_lms_courses(
    platform: str,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Sync courses from LMS platform."""
    student = _get_student_or_403(db, student_id, current_user)
    result = LMSIntegrationService.sync_course_data(db, platform, student)
    return {"status": "success", "data": result}

@router.get("/lms/{platform}/grades")
def get_lms_grades(
    platform: str,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get course grades from LMS."""
    student = _get_student_or_403(db, student_id, current_user)
    result = LMSIntegrationService.get_course_grades(db, student, platform)
    return {"status": "success", "data": result}

@router.get("/lms/{platform}/materials")
def get_course_materials(
    platform: str,
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get course materials from LMS."""
    result = LMSIntegrationService.get_course_materials(db, platform, course_id)
    return {"status": "success", "data": result}

@router.get("/lms/{platform}/assignments")
def get_lms_assignments(
    platform: str,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get pending assignments from LMS."""
    student = _get_student_or_403(db, student_id, current_user)
    result = LMSIntegrationService.get_assignments(db, platform, student)
    return {"status": "success", "data": result}

@router.get("/lms/{platform}/attendance")
def get_lms_attendance(
    platform: str,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get attendance records from LMS."""
    student = _get_student_or_403(db, student_id, current_user)
    result = LMSIntegrationService.get_attendance_records(db, platform, student)
    return {"status": "success", "data": result}

@router.get("/lms/{platform}/forum-activity")
def get_lms_forum_activity(
    platform: str,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get forum/discussion activity from LMS."""
    student = _get_student_or_403(db, student_id, current_user)
    result = LMSIntegrationService.get_forum_activity(db, platform, student)
    return {"status": "success", "data": result}

@router.post("/lms/{platform}/full-sync")
def full_lms_sync(
    platform: str,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Full sync of all LMS data to CampusIQ."""
    student = _get_student_or_403(db, student_id, current_user)
    result = LMSIntegrationService.sync_lms_to_campusiq(db, platform, student)
    return result

@router.get("/lms/{platform}/dashboard")
def get_lms_dashboard(
    platform: str,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive LMS dashboard."""
    student = _get_student_or_403(db, student_id, current_user)
    result = LMSIntegrationService.get_lms_dashboard(db, platform, student)
    return {"status": "success", "data": result}

@router.get("/lms/supported-platforms")
def get_supported_lms_platforms(current_user: User = Depends(get_current_user)):
    """Get list of supported LMS platforms."""
    return {
        "status": "success",
        "platforms": list(LMSIntegrationService.SUPPORTED_PLATFORMS.keys()),
        "message": "Supported LMS platforms"
    }
