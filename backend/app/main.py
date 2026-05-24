"""
CampusIQ - AI Powered College ERP & Placement Intelligence System
FastAPI Backend - Production-Ready Entry Point

FIXES:
- Removed circular router import
- Added proper CORS
- Graceful seed error handling
- Static files for uploads
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import engine, Base, SessionLocal
from app.core.config import settings

# Import models first so SQLAlchemy registers them
import app.models  # noqa: F401

# Import routers directly (no package-level import to avoid circular deps)
from app.routers.auth import router as auth_router
from app.routers.departments import router as departments_router
from app.routers.students import router as students_router
from app.routers.faculty import router as faculty_router
from app.routers.subjects import router as subjects_router
from app.routers.marks import router as marks_router
from app.routers.attendance import router as attendance_router
from app.routers.placements import placements_router, internships_router
from app.routers.notices import router as notices_router
from app.routers.skills import router as skills_router
from app.routers.logs import router as logs_router
from app.routers.analytics import router as analytics_router
from app.routers.advanced_analytics import router as advanced_analytics_router
from app.routers.ai_analysis import router as ai_analysis_router
from app.routers.ai_insights import router as ai_insights_router
from app.routers.phase3_integration import router as phase3_router
from app.routers.phase4_gamification import router as phase4_router
from app.routers.phase5_enterprise import router as phase5_router
from app.routers.student_success import router as student_success_router
from app.routers.aptitude import router as aptitude_router

app = FastAPI(
    title="CampusIQ API",
    description="AI Powered College ERP & Placement Intelligence System",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Restrict in production to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Routers
app.include_router(auth_router)
app.include_router(departments_router)
app.include_router(students_router)
app.include_router(faculty_router)
app.include_router(subjects_router)
app.include_router(marks_router)
app.include_router(attendance_router)
app.include_router(placements_router)
app.include_router(internships_router)
app.include_router(notices_router)
app.include_router(skills_router)
app.include_router(logs_router)
app.include_router(analytics_router)
app.include_router(advanced_analytics_router)
app.include_router(phase3_router)
app.include_router(phase4_router)
app.include_router(phase5_router)
app.include_router(ai_analysis_router)
app.include_router(ai_insights_router)
app.include_router(student_success_router)
app.include_router(aptitude_router)


@app.on_event("startup")
async def startup_event():
    """Create all tables and seed demo data on first run."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        from app.seed import seed_database
        seed_database(db)
    except Exception as e:
        print(f"Seed warning: {e}")
    finally:
        db.close()
    print("CampusIQ API v2.0 is running.")
    print("Docs: /api/docs")


@app.get("/")
def root():
    return {"status": "ok", "app": "CampusIQ API", "version": "2.0.0"}


@app.get("/api/health")
def health():
    return {"status": "healthy", "environment": settings.ENVIRONMENT}
