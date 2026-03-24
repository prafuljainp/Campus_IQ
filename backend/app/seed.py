"""
Seed the database with demo data for all roles.
Runs automatically on application startup if DB is empty.
"""
from datetime import date, datetime
from sqlalchemy.orm import Session
from app.models import (
    User, Department, Faculty, Student, Subject,
    Skill, StudentSkill, Attendance, Marks, Placement, Internship, Notice
)
from app.core.security import get_password_hash
import random


SKILLS_DATA = [
    ("Python", "Programming"), ("Java", "Programming"), ("JavaScript", "Programming"),
    ("React", "Frontend"), ("Node.js", "Backend"), ("SQL", "Database"),
    ("Machine Learning", "AI/ML"), ("Data Science", "AI/ML"), ("Docker", "DevOps"),
    ("AWS", "Cloud"), ("Git", "Tools"), ("Communication", "Soft Skills"),
    ("Leadership", "Soft Skills"), ("Problem Solving", "Soft Skills"),
    ("C++", "Programming"), ("Kotlin", "Mobile"), ("Flutter", "Mobile"),
]

COMPANIES = [
    ("Google", "SWE", 28.0), ("Microsoft", "SDE", 26.5), ("Amazon", "SDE-I", 22.0),
    ("Infosys", "Systems Engineer", 3.6), ("TCS", "Software Developer", 3.36),
    ("Wipro", "Project Engineer", 3.5), ("Flipkart", "SDE", 18.0),
    ("Accenture", "Associate", 4.5), ("IBM", "Junior Developer", 4.2),
    ("Cognizant", "Programmer Analyst", 4.0),
]


def seed_database(db: Session):
    """Seed demo data if the database is empty."""
    # Check if already seeded
    if db.query(User).count() > 0:
        return

    print("🌱 Seeding demo data...")

    # ── Skills ──────────────────────────────────────────────────────────────
    skills = []
    for name, category in SKILLS_DATA:
        skill = Skill(name=name, category=category)
        db.add(skill)
        skills.append(skill)
    db.flush()

    # ── Super Admin ──────────────────────────────────────────────────────────
    admin_user = User(
        email="admin@campusiq.edu",
        hashed_password=get_password_hash("Admin@123"),
        role="super_admin",
        is_active=True
    )
    db.add(admin_user)
    db.flush()

    # ── Departments ──────────────────────────────────────────────────────────
    dept_data = [
        ("Computer Science & Engineering", "CSE"),
        ("Electronics & Communication", "ECE"),
        ("Mechanical Engineering", "ME"),
        ("Information Science", "IS"),
        ("Civil Engineering", "CE"),
    ]
    departments = []
    for name, code in dept_data:
        dept = Department(name=name, code=code)
        db.add(dept)
        departments.append(dept)
    db.flush()

    # ── Faculty ──────────────────────────────────────────────────────────────
    faculty_list = []
    faculty_info = [
        ("Dr. Rajesh Kumar", "hod.cse@campusiq.edu", "HOD", "hod", departments[0]),
        ("Dr. Priya Sharma", "hod.ece@campusiq.edu", "HOD", "hod", departments[1]),
        ("Prof. Amit Singh", "faculty.cs1@campusiq.edu", "Assistant Professor", "faculty", departments[0]),
        ("Prof. Meera Nair", "faculty.cs2@campusiq.edu", "Assistant Professor", "faculty", departments[0]),
        ("Prof. Suresh Babu", "faculty.ece1@campusiq.edu", "Associate Professor", "faculty", departments[1]),
        ("Prof. Deepa Rao", "faculty.is1@campusiq.edu", "Assistant Professor", "faculty", departments[3]),
    ]

    for name, email, designation, role, dept in faculty_info:
        user = User(
            email=email,
            hashed_password=get_password_hash("Faculty@123"),
            role=role,
            is_active=True
        )
        db.add(user)
        db.flush()

        fac = Faculty(
            user_id=user.id,
            name=name,
            email=email,
            department_id=dept.id,
            designation=designation,
            qualification="Ph.D" if "Dr." in name else "M.Tech",
            experience_years=random.randint(3, 20)
        )
        db.add(fac)
        db.flush()
        faculty_list.append(fac)

    # Set HODs
    departments[0].hod_id = faculty_list[0].id
    departments[1].hod_id = faculty_list[1].id

    # ── Subjects ─────────────────────────────────────────────────────────────
    subjects_data = [
        ("Data Structures", "CS301", 4, 3, departments[0], faculty_list[2]),
        ("Algorithms", "CS302", 4, 3, departments[0], faculty_list[2]),
        ("Database Systems", "CS401", 3, 4, departments[0], faculty_list[3]),
        ("Operating Systems", "CS402", 4, 4, departments[0], faculty_list[3]),
        ("Machine Learning", "CS501", 4, 5, departments[0], faculty_list[2]),
        ("Digital Electronics", "EC301", 4, 3, departments[1], faculty_list[4]),
        ("Signal Processing", "EC401", 3, 4, departments[1], faculty_list[4]),
        ("Web Technologies", "IS301", 3, 3, departments[3], faculty_list[5]),
    ]
    subject_objs = []
    for name, code, credits, sem, dept, fac in subjects_data:
        subj = Subject(
            name=name, code=code, credits=credits,
            semester=sem, department_id=dept.id, faculty_id=fac.id
        )
        db.add(subj)
        subject_objs.append(subj)
    db.flush()

    # ── Students ─────────────────────────────────────────────────────────────
    student_names = [
        "Arjun Sharma", "Priya Patel", "Rohit Kumar", "Sneha Reddy", "Vikram Singh",
        "Divya Nair", "Aditya Gupta", "Pooja Mehta", "Rahul Verma", "Ananya Krishnan",
        "Kiran Bhat", "Sanjay Rao", "Deepika Iyer", "Akash Joshi", "Kavya Menon",
        "Nikhil Sharma", "Riya Desai", "Suraj Patil", "Meghana Gowda", "Harish Babu",
        "Shreya Pillai", "Mohit Agarwal", "Lakshmi Narayanan", "Gautam Kaur", "Tanvi Shah",
    ]

    students = []
    usn_counter = {"CSE": 1, "ECE": 1, "IS": 1}
    departments_cycle = [departments[0]] * 12 + [departments[1]] * 8 + [departments[3]] * 5

    for i, (name, dept) in enumerate(zip(student_names, departments_cycle)):
        dept_code = dept.code
        counter_key = dept_code if dept_code in usn_counter else "CSE"
        usn = f"1RV{21 + (i // 10):02d}{dept_code}{usn_counter.get(counter_key, i+1):03d}"
        usn_counter[counter_key] = usn_counter.get(counter_key, 0) + 1

        email = f"student{i+1}@campusiq.edu"
        user = User(
            email=email,
            hashed_password=get_password_hash("Student@123"),
            role="student",
            is_active=True
        )
        db.add(user)
        db.flush()

        cgpa = round(random.uniform(5.5, 9.8), 2)
        backlogs = 0 if cgpa > 7.0 else random.randint(0, 3)

        student = Student(
            user_id=user.id,
            name=name,
            usn=usn,
            email=email,
            phone=f"9{random.randint(100000000, 999999999)}",
            gender=random.choice(["male", "female"]),
            date_of_birth=date(2001 + random.randint(0, 2), random.randint(1, 12), random.randint(1, 28)),
            blood_group=random.choice(["A+", "B+", "O+", "AB+", "A-", "B-"]),
            father_name=f"Mr. {name.split()[1]} Sr.",
            mother_name=f"Mrs. Lakshmi {name.split()[1]}",
            parent_phone=f"9{random.randint(100000000, 999999999)}",
            address=f"{random.randint(1, 999)}, MG Road",
            city=random.choice(["Bangalore", "Mysore", "Hubli", "Mangalore"]),
            state="Karnataka",
            pincode=f"5{random.randint(60000, 99999)}",
            department_id=dept.id,
            semester=random.choice([3, 4, 5, 6, 7]),
            section=random.choice(["A", "B", "C"]),
            admission_year=2021 + random.randint(0, 2),
            cgpa=cgpa,
            sgpa=round(cgpa + random.uniform(-0.5, 0.5), 2),
            backlog_count=backlogs,
            github=f"https://github.com/{name.replace(' ', '').lower()}",
            linkedin=f"https://linkedin.com/in/{name.replace(' ', '-').lower()}",
        )
        db.add(student)
        db.flush()
        students.append(student)

        # Add random skills
        skill_sample = random.sample(skills, random.randint(2, 6))
        for skill in skill_sample:
            ss = StudentSkill(
                student_id=student.id,
                skill_id=skill.id,
                level=random.choice(["beginner", "intermediate", "advanced"])
            )
            db.add(ss)

    db.flush()

    # ── Marks ─────────────────────────────────────────────────────────────────
    grade_map = [
        (90, "O", 10), (80, "A+", 9), (70, "A", 8),
        (60, "B+", 7), (50, "B", 6), (45, "C", 5), (0, "F", 0)
    ]

    for student in students:
        relevant_subjects = [s for s in subject_objs if s.department_id == student.department_id]
        for subj in relevant_subjects[:4]:
            internal = round(random.uniform(25, 50), 1)
            external = round(random.uniform(30, 70), 1)
            total = internal + external
            grade, gp = "F", 0
            for threshold, g, gpts in grade_map:
                if total >= threshold:
                    grade, gp = g, gpts
                    break
            marks = Marks(
                student_id=student.id,
                subject_id=subj.id,
                semester=student.semester,
                internal_marks=internal,
                external_marks=external,
                total_marks=total,
                grade=grade,
                grade_points=gp,
                is_pass=(total >= 40)
            )
            db.add(marks)

    # ── Placements ────────────────────────────────────────────────────────────
    placed_students = random.sample(students, min(15, len(students)))
    for student in placed_students:
        company, role, pkg = random.choice(COMPANIES)
        placement = Placement(
            student_id=student.id,
            company=company,
            role=role,
            package_lpa=pkg,
            placement_date=date(2024, random.randint(1, 12), random.randint(1, 28)),
            location=random.choice(["Bangalore", "Hyderabad", "Pune", "Chennai", "Mumbai"]),
            is_confirmed=True
        )
        db.add(placement)

    # ── Internships ───────────────────────────────────────────────────────────
    intern_students = random.sample(students, min(18, len(students)))
    for student in intern_students:
        internship = Internship(
            student_id=student.id,
            company=random.choice(["Infosys BPM", "Wipro Technologies", "Tata Elxsi", "Bosch", "Siemens"]),
            role=random.choice(["Intern", "Tech Intern", "Research Intern", "Data Analyst Intern"]),
            duration_months=random.randint(1, 6),
            stipend=random.choice([5000, 8000, 10000, 15000, 20000]),
            start_date=date(2023, random.randint(5, 8), 1),
            end_date=date(2023, random.randint(9, 12), 30),
        )
        db.add(internship)

    # ── Notices ───────────────────────────────────────────────────────────────
    notices_data = [
        ("Placement Drive - Google", "Google will be conducting a placement drive on 15th March. All eligible students are requested to register.", None),
        ("Exam Schedule Released", "Semester examination schedule has been released. Check the official portal.", None),
        ("CSE Seminar on AI/ML", "Department of CSE is organizing a seminar on Artificial Intelligence and Machine Learning.", departments[0].id),
        ("Annual Tech Fest - TechVista 2024", "Register for the annual tech fest. Cash prizes and certificates for all winners.", None),
        ("Internship Opportunity at TCS", "TCS is offering internship opportunities for 5th semester students with CGPA above 7.0.", None),
    ]
    for title, content, dept_id in notices_data:
        notice = Notice(
            title=title,
            content=content,
            department_id=dept_id,
            created_by=admin_user.id,
            is_active=True
        )
        db.add(notice)

    db.commit()
    print("✅ Demo data seeded successfully!")
    print("   Admin: admin@campusiq.edu / Admin@123")
    print("   HOD:   hod.cse@campusiq.edu / Faculty@123")
    print("   Faculty: faculty.cs1@campusiq.edu / Faculty@123")
    print("   Student: student1@campusiq.edu / Student@123")
