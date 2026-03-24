"""Skills management router."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Skill
from app.schemas import SkillCreate
from app.core.dependencies import get_current_user, require_admin_hod_faculty

router = APIRouter(prefix="/api/skills", tags=["Skills"])


@router.get("")
def list_skills(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Skill).order_by(Skill.category, Skill.name).all()


@router.post("")
def create_skill(data: SkillCreate, db: Session = Depends(get_db), _=Depends(require_admin_hod_faculty)):
    existing = db.query(Skill).filter(Skill.name == data.name).first()
    if existing:
        return existing
    skill = Skill(**data.dict())
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.get("/demand")
def skill_demand(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Return skill demand analytics — how many students have each skill."""
    from sqlalchemy import func
    from app.models import StudentSkill
    results = (
        db.query(Skill.name, Skill.category, func.count(StudentSkill.id).label("count"))
        .join(StudentSkill, Skill.id == StudentSkill.skill_id)
        .group_by(Skill.id)
        .order_by(func.count(StudentSkill.id).desc())
        .limit(15)
        .all()
    )
    return [{"name": r.name, "category": r.category, "count": r.count} for r in results]
