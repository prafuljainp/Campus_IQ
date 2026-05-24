# CampusIQ

CampusIQ is a full-stack college ERP and placement intelligence platform for managing academics, placements, student performance, and interview preparation from one role-based portal.

The system includes a FastAPI backend, a React/Vite frontend, JWT authentication, seeded demo data, analytics dashboards, AI-assisted student insights, and an aptitude preparation module for campus interview readiness.

## Highlights

- Role-based access for super admin, HOD, faculty, and students
- Student, faculty, department, subject, attendance, marks, notice, and placement management
- Academic analytics, placement analytics, student success insights, and activity logs
- AI-assisted analysis for placement readiness, skill gaps, recommendations, and student health scores
- Job portal, notifications, alumni/mentor, and enterprise-oriented modules
- Aptitude preparation with timed tests, scoring, explanations, topic analysis, and staff-managed question banks
- Local development setup using SQLite, FastAPI, Vite, and seeded demo users

## Tech Stack

Backend:
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- SQLite for local development
- JWT authentication

Frontend:
- React
- Vite
- Tailwind CSS
- Axios
- Zustand
- Recharts
- Lucide React

## Project Structure

```text
campusiq/
  backend/
    app/
      core/              # settings, auth helpers, dependencies
      models/            # SQLAlchemy models
      routers/           # API routes
      schemas/           # Pydantic schemas
      services/          # AI, analytics, notification, and domain services
      database.py
      main.py
      seed.py
    requirements.txt
    runtime.txt
  frontend/
    src/
      api/               # Axios client and API service wrappers
      components/        # shared layout, UI, analytics, AI dashboard components
      context/           # auth state
      pages/             # application pages
    package.json
    vite.config.js
  scripts/
    start-dev.ps1        # starts backend and frontend for local development
  verify_setup.py        # local setup verification helper
```

## Core Modules

Academic management:
- Student profiles and eligibility data
- Faculty and department management
- Subject management
- Attendance tracking
- Marks and CGPA-related workflows
- Notices and activity logs

Placement and intelligence:
- Placement record management
- Job portal views
- Student success dashboard
- AI analysis and AI insights
- Placement readiness and recommendations
- Advanced analytics dashboards

Aptitude preparation:
- Student test dashboard
- Timed practice tests
- Attempt submission and scoring
- Answer review with explanations
- Topic-wise performance breakdown
- Staff question bank management
- Test publishing/unpublishing
- Attempt analytics for staff

## Requirements

- Python 3.9 or newer
- Node.js 20 or newer
- npm
- Git

## Backend Setup

Windows PowerShell:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

macOS/Linux:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend URLs:
- API: http://127.0.0.1:8000
- Health check: http://127.0.0.1:8000/api/health
- API docs: http://127.0.0.1:8000/api/docs

## Frontend Setup

Windows PowerShell:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Frontend URL:
- App: http://localhost:5173

If `npm run dev` fails with `spawn C:\Program Files\dotnet ENOENT`, fix the current terminal and start Vite again:

```powershell
$env:ComSpec = "$env:WINDIR\System32\cmd.exe"
npm run dev
```

## One-Command Local Start

After installing backend and frontend dependencies, run from the repository root:

```powershell
.\scripts\start-dev.ps1
```

This starts the backend on `http://127.0.0.1:8000` and the frontend on `http://localhost:5173`.

## Environment Files

Backend:
- Copy `backend/.env.example` to `backend/.env`
- Keep `SECRET_KEY` private
- Use `DATABASE_URL=sqlite:///./campusiq.db` for local development
- Set `FRONTEND_URL=http://localhost:5173` for the local Vite app

Frontend:
- Copy `frontend/.env.example` to `frontend/.env`
- Leave `VITE_API_URL` empty for local proxy-based development
- Set `VITE_API_URL` only when pointing the frontend to a custom backend URL

## Demo Logins

Seed data is created on first backend startup.

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | admin@campusiq.edu | Admin@123 |
| HOD | hod.cse@campusiq.edu | Faculty@123 |
| Faculty | faculty.cs1@campusiq.edu | Faculty@123 |
| Student | student1@campusiq.edu | Student@123 |

## Useful API Areas

Common backend route groups:
- `/api/auth`
- `/api/students`
- `/api/faculty`
- `/api/departments`
- `/api/subjects`
- `/api/attendance`
- `/api/marks`
- `/api/placements`
- `/api/notices`
- `/api/analytics`
- `/api/aptitude`

Use the generated docs at `http://127.0.0.1:8000/api/docs` for the complete request and response shapes.

## Aptitude Module Flow

Student flow:
1. Open Aptitude Prep from the sidebar.
2. Select an available published test.
3. Attend the timed test.
4. Submit answers.
5. Review score, accuracy, correct answers, explanations, and topic performance.

Staff flow:
1. Add aptitude questions with options, answer keys, topic, difficulty, and explanations.
2. Create tests from the question bank.
3. Publish tests when ready for students.
4. Review attempt analytics and weak-topic trends.
5. Update, unpublish, or archive content as needed.

## Verification

Backend syntax check:

```powershell
cd backend
.\venv\Scripts\python.exe -m compileall app
```

Frontend production build:

```powershell
cd frontend
$env:ComSpec = "$env:WINDIR\System32\cmd.exe"
npm run build
```

If npm shell execution is broken, run Vite directly:

```powershell
node node_modules\vite\bin\vite.js build
```

Optional setup helper:

```powershell
python verify_setup.py
```

## Troubleshooting

Port `8000` is blocked or already in use:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

Frontend cannot reach backend:
- Confirm the backend is running.
- Confirm `frontend/.env` does not point to an incorrect `VITE_API_URL`.
- Open `http://127.0.0.1:8000/api/health` in the browser.

Database looks stale:
- Stop the backend.
- Delete the local SQLite files only if you are comfortable losing local demo data.
- Start the backend again so seed data can be recreated.

Authentication fails for demo users:
- Confirm the backend startup completed without errors.
- Confirm the local database was seeded.
- Try the demo credentials from the table above.

## Repository Hygiene

Do not commit generated or local runtime files:
- `node_modules/`
- `venv/`
- `__pycache__/`
- `dist/`
- local `.env` files
- local SQLite database files
- log files

Keep these tracked:
- `.env.example`
- `requirements.txt`
- `package.json`
- `package-lock.json`
- source code
- `README.md`

## Git Workflow

Professional workflow before pushing:

```powershell
git status
git diff
git diff --cached --stat
git add .
git commit -m "Describe the change clearly"
git pull --rebase origin main
git push origin main
```

For this project, avoid committing dependency folders or generated build output. Install dependencies locally with `pip install -r requirements.txt` and `npm install` instead.
