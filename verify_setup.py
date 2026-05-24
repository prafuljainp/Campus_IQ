#!/usr/bin/env python3
"""Verify the local CampusIQ development setup."""

import os
import socket
import sys
from pathlib import Path


def print_result(label, ok, warning=False):
    status = "[OK]" if ok else ("[WARN]" if warning else "[MISSING]")
    print(f"{status} {label}")


def run_checks(title, checks, allow_warnings=None):
    allow_warnings = allow_warnings or set()
    print(f"\n{title}")
    print("=" * 50)

    passed = 0
    required_total = 0
    required_passed = 0

    for label, ok in checks.items():
        is_warning = label in allow_warnings
        print_result(label, ok, warning=is_warning)
        if ok:
            passed += 1
        if not is_warning:
            required_total += 1
            if ok:
                required_passed += 1

    print(f"\nPassed: {passed}/{len(checks)}")
    return required_passed == required_total


def check_backend():
    backend = Path("backend")
    services = [
        "ai_health_score_service.py",
        "ai_placement_service.py",
        "ai_recommendations_service.py",
        "ai_matching_service.py",
        "ai_analytics_service.py",
    ]
    routers = [
        "auth.py",
        "students.py",
        "attendance.py",
        "marks.py",
        "placements.py",
        "analytics.py",
        "aptitude.py",
        "ai_insights.py",
        "ai_analysis.py",
    ]

    checks = {
        "backend directory exists": backend.exists(),
        "backend/requirements.txt exists": (backend / "requirements.txt").exists(),
        "backend/.env exists": (backend / ".env").exists(),
        "backend/app/main.py exists": (backend / "app" / "main.py").exists(),
        "backend/app/database.py exists": (backend / "app" / "database.py").exists(),
        "backend/app/models/__init__.py exists": (backend / "app" / "models" / "__init__.py").exists(),
        "backend/app/schemas/__init__.py exists": (backend / "app" / "schemas" / "__init__.py").exists(),
    }

    for service in services:
        checks[f"backend/app/services/{service} exists"] = (backend / "app" / "services" / service).exists()

    for router in routers:
        checks[f"backend/app/routers/{router} exists"] = (backend / "app" / "routers" / router).exists()

    return run_checks("BACKEND VERIFICATION", checks)


def check_frontend():
    frontend = Path("frontend")
    pages = [
        "DashboardPage.jsx",
        "StudentsPage.jsx",
        "StudentProfilePage.jsx",
        "PlacementsPage.jsx",
        "AttendancePage.jsx",
        "MarksPage.jsx",
        "AnalyticsPage.jsx",
        "AptitudePage.jsx",
        "StudentSuccessPage.jsx",
        "JobPortalPage.jsx",
    ]
    components = [
        "Layout.jsx",
        "Sidebar.jsx",
        "UI.jsx",
        "AIIntelligenceDashboard.jsx",
        "AdvancedAnalyticsDashboard.jsx",
    ]

    checks = {
        "frontend directory exists": frontend.exists(),
        "frontend/package.json exists": (frontend / "package.json").exists(),
        "frontend/node_modules exists": (frontend / "node_modules").exists(),
        "frontend/.env exists": (frontend / ".env").exists(),
        "frontend/src/main.jsx exists": (frontend / "src" / "main.jsx").exists(),
        "frontend/src/App.jsx exists": (frontend / "src" / "App.jsx").exists(),
        "frontend/src/api/services.js exists": (frontend / "src" / "api" / "services.js").exists(),
    }

    for component in components:
        checks[f"frontend/src/components/{component} exists"] = (
            frontend / "src" / "components" / component
        ).exists()

    for page in pages:
        checks[f"frontend/src/pages/{page} exists"] = (frontend / "src" / "pages" / page).exists()

    optional = {"frontend/.env exists"}
    return run_checks("FRONTEND VERIFICATION", checks, allow_warnings=optional)


def check_documentation():
    checks = {
        "README.md exists": Path("README.md").exists(),
        "backend/.env.example exists": Path("backend/.env.example").exists(),
        "frontend/.env.example exists": Path("frontend/.env.example").exists(),
    }
    return run_checks("DOCUMENTATION VERIFICATION", checks)


def check_ports():
    print("\nPORT AVAILABILITY CHECK")
    print("=" * 50)

    ports = [
        (8000, "Backend API"),
        (5173, "Frontend dev server"),
    ]
    available = True

    for port, name in ports:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            result = sock.connect_ex(("127.0.0.1", port))

        if result == 0:
            print_result(f"Port {port} ({name}) is already in use", False, warning=True)
            available = False
        else:
            print_result(f"Port {port} ({name}) is available", True)

    return available


def main():
    os.chdir(Path(__file__).parent)

    print("\n" + "=" * 50)
    print("CAMPUSIQ STARTUP VERIFICATION")
    print("=" * 50)

    backend_ok = check_backend()
    frontend_ok = check_frontend()
    docs_ok = check_documentation()
    ports_ok = check_ports()

    print("\nOVERALL STATUS")
    print("=" * 50)

    if backend_ok and frontend_ok and docs_ok:
        print("[OK] Required project files are present.")
        if not ports_ok:
            print("[WARN] One or more dev ports are already in use. Stop the running service or use another port.")
        print("\nNext steps:")
        print("1. Start backend:  cd backend; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000")
        print("2. Start frontend: cd frontend; npm run dev")
        print("3. Open app:       http://localhost:5173")
        print("4. Open API docs:  http://127.0.0.1:8000/api/docs")
        return 0

    print("[MISSING] Setup is incomplete. Fix the missing items above, then run this script again.")
    print("See README.md for setup instructions.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
