"""
Seed the database with demo data for all roles.
Runs automatically on application startup if DB is empty.
"""
from datetime import date, datetime
from sqlalchemy.orm import Session
from app.models import (
    User, Department, Faculty, Student, Subject,
    Skill, StudentSkill, Attendance, Marks, Placement, Internship, Notice,
    AptitudeQuestion, AptitudeTest, AptitudeTestQuestion
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

APTITUDE_QUESTIONS = [
    {
        "category": "Quantitative Aptitude",
        "topic": "Percentages",
        "difficulty": "easy",
        "question_text": "A number is increased by 20% and then decreased by 20%. What is the net percentage change?",
        "options": ["No change", "4% decrease", "4% increase", "2% decrease"],
        "correct_option": 1,
        "explanation": "Using 100 as the base: 100 -> 120 -> 96, so the net change is a 4% decrease.",
    },
    {
        "category": "Quantitative Aptitude",
        "topic": "Percentages",
        "difficulty": "easy",
        "question_text": "If 35% of a number is 140, what is the number?",
        "options": ["350", "375", "400", "420"],
        "correct_option": 2,
        "explanation": "Number = 140 / 0.35 = 400.",
    },
    {
        "category": "Quantitative Aptitude",
        "topic": "Time and Work",
        "difficulty": "medium",
        "question_text": "A can complete a work in 12 days and B in 18 days. Together, how many days will they take?",
        "options": ["6.5 days", "7.2 days", "8 days", "9 days"],
        "correct_option": 1,
        "explanation": "Combined work per day = 1/12 + 1/18 = 5/36, so time = 36/5 = 7.2 days.",
    },
    {
        "category": "Quantitative Aptitude",
        "topic": "Profit and Loss",
        "difficulty": "medium",
        "question_text": "An item is sold for Rs. 920 at a loss of 8%. What was its cost price?",
        "options": ["Rs. 960", "Rs. 1000", "Rs. 1040", "Rs. 1120"],
        "correct_option": 1,
        "explanation": "Selling price is 92% of cost price, so cost price = 920 / 0.92 = 1000.",
    },
    {
        "category": "Quantitative Aptitude",
        "topic": "Ratios",
        "difficulty": "easy",
        "question_text": "The ratio of boys to girls in a class is 3:2. If there are 45 students, how many girls are there?",
        "options": ["15", "18", "20", "27"],
        "correct_option": 1,
        "explanation": "Total parts = 5. Girls = 2/5 of 45 = 18.",
    },
    {
        "category": "Quantitative Aptitude",
        "topic": "Averages",
        "difficulty": "easy",
        "question_text": "The average of five numbers is 24. If one number is removed, the average becomes 22. What is the removed number?",
        "options": ["28", "30", "32", "34"],
        "correct_option": 2,
        "explanation": "Original sum = 5 x 24 = 120. New sum = 4 x 22 = 88. Removed number = 32.",
    },
    {
        "category": "Logical Reasoning",
        "topic": "Number Series",
        "difficulty": "easy",
        "question_text": "Find the next number in the series: 2, 6, 12, 20, 30, ?",
        "options": ["40", "42", "44", "46"],
        "correct_option": 1,
        "explanation": "Differences are 4, 6, 8, 10, so the next difference is 12. Answer = 42.",
    },
    {
        "category": "Logical Reasoning",
        "topic": "Coding-Decoding",
        "difficulty": "medium",
        "question_text": "If CAMP is coded as DBNQ, how is TEST coded?",
        "options": ["UFTU", "UDTU", "UFSU", "VFTU"],
        "correct_option": 0,
        "explanation": "Each letter is shifted one position forward: T->U, E->F, S->T, T->U.",
    },
    {
        "category": "Logical Reasoning",
        "topic": "Directions",
        "difficulty": "medium",
        "question_text": "A person walks 5 km north, turns right and walks 3 km, then turns right and walks 5 km. How far is the person from the start?",
        "options": ["2 km", "3 km", "5 km", "8 km"],
        "correct_option": 1,
        "explanation": "The north and south movements cancel out. The person is 3 km east of the start.",
    },
    {
        "category": "Logical Reasoning",
        "topic": "Blood Relations",
        "difficulty": "easy",
        "question_text": "Pointing to a woman, Ravi said, 'She is the daughter of my mother's only son.' How is the woman related to Ravi?",
        "options": ["Sister", "Daughter", "Niece", "Cousin"],
        "correct_option": 1,
        "explanation": "Ravi's mother's only son is Ravi. The woman is Ravi's daughter.",
    },
    {
        "category": "Logical Reasoning",
        "topic": "Syllogisms",
        "difficulty": "medium",
        "question_text": "All engineers are graduates. Some graduates are artists. Which conclusion definitely follows?",
        "options": ["All engineers are artists", "Some engineers are artists", "All engineers are graduates", "No artists are engineers"],
        "correct_option": 2,
        "explanation": "The first statement directly guarantees that all engineers are graduates.",
    },
    {
        "category": "Logical Reasoning",
        "topic": "Seating Arrangement",
        "difficulty": "medium",
        "question_text": "A, B, C, and D sit in a row. B is to the right of A. C is to the left of D. A is leftmost. Which person can be second from the left?",
        "options": ["Only B", "Only C", "Either B or C", "Only D"],
        "correct_option": 2,
        "explanation": "A must be first. B must be right of A, and C must be left of D, so either B or C can be second depending on order.",
    },
    {
        "category": "Verbal Ability",
        "topic": "Grammar",
        "difficulty": "easy",
        "question_text": "Choose the correct sentence.",
        "options": ["She don't like tea.", "She doesn't likes tea.", "She doesn't like tea.", "She not like tea."],
        "correct_option": 2,
        "explanation": "With 'doesn't', the base verb 'like' is used.",
    },
    {
        "category": "Verbal Ability",
        "topic": "Synonyms",
        "difficulty": "easy",
        "question_text": "Choose the synonym of 'abundant'.",
        "options": ["Scarce", "Plentiful", "Weak", "Tiny"],
        "correct_option": 1,
        "explanation": "'Abundant' means available in large quantity, which is closest to 'plentiful'.",
    },
    {
        "category": "Verbal Ability",
        "topic": "Antonyms",
        "difficulty": "easy",
        "question_text": "Choose the antonym of 'expand'.",
        "options": ["Extend", "Grow", "Contract", "Increase"],
        "correct_option": 2,
        "explanation": "The opposite of expand is contract.",
    },
    {
        "category": "Verbal Ability",
        "topic": "Sentence Correction",
        "difficulty": "medium",
        "question_text": "Identify the correct phrase: 'Neither of the answers ___ correct.'",
        "options": ["are", "were", "is", "have been"],
        "correct_option": 2,
        "explanation": "'Neither' is treated as singular here, so 'is' is correct.",
    },
    {
        "category": "Verbal Ability",
        "topic": "Reading Comprehension",
        "difficulty": "medium",
        "question_text": "A passage says a product is 'cost-effective but not premium'. What does this imply?",
        "options": ["It is expensive and luxurious", "It gives value for money but may lack high-end features", "It is not useful", "It is only for experts"],
        "correct_option": 1,
        "explanation": "Cost-effective means good value. Not premium means it may not include high-end features.",
    },
    {
        "category": "Technical Aptitude",
        "topic": "Programming Logic",
        "difficulty": "easy",
        "question_text": "What is the output of 5 % 2 in most programming languages?",
        "options": ["0", "1", "2", "2.5"],
        "correct_option": 1,
        "explanation": "The modulo operator returns the remainder. 5 divided by 2 leaves remainder 1.",
    },
    {
        "category": "Technical Aptitude",
        "topic": "Data Structures",
        "difficulty": "medium",
        "question_text": "Which data structure follows FIFO order?",
        "options": ["Stack", "Queue", "Tree", "Graph"],
        "correct_option": 1,
        "explanation": "A queue follows First In, First Out order.",
    },
    {
        "category": "Technical Aptitude",
        "topic": "Databases",
        "difficulty": "medium",
        "question_text": "Which SQL clause is used to filter grouped records?",
        "options": ["WHERE", "HAVING", "ORDER BY", "LIMIT"],
        "correct_option": 1,
        "explanation": "HAVING filters groups after GROUP BY; WHERE filters rows before grouping.",
    },
    {
        "category": "Technical Aptitude",
        "topic": "Algorithms",
        "difficulty": "medium",
        "question_text": "Binary search on a sorted array of 1024 elements needs at most how many comparisons?",
        "options": ["8", "9", "10", "1024"],
        "correct_option": 2,
        "explanation": "1024 is 2^10, so binary search takes at most 10 comparisons in the ideal halving model.",
    },
]

APTITUDE_TESTS = [
    {
        "title": "Placement Aptitude Starter Mock",
        "description": "A balanced mock covering quant, reasoning, verbal and technical basics.",
        "category": "Mixed Aptitude",
        "difficulty": "easy",
        "duration_minutes": 18,
        "topics": ["Percentages", "Ratios", "Number Series", "Blood Relations", "Grammar", "Synonyms", "Programming Logic", "Data Structures"],
    },
    {
        "title": "Quantitative Aptitude Sprint",
        "description": "Quick practice for arithmetic questions commonly seen in campus hiring rounds.",
        "category": "Quantitative Aptitude",
        "difficulty": "medium",
        "duration_minutes": 15,
        "topics": ["Percentages", "Time and Work", "Profit and Loss", "Ratios", "Averages"],
    },
    {
        "title": "Reasoning and Verbal Interview Drill",
        "description": "Reasoning and language questions to improve accuracy before interviews.",
        "category": "Reasoning and Verbal",
        "difficulty": "medium",
        "duration_minutes": 16,
        "topics": ["Coding-Decoding", "Directions", "Syllogisms", "Seating Arrangement", "Grammar", "Antonyms", "Sentence Correction", "Reading Comprehension"],
    },
]


def seed_aptitude_data(db: Session):
    """Seed aptitude questions/tests independently of the main demo data."""
    if db.query(AptitudeQuestion).count() == 0:
        question_objs = []
        for item in APTITUDE_QUESTIONS:
            question = AptitudeQuestion(**item)
            db.add(question)
            question_objs.append(question)
        db.flush()
    else:
        question_objs = db.query(AptitudeQuestion).filter(AptitudeQuestion.is_active == True).all()

    if db.query(AptitudeTest).count() > 0:
        db.commit()
        return

    questions_by_topic = {}
    for question in question_objs:
        questions_by_topic.setdefault(question.topic, []).append(question)

    admin_user = db.query(User).filter(User.role == "super_admin").first()
    for item in APTITUDE_TESTS:
        test = AptitudeTest(
            title=item["title"],
            description=item["description"],
            category=item["category"],
            difficulty=item["difficulty"],
            duration_minutes=item["duration_minutes"],
            is_published=True,
            created_by=admin_user.id if admin_user else None,
        )
        db.add(test)
        db.flush()

        selected_questions = []
        for topic in item["topics"]:
            selected_questions.extend(questions_by_topic.get(topic, [])[:1])

        for index, question in enumerate(selected_questions):
            db.add(AptitudeTestQuestion(
                test_id=test.id,
                question_id=question.id,
                sort_order=index,
            ))

    db.commit()


def seed_database(db: Session):
    """Seed demo data if the database is empty."""
    # Check if already seeded
    if db.query(User).count() > 0:
        seed_aptitude_data(db)
        return

    print("Seeding demo data...")

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

    seed_aptitude_data(db)
    db.commit()
    print("Demo data seeded successfully.")
    print("   Admin: admin@campusiq.edu / Admin@123")
    print("   HOD:   hod.cse@campusiq.edu / Faculty@123")
    print("   Faculty: faculty.cs1@campusiq.edu / Faculty@123")
    print("   Student: student1@campusiq.edu / Student@123")
