"""
Advanced Analytics Router
Endpoints for predictive models and advanced analytics
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.core.dependencies import get_db, get_current_user
from app.models import User, Student
from app.services.advanced_analytics_service import AdvancedAnalyticsService, DataWarehouseSchema

router = APIRouter(prefix="/api/analytics", tags=["Advanced Analytics"])

def _get_student_or_403(db: Session, student_id: Optional[int], current_user: User) -> Student:
    """Helper to validate student access."""
    if not student_id:
        if current_user.role != "student" or not current_user.student:
            raise HTTPException(status_code=400, detail="student_id required")
        student_id = current_user.student.id
    
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check access control
    if current_user.role == "student" and current_user.student.id != student_id:
        raise HTTPException(status_code=403, detail="Cannot access other student's data")
    
    return student

@router.get("/graduation-prediction")
def get_graduation_prediction(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Predict graduation probability for a student.
    
    Returns:
    - probability (0-100%): Likelihood of graduation
    - risk_level: excellent/good/moderate/critical
    - factors: Breakdown of contributing factors
    - recommendations: Actionable suggestions
    """
    student = _get_student_or_403(db, student_id, current_user)
    prediction = AdvancedAnalyticsService.predict_graduation_probability(db, student)
    return {
        "status": "success",
        "data": prediction
    }

@router.get("/career-recommendations")
def get_career_recommendations(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get AI-based career path recommendations.
    
    Returns:
    - recommendations: List of suitable careers with match percentages
    - missing_skills: Skills needed for each career
    - current_skills: Student's current skills
    """
    student = _get_student_or_403(db, student_id, current_user)
    recommendations = AdvancedAnalyticsService.recommend_career_paths(db, student)
    return {
        "status": "success",
        "data": recommendations
    }

@router.get("/placement-prediction")
def get_placement_prediction(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Predict placement success probability.
    
    Returns:
    - probability: Placement success percentage
    - likelihood: High/Moderate/Low
    - suggestions: Steps to improve placement chances
    """
    student = _get_student_or_403(db, student_id, current_user)
    prediction = AdvancedAnalyticsService.predict_placement_probability(db, student)
    return {
        "status": "success",
        "data": prediction
    }

@router.get("/data-warehouse-schema")
def get_data_warehouse_schema(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get data warehouse schema structure for analytics.
    Available to admins only.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    schema = DataWarehouseSchema.get_schema_structure()
    return {
        "status": "success",
        "data": schema,
        "message": "Data warehouse schema for scalable analytics"
    }

@router.get("/student-analytics-dashboard")
def get_student_analytics_dashboard(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Unified analytics dashboard combining all predictions.
    """
    student = _get_student_or_403(db, student_id, current_user)
    
    graduation_pred = AdvancedAnalyticsService.predict_graduation_probability(db, student)
    career_rec = AdvancedAnalyticsService.recommend_career_paths(db, student)
    placement_pred = AdvancedAnalyticsService.predict_placement_probability(db, student)
    
    return {
        "status": "success",
        "data": {
            "graduation_prediction": graduation_pred,
            "career_recommendations": career_rec,
            "placement_prediction": placement_pred,
            "generated_at": __import__('datetime').datetime.now().isoformat()
        }
    }
