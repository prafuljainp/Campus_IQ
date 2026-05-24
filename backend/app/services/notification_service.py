"""
Notification Service
Handles Email, SMS, and Push notifications
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from app.models import Student, User
from enum import Enum
import json

class NotificationType(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    IN_APP = "in_app"

class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class NotificationService:
    """Comprehensive notification service"""
    
    @staticmethod
    def send_email(
        recipient_email: str,
        subject: str,
        body: str,
        recipient_name: Optional[str] = None,
        html_body: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send email notification.
        In production, integrate with AWS SES, SendGrid, or mailgun.
        """
        try:
            # Mock email sending
            print(f"📧 Sending email to {recipient_email}: {subject}")
            
            return {
                "status": "success",
                "message_id": f"EMAIL_{datetime.now().timestamp()}",
                "type": "email",
                "recipient": recipient_email,
                "subject": subject,
                "sent_at": datetime.now().isoformat(),
                "delivery_status": "queued"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Email send failed: {str(e)}"
            }
    
    @staticmethod
    def send_sms(
        phone_number: str,
        message: str,
        recipient_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send SMS notification.
        In production, integrate with Twilio, AWS SNS, or local SMS provider.
        """
        try:
            # Mock SMS sending
            print(f"📱 Sending SMS to {phone_number}: {message}")
            
            return {
                "status": "success",
                "message_id": f"SMS_{datetime.now().timestamp()}",
                "type": "sms",
                "recipient": phone_number,
                "message": message[:160],  # SMS limit
                "sent_at": datetime.now().isoformat(),
                "delivery_status": "queued"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"SMS send failed: {str(e)}"
            }
    
    @staticmethod
    def send_push_notification(
        user_id: int,
        title: str,
        body: str,
        icon: Optional[str] = None,
        data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Send push notification.
        In production, integrate with Firebase Cloud Messaging (FCM).
        """
        try:
            print(f"🔔 Sending push to user {user_id}: {title}")
            
            return {
                "status": "success",
                "message_id": f"PUSH_{datetime.now().timestamp()}",
                "type": "push",
                "user_id": user_id,
                "title": title,
                "body": body,
                "icon": icon,
                "data": data or {},
                "sent_at": datetime.now().isoformat(),
                "delivery_status": "queued"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Push send failed: {str(e)}"
            }
    
    @staticmethod
    def send_in_app_notification(
        user_id: int,
        title: str,
        message: str,
        type: str = "info",
        action_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create in-app notification (stored in database).
        """
        try:
            # In production, save to notifications table
            return {
                "status": "success",
                "notification_id": f"INAPP_{datetime.now().timestamp()}",
                "user_id": user_id,
                "title": title,
                "message": message,
                "type": type,
                "action_url": action_url,
                "created_at": datetime.now().isoformat(),
                "read": False
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"In-app notification failed: {str(e)}"
            }
    
    @staticmethod
    def send_notification_batch(
        recipients: List[Dict],  # [{"user_id": 1, "email": "...", "phone": "..."}]
        subject: str,
        message: str,
        notification_types: List[str] = ["email", "push"],
        priority: str = "medium"
    ) -> Dict[str, Any]:
        """
        Send batch notifications to multiple recipients.
        """
        try:
            results = {
                "total": len(recipients),
                "sent": 0,
                "failed": 0,
                "results": []
            }
            
            for recipient in recipients:
                sent = False
                
                if "email" in notification_types and recipient.get("email"):
                    NotificationService.send_email(recipient["email"], subject, message)
                    sent = True
                
                if "sms" in notification_types and recipient.get("phone"):
                    NotificationService.send_sms(recipient["phone"], message)
                    sent = True
                
                if "push" in notification_types and recipient.get("user_id"):
                    NotificationService.send_push_notification(
                        recipient["user_id"],
                        subject,
                        message
                    )
                    sent = True
                
                results["results"].append({
                    "recipient": recipient.get("email") or recipient.get("phone"),
                    "sent": sent
                })
                
                if sent:
                    results["sent"] += 1
                else:
                    results["failed"] += 1
            
            return {
                "status": "success",
                "batch_id": f"BATCH_{datetime.now().timestamp()}",
                "results": results
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Batch notification failed: {str(e)}"
            }
    
    @staticmethod
    def send_academic_alerts(db: Session, student: Student) -> Dict[str, Any]:
        """Send academic alert notifications to student."""
        try:
            alerts = []
            
            # Low CGPA alert
            if student.cgpa and student.cgpa < 6.5:
                message = f"Your CGPA is {student.cgpa}. Consider academic counseling."
                NotificationService.send_email(
                    student.email_address or "",
                    "⚠️ Academic Alert: Low CGPA",
                    message
                )
                alerts.append("cgpa")
            
            # Attendance alert (mock)
            message = "Your attendance is below 75%. Attend classes regularly."
            NotificationService.send_sms(
                student.phone_number or "",
                "📚 " + message
            )
            alerts.append("attendance")
            
            # Backlog alert (mock)
            message = "You have pending backlogs. Clear them to improve graduation probability."
            NotificationService.send_in_app_notification(
                student.user_id or 1,
                "🔴 Backlog Alert",
                message,
                "warning"
            )
            alerts.append("backlog")
            
            return {
                "status": "success",
                "alerts_sent": alerts,
                "student_id": student.id,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
    
    @staticmethod
    def send_placement_notifications(db: Session, student: Student) -> Dict[str, Any]:
        """Send placement-related notifications."""
        try:
            notifications = []
            
            # Job matching notification
            NotificationService.send_push_notification(
                student.user_id or 1,
                "🎯 New Job Match",
                "A new job matching your skills is available!",
                "briefcase",
                {"action": "view_jobs"}
            )
            notifications.append("job_match")
            
            # Application status
            NotificationService.send_email(
                student.email_address or "",
                "📋 Application Update",
                "Your application status has been updated. Check your profile for details."
            )
            notifications.append("app_status")
            
            # Interview invitation (mock)
            NotificationService.send_sms(
                student.phone_number or "",
                "🎤 Interview scheduled for tomorrow at 10 AM. Confirm by replying."
            )
            notifications.append("interview")
            
            return {
                "status": "success",
                "notifications": notifications,
                "student_id": student.id
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
    
    @staticmethod
    def get_notification_preferences(user_id: int) -> Dict[str, Any]:
        """Get user notification preferences."""
        # In production, fetch from preferences table
        return {
            "user_id": user_id,
            "preferences": {
                "email": {
                    "enabled": True,
                    "academic_alerts": True,
                    "placement_updates": True,
                    "general": True
                },
                "sms": {
                    "enabled": True,
                    "urgent_only": False,
                    "attendance_alerts": True
                },
                "push": {
                    "enabled": True,
                    "frequency": "real-time"
                },
                "quiet_hours": {
                    "enabled": False,
                    "start": "22:00",
                    "end": "08:00"
                }
            }
        }
    
    @staticmethod
    def update_notification_preferences(user_id: int, preferences: Dict) -> Dict[str, Any]:
        """Update user notification preferences."""
        # In production, save to database
        return {
            "status": "success",
            "user_id": user_id,
            "preferences": preferences,
            "updated_at": datetime.now().isoformat()
        }
