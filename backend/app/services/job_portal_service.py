"""
Job Portal Integration Service
Integrates with external job portals and manages job listings
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models import Student, Skill
import httpx

class JobPortalService:
    """Service for job portal integration and management"""
    
    # Mock external job portal data
    EXTERNAL_JOB_SOURCES = {
        "linkedin": "https://api.linkedin.com/v2/jobs",
        "indeed": "https://api.indeed.com/v2/jobs",
        "naukri": "https://api.naukri.com/v1/jobs",
        "internshala": "https://api.internshala.com/jobs"
    }
    
    @staticmethod
    def search_jobs(db: Session, student: Student, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Search jobs matched to student skills and profile.
        
        Args:
            db: Database session
            student: Student object
            filters: {
                "experience_level": "fresher/junior/mid",
                "location": "remote/onsite/hybrid",
                "salary_range": [min, max],
                "job_types": ["full-time", "internship"],
                "industries": ["IT", "Finance"]
            }
        
        Returns:
            Matched jobs with relevance scores
        """
        try:
            # Get student skills
            skills = db.query(Skills).join(
                Skills.students
            ).filter(
                Student.id == student.id
            ).all()
            
            skill_names = [s.name.lower() for s in skills]
            
            # Mock job listings (in production, fetch from APIs)
            mock_jobs = JobPortalService._get_mock_jobs()
            
            # Filter and score jobs
            matched_jobs = []
            for job in mock_jobs:
                relevance_score = JobPortalService._calculate_job_relevance(
                    skill_names, 
                    student.cgpa or 0,
                    job,
                    filters or {}
                )
                
                if relevance_score > 0:
                    job['relevance_score'] = relevance_score
                    job['match_percentage'] = round(relevance_score * 100, 1)
                    matched_jobs.append(job)
            
            # Sort by relevance
            matched_jobs.sort(key=lambda x: x['relevance_score'], reverse=True)
            
            return {
                "status": "success",
                "total_jobs": len(matched_jobs),
                "jobs": matched_jobs[:20],  # Top 20
                "filters_applied": filters,
                "student_skills": skill_names,
                "message": f"Found {len(matched_jobs)} jobs matching your profile"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Job search failed: {str(e)}",
                "jobs": []
            }
    
    @staticmethod
    def get_job_recommendations(db: Session, student: Student) -> Dict[str, Any]:
        """Get AI-recommended jobs for a student."""
        try:
            # Get student profile data
            skills = db.query(Skill).join(
                Skill.students
            ).filter(
                Student.id == student.id
            ).all()
            
            skill_names = [s.name.lower() for s in skills]
            cgpa = student.cgpa or 0
            
            # Determine recommended job level
            if cgpa >= 8.5:
                job_levels = ["senior", "mid"]
            elif cgpa >= 7.5:
                job_levels = ["mid", "junior"]
            else:
                job_levels = ["junior", "fresher", "internship"]
            
            # Get recommendations
            all_jobs = JobPortalService._get_mock_jobs()
            recommendations = []
            
            for job in all_jobs:
                if job.get('level') in job_levels:
                    score = JobPortalService._calculate_job_relevance(skill_names, cgpa, job, {})
                    if score > 0.6:  # Only top matches
                        recommendations.append({
                            "job_id": job['id'],
                            "title": job['title'],
                            "company": job['company'],
                            "description": job['description'],
                            "relevance_score": round(score * 100, 1),
                            "reason": f"Matches {', '.join(skill_names[:3])} skills",
                            "salary": job.get('salary'),
                            "location": job.get('location'),
                            "apply_url": job.get('apply_url')
                        })
            
            recommendations.sort(key=lambda x: x['relevance_score'], reverse=True)
            
            return {
                "status": "success",
                "recommendations": recommendations[:10],
                "student_cgpa": cgpa,
                "suitable_levels": job_levels
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "recommendations": []
            }
    
    @staticmethod
    def _calculate_job_relevance(skills: List[str], cgpa: float, job: Dict, filters: Dict) -> float:
        """Calculate relevance score (0-1) for a job."""
        score = 0.0
        
        # Skill matching (50%)
        required_skills = job.get('required_skills', [])
        if required_skills:
            skill_matches = sum(1 for skill in required_skills if any(s in skill.lower() for s in skills))
            skill_score = (skill_matches / len(required_skills)) * 0.5
            score += skill_score
        
        # CGPA matching (30%)
        min_cgpa = job.get('min_cgpa', 6.0)
        if cgpa >= min_cgpa:
            cgpa_score = min(0.3, (cgpa - min_cgpa) / 2 * 0.3)
            score += cgpa_score
        
        # Job level matching (20%)
        job_level = job.get('level', 'fresher')
        if job_level in ['fresher', 'junior'] and cgpa < 7.5:
            score += 0.2
        elif job_level in ['mid'] and cgpa >= 7.5:
            score += 0.2
        elif job_level in ['senior'] and cgpa >= 8.5:
            score += 0.2
        
        # Apply filters if provided
        if filters.get('location') and job.get('location') != filters['location']:
            score *= 0.8
        
        return min(1.0, max(0.0, score))
    
    @staticmethod
    def _get_mock_jobs() -> List[Dict[str, Any]]:
        """Return mock job listings for demo."""
        return [
            {
                "id": 1,
                "title": "Junior Software Engineer",
                "company": "TechCorp India",
                "description": "Develop web applications using Python and React",
                "required_skills": ["python", "javascript", "react", "database"],
                "min_cgpa": 6.5,
                "level": "junior",
                "location": "Bangalore",
                "salary": "₹6-8 LPA",
                "apply_url": "https://example.com/apply/1"
            },
            {
                "id": 2,
                "title": "Data Scientist",
                "company": "DataFlow Systems",
                "description": "Build ML models and analyze large datasets",
                "required_skills": ["python", "machine learning", "statistics", "sql"],
                "min_cgpa": 7.5,
                "level": "mid",
                "location": "Mumbai",
                "salary": "₹12-15 LPA",
                "apply_url": "https://example.com/apply/2"
            },
            {
                "id": 3,
                "title": "QA Engineer",
                "company": "QualityFirst",
                "description": "Test automation and quality assurance",
                "required_skills": ["testing", "automation", "python"],
                "min_cgpa": 6.0,
                "level": "fresher",
                "location": "Hyderabad",
                "salary": "₹5-6.5 LPA",
                "apply_url": "https://example.com/apply/3"
            },
            {
                "id": 4,
                "title": "Frontend Developer",
                "company": "WebDynamics",
                "description": "Create responsive UI with React and Tailwind",
                "required_skills": ["javascript", "react", "html", "css"],
                "min_cgpa": 6.8,
                "level": "junior",
                "location": "Delhi",
                "salary": "₹7-9 LPA",
                "apply_url": "https://example.com/apply/4"
            },
            {
                "id": 5,
                "title": "DevOps Engineer",
                "company": "CloudNative Inc",
                "description": "Infrastructure automation and CI/CD pipelines",
                "required_skills": ["docker", "kubernetes", "ci/cd", "linux"],
                "min_cgpa": 7.2,
                "level": "mid",
                "location": "Pune",
                "salary": "₹10-13 LPA",
                "apply_url": "https://example.com/apply/5"
            },
            {
                "id": 6,
                "title": "Backend Engineer",
                "company": "APIHub Systems",
                "description": "Build scalable backend services and APIs",
                "required_skills": ["java", "databases", "microservices"],
                "min_cgpa": 7.0,
                "level": "junior",
                "location": "Remote",
                "salary": "₹8-10 LPA",
                "apply_url": "https://example.com/apply/6"
            }
        ]
    
    @staticmethod
    def apply_to_job(db: Session, student: Student, job_id: int) -> Dict[str, Any]:
        """
        Apply to a job on behalf of student.
        """
        try:
            # In production, store application in database
            return {
                "status": "success",
                "message": f"Application submitted for job {job_id}",
                "application_id": f"APP_{student.id}_{job_id}_{datetime.now().timestamp()}",
                "applied_at": datetime.now().isoformat(),
                "tracking_url": f"https://campusiq.local/applications/{job_id}"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to apply: {str(e)}"
            }
    
    @staticmethod
    def get_job_statistics(db: Session) -> Dict[str, Any]:
        """Get overall job portal statistics."""
        mock_jobs = JobPortalService._get_mock_jobs()
        
        levels = {}
        companies = {}
        locations = {}
        
        for job in mock_jobs:
            levels[job['level']] = levels.get(job['level'], 0) + 1
            companies[job['company']] = companies.get(job['company'], 0) + 1
            locations[job['location']] = locations.get(job['location'], 0) + 1
        
        return {
            "status": "success",
            "total_jobs": len(mock_jobs),
            "jobs_by_level": levels,
            "jobs_by_company": companies,
            "jobs_by_location": locations,
            "top_companies": sorted(companies.items(), key=lambda x: x[1], reverse=True)[:5],
            "salary_range": {
                "min": "₹5 LPA",
                "max": "₹15 LPA",
                "average": "₹9 LPA"
            }
        }
