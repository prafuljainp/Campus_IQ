"""
AI Insights API Router
Exposes all AI intelligence services via REST endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.core.dependencies import get_current_user, require_admin_or_hod, require_admin_hod_faculty
from app.models import User
from app.services.ai_health_score_service import HealthScoreService
from app.services.ai_placement_service import PlacementProbabilityService, PlacementWhatIfService
from app.services.ai_recommendations_service import RecommendationService, SmartAlertService
from app.services.ai_matching_service import CompanyMatchingService, SkillGapAnalysisService
from app.services.ai_analytics_service import AdminAnalyticsService

router = APIRouter(prefix="/api/ai", tags=["AI Intelligence"])


# ──────────────────────────────────────────────────────────────────────────────
# HEALTH SCORE ENDPOINTS
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/health-score")
def get_health_score(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_hod_faculty)
):
    """
    Calculate and return student health score with breakdown.
    
    - **student_id**: (Optional) Student ID. If not provided, returns current user's score.
    - Returns: Health score (0-100) with component breakdown, status, and recommendations
    """
    # Determine whom to calculate for
    if student_id:
        if current_user.role == "super_admin":
            target_student_id = student_id
        elif current_user.role in ("hod", "faculty"):
            # Verify student is in same department
            # TODO: Add department check
            target_student_id = student_id
        else:
            raise HTTPException(status_code=403, detail="Unauthorized")
    else:
        if current_user.student_id:
            target_student_id = current_user.student_id
        else:
            raise HTTPException(status_code=404, detail="No student profile found")
    
    try:
        result = HealthScoreService.calculate_health_score(db, target_student_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ──────────────────────────────────────────────────────────────────────────────
# PLACEMENT PROBABILITY ENDPOINTS
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/placement-probability")
def get_placement_probability(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_hod_faculty)
):
    """
    Calculate placement success probability.
    
    Returns:
    - Probability (0-100%)
    - Factor breakdown (CGPA, Skills, Attendance, Standing)
    - Modifiers (penalties and bonuses)
    - Risk factors
    - Improvement opportunities
    """
    # Determine whom to calculate for
    if student_id:
        if current_user.role != "super_admin":
            raise HTTPException(status_code=403, detail="Unauthorized")
        target_student_id = student_id
    else:
        if current_user.student_id:
            target_student_id = current_user.student_id
        else:
            raise HTTPException(status_code=404, detail="No student profile found")
    
    try:
        result = PlacementProbabilityService.calculate_placement_probability(db, target_student_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/what-if-simulation")
def simulate_placement_improvement(
    scenario: dict,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_hod_faculty)
):
    """
    Simulate placement probability with hypothetical improvements.
    
    Example scenario:
    ```json
    {
        "cgpa": 7.5,
        "skills_count": 8,
        "clear_backlogs": true
    }
    ```
    
    Returns:
    - Current vs simulated probability
    - Absolute and percentage improvement
    """
    if student_id:
        if current_user.role != "super_admin":
            raise HTTPException(status_code=403, detail="Unauthorized")
        target_student_id = student_id
    else:
        if current_user.student_id:
            target_student_id = current_user.student_id
        else:
            raise HTTPException(status_code=404, detail="No student profile found")
    
    try:
        result = PlacementWhatIfService.simulate_improvement(db, target_student_id, scenario)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ──────────────────────────────────────────────────────────────────────────────
# ACTION PLAN & RECOMMENDATIONS ENDPOINTS
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/action-plan")
def get_action_plan(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_hod_faculty)
):
    """
    Generate personalized action plan for student improvement.
    
    Returns:
    - Priority-ranked actions (1-5)
    - Timeline for each action
    - Expected health score improvement
    - Success factors
    """
    if student_id:
        if current_user.role != "super_admin":
            raise HTTPException(status_code=403, detail="Unauthorized")
        target_student_id = student_id
    else:
        if current_user.student_id:
            target_student_id = current_user.student_id
        else:
            raise HTTPException(status_code=404, detail="No student profile found")
    
    try:
        result = RecommendationService.generate_action_plan(db, target_student_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/alerts")
def get_student_alerts(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_hod_faculty)
):
    """
    Get active alerts for student.
    
    Alert types:
    - attendance: Low attendance warnings
    - backlog: Active backlog alerts
    - placement: Placement readiness issues
    - skill: Skill development opportunities
    - exam: Upcoming exam reminders
    - event: Important events
    
    Returns:
    - Total alerts
    - Critical alerts count
    - Alert list with severity levels
    """
    if student_id:
        if current_user.role != "super_admin":
            raise HTTPException(status_code=403, detail="Unauthorized")
        target_student_id = student_id
    else:
        if current_user.student_id:
            target_student_id = current_user.student_id
        else:
            raise HTTPException(status_code=404, detail="No student profile found")
    
    try:
        result = RecommendationService.generate_alerts(db, target_student_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ──────────────────────────────────────────────────────────────────────────────
# COMPANY MATCHING ENDPOINTS
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/company-matching")
def get_company_matches(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_hod_faculty)
):
    """
    Find matching companies for student.
    
    Returns:
    - Eligible companies (meets all criteria)
    - Partially eligible (missing 1-2 things)
    - Not eligible (missing critical criteria)
    - Match scores and how to fix barriers
    """
    if student_id:
        if current_user.role != "super_admin":
            raise HTTPException(status_code=403, detail="Unauthorized")
        target_student_id = student_id
    else:
        if current_user.student_id:
            target_student_id = current_user.student_id
        else:
            raise HTTPException(status_code=404, detail="No student profile found")
    
    try:
        result = CompanyMatchingService.find_matching_companies(db, target_student_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/skill-gap-analysis")
def analyze_skill_gaps(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_hod_faculty)
):
    """
    Analyze skill gaps vs market demand.
    
    Returns:
    - Current skills
    - Missing required skills for top companies
    - Missing preferred skills
    - High-demand skills not yet acquired
    - Placement readiness timeline
    """
    if student_id:
        if current_user.role != "super_admin":
            raise HTTPException(status_code=403, detail="Unauthorized")
        target_student_id = student_id
    else:
        if current_user.student_id:
            target_student_id = current_user.student_id
        else:
            raise HTTPException(status_code=404, detail="No student profile found")
    
    try:
        result = SkillGapAnalysisService.analyze_skill_gaps(db, target_student_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ──────────────────────────────────────────────────────────────────────────────
# ADMIN ANALYTICS ENDPOINTS
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/admin/dashboard-analytics")
def get_dashboard_analytics(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    """
    Get comprehensive dashboard analytics.
    
    Returns:
    - Summary metrics
    - Distribution statistics
    - Key insights
    - Most demanded skills
    - Placement readiness stats
    
    **Access Control:**
    - Admin: Can see all departments
    - HOD: Can see only their department
    """
    if current_user.role == "hod":
        if department_id and department_id != current_user.department_id:
            raise HTTPException(status_code=403, detail="Can only view your department")
        department_id = current_user.department_id
    
    result = AdminAnalyticsService.get_dashboard_analytics(db, department_id)
    return result


@router.get("/admin/department-comparison")
def get_department_comparison(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    """
    Compare metrics across departments.
    
    Available only to admins.
    
    Returns:
    - Comparison by department
    - Top and lowest performing departments
    """
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = AdminAnalyticsService.get_department_comparison(db)
    return result


@router.get("/admin/placement-trends")
def get_placement_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    """
    Get placement trend analysis.
    
    Returns:
    - Current year stats
    - Previous year comparison
    - Trend insights
    - Top hiring companies
    """
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = AdminAnalyticsService.get_placement_trend_analysis(db)
    return result


@router.get("/admin/recommendations")
def get_admin_recommendations(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_hod)
):
    """
    Get actionable recommendations for admin.
    
    Returns:
    - Recommended actions by category
    - Priority levels
    - Impact assessment
    - Deadlines
    """
    if current_user.role == "hod":
        if department_id and department_id != current_user.department_id:
            raise HTTPException(status_code=403, detail="Can only view your department")
        department_id = current_user.department_id
    
    result = AdminAnalyticsService.generate_recommendations_report(db, department_id)
    return result


# ──────────────────────────────────────────────────────────────────────────────
# HEALTH CHECK & SUMMARY ENDPOINTS
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/complete-summary")
def get_complete_summary(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_hod_faculty)
):
    """
    Get complete AI summary card (combines all insights).
    
    Returns:
    - Health score summary
    - Placement probability summary
    - Top action (most important next step)
    - Critical alerts count
    - Match count (eligible companies)
    """
    if student_id:
        if current_user.role != "super_admin":
            raise HTTPException(status_code=403, detail="Unauthorized")
        target_student_id = student_id
    else:
        if current_user.student_id:
            target_student_id = current_user.student_id
        else:
            raise HTTPException(status_code=404, detail="No student profile found")
    
    try:
        health = HealthScoreService.calculate_health_score(db, target_student_id)
        placement = PlacementProbabilityService.calculate_placement_probability(db, target_student_id)
        alerts = RecommendationService.generate_alerts(db, target_student_id)
        companies = CompanyMatchingService.find_matching_companies(db, target_student_id)
        
        return {
            "student_id": target_student_id,
            "health_score_summary": {
                "score": health["total_score"],
                "status": health["status"]
            },
            "placement_probability_summary": {
                "probability": placement["placement_probability"],
                "confidence": placement["confidence"]
            },
            "alerts_summary": {
                "total": alerts["total_alerts"],
                "critical": alerts["critical_alerts"]
            },
            "company_matching_summary": {
                "eligible": len(companies["eligible_companies"]),
                "partially_eligible": len(companies["partially_eligible_companies"]),
                "total_tracked": companies["statistics"]["total_companies_tracked"]
            },
            "next_action": health["recommendations"][0] if health["recommendations"] else "No recommendations"
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
