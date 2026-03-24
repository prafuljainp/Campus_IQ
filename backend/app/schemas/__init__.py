"""Pydantic schemas — all request/response models."""
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime, date


# ── Auth ──────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str

class UserOut(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    class Config: from_attributes = True


# ── Department ────────────────────────────────────────────────────────────────
class DepartmentCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    hod_id: Optional[int] = None

class DepartmentOut(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    hod_id: Optional[int] = None
    created_at: datetime
    class Config: from_attributes = True


# ── Student ───────────────────────────────────────────────────────────────────
class StudentCreate(BaseModel):
    name: str
    usn: str
    email: str
    phone: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    blood_group: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    parent_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    department_id: int
    semester: Optional[int] = 1
    section: Optional[str] = None
    admission_year: Optional[int] = None
    cgpa: Optional[float] = 0.0
    sgpa: Optional[float] = 0.0
    backlog_count: Optional[int] = 0
    github: Optional[str] = None
    linkedin: Optional[str] = None
    password: Optional[str] = "Student@123"

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    blood_group: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    parent_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    cgpa: Optional[float] = None
    sgpa: Optional[float] = None
    backlog_count: Optional[int] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None


# ── Faculty ───────────────────────────────────────────────────────────────────
class FacultyCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = 0
    password: Optional[str] = "Faculty@123"

class FacultyUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None


# ── Subject ───────────────────────────────────────────────────────────────────
class SubjectCreate(BaseModel):
    name: str
    code: str
    credits: int = 3
    semester: Optional[int] = None
    department_id: Optional[int] = None
    faculty_id: Optional[int] = None


# ── Marks ─────────────────────────────────────────────────────────────────────
class MarksCreate(BaseModel):
    student_id: int
    subject_id: int
    semester: int
    internal_marks: float = 0.0
    external_marks: float = 0.0


# ── Attendance ────────────────────────────────────────────────────────────────
class AttendanceCreate(BaseModel):
    student_id: int
    subject_id: int
    date: date
    is_present: bool

class AttendanceBulk(BaseModel):
    subject_id: int
    date: date
    records: List[dict]


# ── Placement ─────────────────────────────────────────────────────────────────
class PlacementCreate(BaseModel):
    student_id: int
    company: str
    role: str
    package_lpa: Optional[float] = None
    placement_date: Optional[date] = None
    location: Optional[str] = None
    is_confirmed: bool = False


# ── Internship ────────────────────────────────────────────────────────────────
class InternshipCreate(BaseModel):
    student_id: int
    company: str
    role: str
    duration_months: int = 1
    stipend: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


# ── Notice ────────────────────────────────────────────────────────────────────
class NoticeCreate(BaseModel):
    title: str
    content: str
    department_id: Optional[int] = None


# ── Skill ─────────────────────────────────────────────────────────────────────
class SkillCreate(BaseModel):
    name: str
    category: Optional[str] = None
