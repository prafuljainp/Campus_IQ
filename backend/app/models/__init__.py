"""
SQLAlchemy ORM models for CampusIQ.
All models defined here for clarity; can be split per module if needed.
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date,
    Text, ForeignKey, JSON, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


# ─── Enums ───────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    hod = "hod"
    faculty = "faculty"
    student = "student"


class Gender(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class SkillLevel(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"
    expert = "expert"


# ─── User Model ──────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="student")
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="user", uselist=False)
    faculty = relationship("Faculty", back_populates="user", uselist=False)
    activity_logs = relationship("ActivityLog", back_populates="user")


# ─── Department Model ─────────────────────────────────────────────────────────

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    hod_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    students = relationship("Student", back_populates="department")
    faculty_members = relationship("Faculty", back_populates="department",
                                   foreign_keys="Faculty.department_id")
    subjects = relationship("Subject", back_populates="department")
    hod = relationship("Faculty", foreign_keys=[hod_id], post_update=True)


# ─── Student Model ────────────────────────────────────────────────────────────

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Basic Info
    name = Column(String(150), nullable=False)
    usn = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    gender = Column(String(20), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    blood_group = Column(String(10), nullable=True)

    # Family Info
    father_name = Column(String(150), nullable=True)
    mother_name = Column(String(150), nullable=True)
    parent_phone = Column(String(20), nullable=True)

    # Address
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)

    # Academic
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    semester = Column(Integer, default=1)
    section = Column(String(10), nullable=True)
    admission_year = Column(Integer, nullable=True)
    cgpa = Column(Float, default=0.0)
    sgpa = Column(Float, default=0.0)
    backlog_count = Column(Integer, default=0)

    # Professional
    github = Column(String(255), nullable=True)
    linkedin = Column(String(255), nullable=True)

    # Documents
    profile_photo = Column(String(500), nullable=True)
    resume_url = Column(String(500), nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="student")
    department = relationship("Department", back_populates="students")
    skills = relationship("StudentSkill", back_populates="student", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", back_populates="student")
    marks_records = relationship("Marks", back_populates="student")
    placements = relationship("Placement", back_populates="student")
    internships = relationship("Internship", back_populates="student")


# ─── Faculty Model ────────────────────────────────────────────────────────────

class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    designation = Column(String(100), nullable=True)
    qualification = Column(String(200), nullable=True)
    experience_years = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="faculty")
    department = relationship("Department", back_populates="faculty_members",
                              foreign_keys=[department_id])
    subjects = relationship("Subject", back_populates="faculty")


# ─── Subject Model ────────────────────────────────────────────────────────────

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    credits = Column(Integer, default=3)
    semester = Column(Integer, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    department = relationship("Department", back_populates="subjects")
    faculty = relationship("Faculty", back_populates="subjects")
    attendance_records = relationship("Attendance", back_populates="subject")
    marks_records = relationship("Marks", back_populates="subject")


# ─── Attendance Model ─────────────────────────────────────────────────────────

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    date = Column(Date, nullable=False)
    is_present = Column(Boolean, default=False)
    marked_by = Column(Integer, ForeignKey("faculty.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="attendance_records")
    subject = relationship("Subject", back_populates="attendance_records")


# ─── Marks Model ─────────────────────────────────────────────────────────────

class Marks(Base):
    __tablename__ = "marks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    semester = Column(Integer, nullable=False)
    internal_marks = Column(Float, default=0.0)
    external_marks = Column(Float, default=0.0)
    total_marks = Column(Float, default=0.0)
    grade = Column(String(5), nullable=True)
    grade_points = Column(Float, default=0.0)
    is_pass = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="marks_records")
    subject = relationship("Subject", back_populates="marks_records")


# ─── Placement Model ──────────────────────────────────────────────────────────

class Placement(Base):
    __tablename__ = "placements"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    company = Column(String(200), nullable=False)
    role = Column(String(150), nullable=False)
    package_lpa = Column(Float, nullable=True)  # in LPA
    placement_date = Column(Date, nullable=True)
    location = Column(String(150), nullable=True)
    offer_letter_url = Column(String(500), nullable=True)
    is_confirmed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="placements")


# ─── Internship Model ─────────────────────────────────────────────────────────

class Internship(Base):
    __tablename__ = "internships"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    company = Column(String(200), nullable=False)
    role = Column(String(150), nullable=False)
    duration_months = Column(Integer, default=1)
    stipend = Column(Float, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    certificate_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="internships")


# ─── Skill Models ─────────────────────────────────────────────────────────────

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(100), nullable=True)  # e.g., "Programming", "Soft Skills"
    created_at = Column(DateTime, default=datetime.utcnow)

    student_skills = relationship("StudentSkill", back_populates="skill")


class StudentSkill(Base):
    __tablename__ = "student_skills"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    level = Column(String(50), default="beginner")
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="skills")
    skill = relationship("Skill", back_populates="student_skills")


# ─── Notice Model ─────────────────────────────────────────────────────────────

class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)  # NULL = all depts
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Activity Log Model ───────────────────────────────────────────────────────

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(255), nullable=False)
    entity_type = Column(String(100), nullable=True)  # e.g., "student", "placement"
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="activity_logs")
