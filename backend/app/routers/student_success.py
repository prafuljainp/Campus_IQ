"""Student Success Command Center API."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.services.student_success_service import StudentSuccessService

router = APIRouter(prefix="/api/student-success", tags=["Student Success"])


@router.get("/command-center")
def get_command_center(
    department_id: int | None = Query(default=None),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return risk, readiness and intervention data for the current user's scope."""
    return StudentSuccessService.get_command_center(
        db=db,
        user=current_user,
        department_id=department_id,
        limit=limit,
    )


@router.get("/students/{student_id}")
def get_student_success_profile(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return an explainable success profile for a single accessible student."""
    profile = StudentSuccessService.get_student_profile(db, current_user, student_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Student success profile not found")
    return profile


@router.post("/students/{student_id}/what-if")
def simulate_student_success(
    student_id: int,
    scenario: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Simulate how changes in CGPA, attendance, backlogs or skills change risk."""
    result = StudentSuccessService.simulate_what_if(db, current_user, student_id, scenario)
    if not result:
        raise HTTPException(status_code=404, detail="Student success profile not found")
    return result
