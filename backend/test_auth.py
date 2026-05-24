#!/usr/bin/env python
from app.database import SessionLocal
from app.models import User
from app.core.security import verify_password

db = SessionLocal()
try:
    admin = db.query(User).filter(User.email == 'admin@campusiq.edu').first()
    if admin:
        print(f"✅ Admin found: {admin.email}")
        print(f"   Role: {admin.role}")
        print(f"   Active: {admin.is_active}")
        print(f"   Has hashed_password: {bool(admin.hashed_password)}")
        
        # Test password verification
        test_password = "Admin@123"
        is_valid = verify_password(test_password, admin.hashed_password)
        print(f"   Password verification: {is_valid}")
        
        # Check relationships
        print(f"   Has faculty: {admin.faculty is not None}")
        print(f"   Has student: {admin.student is not None}")
    else:
        print("❌ Admin not found")
finally:
    db.close()
