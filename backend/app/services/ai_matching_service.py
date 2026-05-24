"""
AI Company Matching Service
Matches students with suitable companies based on skills, CGPA, and requirements.
"""
from sqlalchemy.orm import Session
from app.models import Student
from typing import Dict, List, Optional
from datetime import datetime


class CompanyMatchingService:
    """Service for matching students with companies."""
    
    # Sample company database (would be stored in database)
    COMPANIES_DB = [
        {
            "id": 1,
            "name": "Google India",
            "hiring_roles": ["Backend Engineer", "Full Stack Developer", "Android Developer"],
            "min_cgpa": 7.5,
            "max_backlogs": 0,
            "required_skills": ["Python", "Java", "System Design"],
            "preferred_skills": ["React", "Docker", "Kubernetes"],
            "ctc_range": (15, 25),
            "hiring_season": "September-November"
        },
        {
            "id": 2,
            "name": "Microsoft",
            "hiring_roles": ["Software Engineer", "Cloud Engineer"],
            "min_cgpa": 7.0,
            "max_backlogs": 0,
            "required_skills": ["C++", "Java", "Cloud Computing"],
            "preferred_skills": ["Azure", "DevOps", "Microservices"],
            "ctc_range": (14, 22),
            "hiring_season": "October-December"
        },
        {
            "id": 3,
            "name": "Amazon",
            "hiring_roles": ["SDE", "Backend Engineer", "Data Engineer"],
            "min_cgpa": 7.2,
            "max_backlogs": 0,
            "required_skills": ["Java", "Python", "Data Structures"],
            "preferred_skills": ["AWS", "Spark", "Kafka"],
            "ctc_range": (13, 20),
            "hiring_season": "August-October"
        },
        {
            "id": 4,
            "name": "Infosys",
            "hiring_roles": ["Systems Engineer", "Programmer Analyst"],
            "min_cgpa": 6.0,
            "max_backlogs": 1,
            "required_skills": ["Java", "C++"],
            "preferred_skills": ["Cloud", "Agile"],
            "ctc_range": (3.5, 5.5),
            "hiring_season": "Year-round"
        },
        {
            "id": 5,
            "name": "Goldman Sachs",
            "hiring_roles": ["Analyst", "Developer"],
            "min_cgpa": 8.5,
            "max_backlogs": 0,
            "required_skills": ["C++", "Python", "Finance Math"],
            "preferred_skills": ["Low-Latency Systems", "Quantitative Analysis"],
            "ctc_range": (20, 35),
            "hiring_season": "January-March"
        },
        {
            "id": 6,
            "name": "TCS",
            "hiring_roles": ["IT Associate", "Software Engineer"],
            "min_cgpa": 6.0,
            "max_backlogs": 2,
            "required_skills": ["Java"],
            "preferred_skills": ["SAP", "Cloud"],
            "ctc_range": (3.5, 4.5),
            "hiring_season": "Year-round"
        }
    ]
    
    @staticmethod
    def find_matching_companies(db: Session, student_id: int) -> Dict:
        """
        Find matching companies for a student.
        
        Returns:
        - Eligible companies (meets all criteria)
        - Partially eligible (missing 1-2 things)
        - Not eligible (missing critical criteria)
        """
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")
        
        student_skills = [s.skill.name for s in (student.skills or [])]
        
        eligible_companies = []
        partially_eligible = []
        not_eligible = []
        
        for company in CompanyMatchingService.COMPANIES_DB:
            matching_result = CompanyMatchingService._calculate_company_match(
                student, company, student_skills
            )
            
            if matching_result["eligible"]:
                eligible_companies.append(matching_result)
            elif matching_result["match_score"] >= 50:
                partially_eligible.append(matching_result)
            else:
                not_eligible.append(matching_result)
        
        # Sort by match score
        eligible_companies.sort(key=lambda x: x["match_score"], reverse=True)
        partially_eligible.sort(key=lambda x: x["match_score"], reverse=True)
        not_eligible.sort(key=lambda x: x["match_score"], reverse=True)
        
        return {
            "student_id": student_id,
            "student_profile": {
                "cgpa": student.cgpa,
                "backlogs": student.backlog_count or 0,
                "skills_count": len(student_skills),
                "skills": student_skills
            },
            "eligible_companies": eligible_companies,
            "partially_eligible_companies": partially_eligible[:5],  # Top 5
            "not_eligible_companies": not_eligible[:5],  # Top 5
            "statistics": {
                "total_companies_tracked": len(CompanyMatchingService.COMPANIES_DB),
                "fully_eligible": len(eligible_companies),
                "partially_eligible": len(partially_eligible),
                "not_eligible": len(not_eligible),
                "average_match_score": round(
                    sum(c["match_score"] for c in eligible_companies + partially_eligible + not_eligible) / 
                    len(CompanyMatchingService.COMPANIES_DB), 1
                )
            },
            "recommendations": CompanyMatchingService._generate_matching_recommendations(
                student, eligible_companies, partially_eligible
            ),
            "calculated_at": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def _calculate_company_match(student: Student, company: Dict, student_skills: List[str]) -> Dict:
        """
        Calculate match score between student and company.
        
        Match score factors:
        - CGPA match (30%)
        - Backlog eligibility (20%)
        - Required skills (30%)
        - Preferred skills (20%)
        """
        cgpa = student.cgpa or 0
        backlogs = student.backlog_count or 0
        
        # CGPA factor (30%)
        cgpa_factor = min(1.0, cgpa / company["min_cgpa"]) if company["min_cgpa"] > 0 else 1.0
        cgpa_score = cgpa_factor * 30
        
        # Backlog factor (20%)
        backlog_eligible = backlogs <= company["max_backlogs"]
        backlog_score = 20 if backlog_eligible else max(0, 20 - (backlogs - company["max_backlogs"]) * 10)
        
        # Required skills factor (30%)
        if company["required_skills"]:
            matching_required = sum(1 for skill in company["required_skills"] if skill.lower() in [s.lower() for s in student_skills])
            required_score = (matching_required / len(company["required_skills"])) * 30
        else:
            required_score = 30
        
        # Preferred skills factor (20%)
        if company["preferred_skills"]:
            matching_preferred = sum(1 for skill in company["preferred_skills"] if skill.lower() in [s.lower() for s in student_skills])
            preferred_score = (matching_preferred / len(company["preferred_skills"])) * 20
        else:
            preferred_score = 20
        
        total_score = cgpa_score + backlog_score + required_score + preferred_score
        
        # Determine eligibility
        is_eligible = (
            cgpa >= company["min_cgpa"] and
            backlogs <= company["max_backlogs"] and
            (matching_required / len(company["required_skills"]) >= 0.8 if company["required_skills"] else True)
        )
        
        # Barriers list
        barriers = []
        if cgpa < company["min_cgpa"]:
            barriers.append(f"CGPA {cgpa} < required {company['min_cgpa']}")
        
        if backlogs > company["max_backlogs"]:
            barriers.append(f"{backlogs} backlogs > allowed {company['max_backlogs']}")
        
        if company["required_skills"]:
            missing_required = [s for s in company["required_skills"] if s.lower() not in [sk.lower() for sk in student_skills]]
            if missing_required:
                barriers.append(f"Missing skills: {', '.join(missing_required)}")
        
        return {
            "company_id": company["id"],
            "company_name": company["name"],
            "hiring_roles": company["hiring_roles"],
            "ctc_range": f"{company['ctc_range'][0]}-{company['ctc_range'][1]} LPA",
            "match_score": round(total_score, 1),
            "eligible": is_eligible,
            "match_factors": {
                "cgpa": round(cgpa_score, 1),
                "backlogs": round(backlog_score, 1),
                "required_skills": round(required_score, 1),
                "preferred_skills": round(preferred_score, 1)
            },
            "matching_skills": [s for s in student_skills if s in company["required_skills"] + company["preferred_skills"]],
            "barriers": barriers,
            "hiring_season": company["hiring_season"],
            "how_to_fix": CompanyMatchingService._get_fix_suggestions(
                student, company, student_skills, barriers
            )
        }
    
    @staticmethod
    def _get_fix_suggestions(student: Student, company: Dict, student_skills: List[str], barriers: List[str]) -> List[str]:
        """Get suggestions to fix barriers."""
        suggestions = []
        
        if student.cgpa and student.cgpa < company["min_cgpa"]:
            gap = company["min_cgpa"] - student.cgpa
            suggestions.append(f"Improve CGPA by {gap:.1f} points (aim for {company['min_cgpa']}+)")
        
        backlogs = student.backlog_count or 0
        if backlogs > company["max_backlogs"]:
            suggestions.append(f"Clear {backlogs - company['max_backlogs']} backlog(s)")
        
        if company["required_skills"]:
            missing = [s for s in company["required_skills"] if s.lower() not in [sk.lower() for sk in student_skills]]
            if missing:
                suggestions.append(f"Learn: {', '.join(missing)} ({len(missing)} weeks each)")
        
        if not suggestions:
            suggestions = ["You're almost there! Minor tweaks in some areas"]
        
        return suggestions
    
    @staticmethod
    def _generate_matching_recommendations(student: Student, eligible: List[Dict], partial: List[Dict]) -> str:
        """Generate overall matching recommendations."""
        if len(eligible) >= 5:
            return "🎉 Excellent! You're eligible for many top companies. Focus on skill development for specialized roles."
        elif len(eligible) >= 1:
            return f"👍 Good! You qualify for {len(eligible)} top companies. Work on improving skills to unlock more options."
        elif len(partial) >= 3:
            return "⚠️ Close but not yet. Clear backlogs and improve CGPA to unlock more opportunities."
        else:
            return "💪 Work on fundamentals: Improve CGPA, clear backlogs, and build key skills."


class SkillGapAnalysisService:
    """Service for analyzing skill gaps vs company requirements."""
    
    @staticmethod
    def analyze_skill_gaps(db: Session, student_id: int) -> Dict:
        """Analyze skill gaps for top companies."""
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")
        
        student_skills = set(s.skill.name for s in (student.skills or []))
        
        # Collect all required and preferred skills from all companies
        all_required_skills = set()
        all_preferred_skills = set()
        skill_frequency = {}
        
        for company in CompanyMatchingService.COMPANIES_DB:
            for skill in company["required_skills"]:
                all_required_skills.add(skill)
                skill_frequency[skill] = skill_frequency.get(skill, 0) + 1
            
            for skill in company["preferred_skills"]:
                all_preferred_skills.add(skill)
                skill_frequency[skill] = skill_frequency.get(skill, 0) + 0.5
        
        # Find gaps
        missing_required = all_required_skills - student_skills
        missing_preferred = all_preferred_skills - student_skills
        
        # Sort by frequency (most demanded first)
        missing_required_sorted = sorted(
            missing_required,
            key=lambda s: skill_frequency.get(s, 0),
            reverse=True
        )
        
        missing_preferred_sorted = sorted(
            missing_preferred,
            key=lambda s: skill_frequency.get(s, 0),
            reverse=True
        )
        
        return {
            "student_id": student_id,
            "current_skills": list(student_skills),
            "current_skill_count": len(student_skills),
            "missing_required_skills": missing_required_sorted[:10],
            "missing_preferred_skills": missing_preferred_sorted[:10],
            "high_demand_skills": sorted(
                [(s, c) for s, c in skill_frequency.items() if s not in student_skills],
                key=lambda x: x[1],
                reverse=True
            )[:5],
            "placement_readiness": {
                "current": f"{len(student_skills)} skills",
                "target": "10+ skills",
                "gap": max(0, 10 - len(student_skills)),
                "estimated_timeline": f"{max(0, 10 - len(student_skills)) * 2} weeks"
            }
        }
