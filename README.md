# 🎓 CampusIQ – AI Powered College ERP & Placement Intelligence System

A full-stack, production-ready College ERP system with AI-powered skill gap analysis, placement intelligence, attendance tracking, and comprehensive student management.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + SQLAlchemy + Pydantic |
| Auth | JWT + bcrypt |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Frontend | React 18 + Vite + Tailwind CSS |
| Charts | Recharts |
| State | Zustand |
| Deployment | Render (backend) + Vercel (frontend) |

---

## ✨ Features

### Core Modules
- **Multi-Role Auth** — Super Admin, HOD, Faculty, Student
- **Student Management** — Full CRUD with 20+ fields, search, filter, pagination
- **Faculty Management** — Department mapping, subject assignment
- **Department Management** — Stats, HOD assignment
- **Academic Records** — Marks entry, auto CGPA calculation, grade logic
- **Attendance System** — Mark/bulk, percentage, low-attendance alerts
- **Placement Tracker** — Company, role, package, CSV export
- **Internship Records** — Duration, stipend tracking
- **Notice Board** — Department-targeted announcements

### Advanced Features
- **🤖 AI Skill Gap Analyzer** — Recommends missing skills based on placement data
- **🎯 Career Advisor** — Rule-based career path recommendations
- **🏆 Student Ranking** — Leaderboard scored by CGPA + Skills + Internships
- **✅ Placement Eligibility Checker** — CGPA & backlog validation
- **🪪 Student ID Card Generator** — Printable ID with barcode
- **📊 Analytics Dashboard** — Recharts-powered: CGPA dist, dept performance, trends
- **📋 Activity Logs** — Full audit trail of all user actions
- **📥 Export** — CSV export for students and placements

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@campusiq.edu | Admin@123 |
| HOD (CSE) | hod.cse@campusiq.edu | Faculty@123 |
| Faculty | faculty.cs1@campusiq.edu | Faculty@123 |
| Student | student1@campusiq.edu | Student@123 |

---

## 🛠️ Local Development Setup

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Run the server
uvicorn app.main:app --reload --port 8000
```

The API will be at `http://localhost:8000`
API docs at `http://localhost:8000/api/docs`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create env file (for local dev with proxy it's not needed)
# For custom backend URL, create .env:
# VITE_API_URL=http://localhost:8000/api

# Run dev server
npm run dev
```

The app will be at `http://localhost:5173`

---

## 🌐 Deployment

### Backend → Render / Railway

1. Push the `backend/` folder to GitHub
2. On Render: **New Web Service** → connect repo
3. Set:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Runtime**: Python 3.11
4. Set Environment Variables:
   ```
   SECRET_KEY=<random-32-char-string>
   DATABASE_URL=postgresql://...  (use Render's PostgreSQL addon)
   FRONTEND_URL=https://your-app.vercel.app
   ENVIRONMENT=production
   ```

### Frontend → Vercel

1. Push the `frontend/` folder to GitHub
2. On Vercel: **New Project** → import repo → set root to `frontend/`
3. Set Environment Variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```
4. Deploy!

---

## 📁 Project Structure

```
campusiq/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py       # Settings (Pydantic)
│   │   │   ├── security.py     # JWT + bcrypt
│   │   │   └── dependencies.py # Auth guards
│   │   ├── models/
│   │   │   └── __init__.py     # All SQLAlchemy models
│   │   ├── schemas/
│   │   │   └── __init__.py     # Pydantic schemas
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── students.py
│   │   │   ├── faculty.py
│   │   │   ├── departments.py
│   │   │   ├── subjects.py
│   │   │   ├── marks.py
│   │   │   ├── attendance.py
│   │   │   ├── placements.py
│   │   │   ├── notices.py
│   │   │   ├── skills.py
│   │   │   ├── logs.py
│   │   │   └── analytics.py
│   │   ├── main.py             # FastAPI app + startup
│   │   ├── database.py         # DB engine + session
│   │   └── seed.py             # Demo data seeder
│   ├── requirements.txt
│   └── runtime.txt
│
└── frontend/
    └── src/
        ├── api/
        │   ├── client.js       # Axios + interceptors
        │   └── services.js     # All API calls
        ├── context/
        │   └── authStore.js    # Zustand auth state
        ├── components/
        │   ├── Layout.jsx      # Shell + header
        │   ├── Sidebar.jsx     # Nav + role filtering
        │   └── UI.jsx          # Shared components
        └── pages/
            ├── LoginPage.jsx
            ├── DashboardPage.jsx
            ├── StudentsPage.jsx
            ├── StudentProfilePage.jsx
            ├── FacultyPage.jsx
            ├── DepartmentsPage.jsx
            ├── PlacementsPage.jsx
            ├── AttendancePage.jsx
            ├── MarksPage.jsx
            ├── AnalyticsPage.jsx
            ├── NoticesPage.jsx  (+ RankingPage, ActivityLogsPage)
```

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| GET/POST | /api/students | List/Create students |
| GET/PUT/DELETE | /api/students/{id} | Student CRUD |
| GET | /api/students/ranking | Ranked leaderboard |
| GET | /api/students/eligibility/{id} | Placement eligibility |
| GET | /api/students/export/csv | CSV export |
| GET/POST | /api/faculty | Faculty CRUD |
| GET/POST | /api/departments | Department CRUD |
| GET/POST | /api/marks | Marks entry + CGPA auto-calc |
| GET/POST | /api/attendance | Attendance + percentage |
| GET/POST | /api/placements | Placement records |
| GET/POST | /api/notices | Notices |
| GET | /api/analytics/summary | Dashboard stats |
| GET | /api/analytics/skill-gap/{id} | AI skill gap analysis |
| GET | /api/logs | Activity audit logs |

---

## 🛡️ Role Permissions

| Feature | Admin | HOD | Faculty | Student |
|---------|-------|-----|---------|---------|
| All Students | ✅ | Dept only | ✅ | Own only |
| Create/Delete Students | ✅ | ✅ | ❌ | ❌ |
| Faculty Management | ✅ | ❌ | ❌ | ❌ |
| Departments | ✅ | ❌ | ❌ | ❌ |
| Enter Marks | ✅ | ✅ | ✅ | ❌ |
| Mark Attendance | ✅ | ✅ | ✅ | ❌ |
| Analytics | ✅ | ✅ | ✅ | ❌ |
| Activity Logs | ✅ | ❌ | ❌ | ❌ |

---

## 📝 License

MIT License — Built for educational purposes.
