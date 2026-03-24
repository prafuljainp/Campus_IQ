"""
FastAPI dependency injection for authentication and authorization.
FIXED: Removed broken import path that was crashing the server.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Extract and validate the current user from JWT token."""
    from app.models import User  # late import avoids circular issues
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_roles(*roles: str):
    """Factory for role-based access control dependencies."""
    def _check(current_user=Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(roles)}"
            )
        return current_user
    return _check


def get_user_dept(user) -> int | None:
    """Return department_id for HOD/Faculty, None for super_admin."""
    if user.role == "super_admin":
        return None
    if user.faculty:
        return user.faculty.department_id
    if user.student:
        return user.student.department_id
    return None


require_admin = require_roles("super_admin")
require_admin_or_hod = require_roles("super_admin", "hod")
require_admin_hod_faculty = require_roles("super_admin", "hod", "faculty")
