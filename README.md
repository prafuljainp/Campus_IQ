# CampusIQ

CampusIQ is a full-stack college ERP and placement intelligence platform. It combines core academic management, analytics, placement support, student success insights, and aptitude preparation in one portal.

## Features

- Role-based login for super admin, HOD, faculty, and students
- Student, faculty, department, attendance, marks, notice, and placement modules
- Analytics dashboards for academic and placement performance
- AI-powered student success and placement readiness insights
- Job portal, notifications, alumni/mentor, and enterprise modules
- Aptitude preparation module with timed tests, scoring, explanations, staff question bank management, and attempt analytics

## Tech Stack

Backend:
- FastAPI
- SQLAlchemy
- SQLite for local development
- Pydantic
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
      core/
      models/
      routers/
      schemas/
      services/
      main.py
      seed.py
    requirements.txt
  frontend/
    src/
      api/
      components/
      context/
      pages/
    package.json
  scripts/
    start-dev.ps1
```

## Requirements

- Python 3.9 or newer
- Node.js 20 or newer
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

- Health: http://127.0.0.1:8000/api/health
- API docs: http://127.0.0.1:8000/api/docs

## Frontend Setup

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Frontend URL:

- App: http://localhost:5173

If `npm run dev` fails with `spawn C:\Program Files\dotnet ENOENT`, fix the current terminal:

```powershell
$env:ComSpec = "$env:WINDIR\System32\cmd.exe"
npm run dev
```

## One-Command Local Start

After installing backend and frontend dependencies:

```powershell
.\scripts\start-dev.ps1
```

## Demo Logins

Seed data is created on first backend startup.

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | admin@campusiq.edu | Admin@123 |
| HOD | hod.cse@campusiq.edu | Faculty@123 |
| Faculty | faculty.cs1@campusiq.edu | Faculty@123 |
| Student | student1@campusiq.edu | Student@123 |

## Aptitude Module

Students can:
- View available aptitude tests
- Take timed tests
- Submit answers
- Review score, topic breakdown, correct answers, and explanations

Staff can:
- Add, edit, and archive aptitude questions
- Create and update tests
- Publish or unpublish tests
- Review student attempt analytics
- Track weak topics and average performance

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
- this README

## Git Workflow

```powershell
git status
git diff
git add .
git commit -m "Add aptitude preparation module"
git push origin main
```

Review staged changes before committing:

```powershell
git diff --cached --stat
```
