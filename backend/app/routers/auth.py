"""
Auth router — FIXED:
- /profile returns student_id, faculty_id, department_id for frontend use
- Activity log on login
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import User, Faculty, Student, ActivityLog
from app.schemas import LoginRequest, Token, UserOut
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(request: LoginRequest, req: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")

    user.last_login = datetime.utcnow()

    # Get display name
    name = "Admin"
    if user.faculty:
        name = user.faculty.name
    elif user.student:
        name = user.student.name
    elif user.role == "super_admin":
        name = "Super Admin"

    db.add(ActivityLog(
        user_id=user.id, action="USER_LOGIN",
        entity_type="auth", details=f"Login from {req.client.host if req.client else 'unknown'}"
    ))
    db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return Token(access_token=token, role=user.role, user_id=user.id, name=name)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    """Extended profile with IDs needed by the frontend."""
    profile = {
        "user_id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "last_login": current_user.last_login,
    }
    if current_user.faculty:
        f = current_user.faculty
        profile.update({
            "name": f.name,
            "faculty_id": f.id,
            "department_id": f.department_id,
            "designation": f.designation,
        })
    elif current_user.student:
        s = current_user.student
        profile.update({
            "name": s.name,
            "student_id": s.id,
            "usn": s.usn,
            "department_id": s.department_id,
            "cgpa": s.cgpa,
            "semester": s.semester,
        })
    else:
        profile["name"] = "Super Admin"
    return profile


@router.post("/change-password")
def change_password(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.get("current_password", ""), current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if not data.get("new_password"):
        raise HTTPException(status_code=400, detail="New password is required")
    current_user.hashed_password = get_password_hash(data["new_password"])
    db.commit()
    return {"message": "Password changed successfully"}
