from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import os
import tempfile

from app.database import get_db
from app.models import Student, User
from app.core.dependencies import get_current_user
from app.services import AIAnalysisService

router = APIRouter(prefix="/api/ai", tags=["AI Analysis"])

def _get_student_or_403(db: Session, student_id: int, current_user: User):
    """Check if user can access this student's data."""
    # Super admin and HOD can see any student in their dept
    # Faculty can see students in their dept
    # Students can only see themselves

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user.role == "super_admin":
        return student
    elif current_user.role == "student":
        if current_user.student and current_user.student.id == student_id:
            return student
        raise HTTPException(status_code=403, detail="Cannot access other student's data")
    elif current_user.role in ("hod", "faculty"):
        if student.department_id == current_user.faculty.department_id if current_user.faculty else False:
            return student
        raise HTTPException(status_code=403, detail="Cannot access student from different department")
    raise HTTPException(status_code=403, detail="Unauthorized access")

@router.get("/analytics-warehouse-schema")
def get_analytics_warehouse_schema():
    """Get recommended analytics data warehouse schema."""
    from app.services.ai_analytics_service import AdminAnalyticsService
    return {"status": "success", "data": AdminAnalyticsService.get_analytics_data_warehouse_schema()}

@router.get("/analytics-warehouse-simulate")
def simulate_analytics_warehouse_population(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Simulate population of analytics warehouse tables with aggregated data."""
    from app.services.ai_analytics_service import AdminAnalyticsService
    return {"status": "success", "data": AdminAnalyticsService.simulate_analytics_warehouse_population(db)}

@router.get("/placement-prediction")
def get_placement_prediction(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Predict placement probability and suggest improvements."""
    if not student_id:
        if current_user.role != "student" or not current_user.student:
            raise HTTPException(status_code=400, detail="student_id required")
        student_id = current_user.student.id

    student = _get_student_or_403(db, student_id, current_user)

    from app.services.ai_placement_service import PlacementProbabilityService
    result = PlacementProbabilityService.calculate_placement_probability(db, student_id)
    return {
        "status": "success",
        "data": result
    }

@router.get("/graduation-probability")
def get_graduation_probability(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Predict graduation probability for a student (0-100%)."""
    if not student_id:
        if current_user.role != "student" or not current_user.student:
            raise HTTPException(status_code=400, detail="student_id required")
        student_id = current_user.student.id

    student = _get_student_or_403(db, student_id, current_user)

    # Calculate attendance percentage
    total = len(student.attendance_records)
    attended = len([a for a in student.attendance_records if a.is_present])
    attendance_percentage = (attended / total * 100) if total > 0 else 0

    from app.services.ai_analytics_service import AdminAnalyticsService
    result = AdminAnalyticsService.predict_graduation_probability(student, attendance_percentage)
    return {
        "status": "success",
        "data": result
    }


@router.get("/analysis")
def get_student_analysis(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get complete AI analysis for a student."""
    # If student_id not provided, use current user's student ID
    if not student_id:
        if current_user.role != "student" or not current_user.student:
            raise HTTPException(status_code=400, detail="student_id required for non-students")
        student_id = current_user.student.id

    student = _get_student_or_403(db, student_id, current_user)
    
    analysis = AIAnalysisService.get_complete_analysis(db, student)
    return {
        "status": "success",
        "data": analysis
    }


@router.get("/backlog-analysis")
def get_backlog_analysis(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze backlogs and provide recovery strategy."""
    if not student_id:
        if current_user.role != "student" or not current_user.student:
            raise HTTPException(status_code=400, detail="student_id required")
        student_id = current_user.student.id

    student = _get_student_or_403(db, student_id, current_user)
    
    analysis = AIAnalysisService.backlog_analysis(db, student)
    return {
        "status": "success",
        "data": analysis
    }


@router.get("/attendance-analysis")
def get_attendance_analysis(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze attendance and calculate required classes."""
    if not student_id:
        if current_user.role != "student" or not current_user.student:
            raise HTTPException(status_code=400, detail="student_id required")
        student_id = current_user.student.id

    student = _get_student_or_403(db, student_id, current_user)
    
    analysis = AIAnalysisService.attendance_analysis(db, student)
    return {
        "status": "success",
        "data": analysis
    }


@router.get("/weakness-analysis")
def get_weakness_analysis(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze weak subjects."""
    if not student_id:
        if current_user.role != "student" or not current_user.student:
            raise HTTPException(status_code=400, detail="student_id required")
        student_id = current_user.student.id

    student = _get_student_or_403(db, student_id, current_user)
    
    analysis = AIAnalysisService.subject_weakness_analysis(db, student)
    return {
        "status": "success",
        "data": analysis
    }


@router.get("/placement-analysis")
def get_placement_analysis(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze placement readiness."""
    if not student_id:
        if current_user.role != "student" or not current_user.student:
            raise HTTPException(status_code=400, detail="student_id required")
        student_id = current_user.student.id

    student = _get_student_or_403(db, student_id, current_user)
    
    analysis = AIAnalysisService.placement_readiness(db, student)
    return {
        "status": "success",
        "data": analysis
    }


@router.get("/career-recommendation")
def get_career_recommendation(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get career path recommendations."""
    if not student_id:
        if current_user.role != "student" or not current_user.student:
            raise HTTPException(status_code=400, detail="student_id required")
        student_id = current_user.student.id

    student = _get_student_or_403(db, student_id, current_user)
    
    analysis = AIAnalysisService.career_recommendation(db, student)
    return {
        "status": "success",
        "data": analysis
    }


@router.post("/resume-analysis")
async def analyze_resume(
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    student_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze resume for completeness and suggestions."""
    if not student_id:
        if current_user.role != "student" or not current_user.student:
            raise HTTPException(status_code=400, detail="student_id required")
        student_id = current_user.student.id

    student = _get_student_or_403(db, student_id, current_user)

    resume_content = resume_text.strip() if resume_text else None
    temp_path = None

    # If a file is uploaded, extract text from PDF or plain-text-like files.
    if file:
        try:
            content = await file.read()
            if not content:
                raise HTTPException(status_code=400, detail="Uploaded resume file is empty")

            filename = file.filename or "resume"
            suffix = os.path.splitext(filename)[1].lower()
            content_type = file.content_type or ""

            if suffix == ".pdf" or content_type == "application/pdf":
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                    tmp.write(content)
                    temp_path = tmp.name
                analysis = AIAnalysisService.resume_analysis(resume_file_path=temp_path)
                return {
                    "status": "success",
                    "data": analysis
                }

            if suffix in {".txt", ".md", ".csv", ".json", ""} or content_type.startswith("text/"):
                try:
                    resume_content = content.decode("utf-8")
                except UnicodeDecodeError:
                    resume_content = content.decode("latin-1")
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Unsupported resume file type. Upload PDF or plain text."
                )
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    if not resume_content:
        raise HTTPException(status_code=400, detail="Resume file or text content required")

    analysis = AIAnalysisService.resume_analysis(resume_text=resume_content)
    return {
        "status": "success",
        "data": analysis
    }


@router.get("/summary")
def get_ai_summary(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get quick AI summary card for student."""
    if not student_id:
        if current_user.role != "student" or not current_user.student:
            raise HTTPException(status_code=400, detail="student_id required")
        student_id = current_user.student.id

    student = _get_student_or_403(db, student_id, current_user)
    
    summary = AIAnalysisService.get_student_summary(student)
    return {
        "status": "success",
        "data": summary
    }
