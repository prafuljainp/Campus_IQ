"""Aptitude preparation API for student interview readiness."""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_user, get_user_dept, require_admin_hod_faculty
from app.database import get_db
from app.models import (
    ActivityLog,
    AptitudeAttempt,
    AptitudeAttemptAnswer,
    AptitudeQuestion,
    AptitudeTest,
    AptitudeTestQuestion,
    Student,
)
from app.schemas import (
    AptitudeAttemptSubmit,
    AptitudeQuestionCreate,
    AptitudeQuestionUpdate,
    AptitudeTestCreate,
    AptitudeTestUpdate,
)

router = APIRouter(prefix="/api/aptitude", tags=["Aptitude"])


def _student_or_403(user):
    if not user.student:
        raise HTTPException(status_code=403, detail="A student profile is required for aptitude attempts")
    return user.student


def _question_payload(question: AptitudeQuestion, include_answer: bool = False, selected_option=None):
    payload = {
        "id": question.id,
        "category": question.category,
        "topic": question.topic,
        "difficulty": question.difficulty,
        "question_text": question.question_text,
        "options": question.options or [],
        "is_active": question.is_active,
    }
    if include_answer:
        payload["correct_option"] = question.correct_option
        payload["explanation"] = question.explanation
        payload["selected_option"] = selected_option
        payload["is_correct"] = selected_option == question.correct_option
    return payload


def _attempt_summary(attempt: AptitudeAttempt | None):
    if not attempt:
        return None
    return {
        "id": attempt.id,
        "test_id": attempt.test_id,
        "test_title": attempt.test.title if attempt.test else None,
        "status": attempt.status,
        "started_at": attempt.started_at,
        "submitted_at": attempt.submitted_at,
        "score": round(attempt.score or 0, 2),
        "accuracy": round(attempt.accuracy or 0, 2),
        "correct_answers": attempt.correct_answers or 0,
        "total_questions": attempt.total_questions or 0,
        "duration_seconds": attempt.duration_seconds or 0,
        "recommendations": attempt.recommendations or [],
    }


def _staff_attempt_query(db: Session, user):
    q = (
        db.query(AptitudeAttempt)
        .options(
            joinedload(AptitudeAttempt.test),
            joinedload(AptitudeAttempt.student).joinedload(Student.department),
        )
        .join(Student, AptitudeAttempt.student_id == Student.id)
        .filter(AptitudeAttempt.status == "submitted")
    )
    if user.role in ("hod", "faculty"):
        dept_id = get_user_dept(user)
        if dept_id:
            q = q.filter(Student.department_id == dept_id)
    return q


def _staff_attempt_payload(attempt: AptitudeAttempt):
    student = attempt.student
    return {
        **_attempt_summary(attempt),
        "student_id": student.id if student else None,
        "student_name": student.name if student else None,
        "student_usn": student.usn if student else None,
        "department": student.department.name if student and student.department else None,
    }


def _test_summary(db: Session, test: AptitudeTest, student_id: int | None = None):
    last_attempt = None
    if student_id:
        last_attempt = (
            db.query(AptitudeAttempt)
            .filter(
                AptitudeAttempt.test_id == test.id,
                AptitudeAttempt.student_id == student_id,
                AptitudeAttempt.status == "submitted",
            )
            .order_by(AptitudeAttempt.submitted_at.desc())
            .first()
        )

    questions = [link for link in test.questions if link.question and link.question.is_active]
    return {
        "id": test.id,
        "title": test.title,
        "description": test.description,
        "category": test.category,
        "difficulty": test.difficulty,
        "duration_minutes": test.duration_minutes,
        "question_count": len(questions),
        "question_ids": [link.question_id for link in questions],
        "is_published": test.is_published,
        "created_at": test.created_at,
        "last_attempt": _attempt_summary(last_attempt),
    }


def _validate_question_payload(options: list[str], correct_option: int):
    clean_options = [option.strip() for option in options if option and option.strip()]
    if len(clean_options) < 2:
        raise HTTPException(status_code=400, detail="At least two options are required")
    if correct_option < 0 or correct_option >= len(clean_options):
        raise HTTPException(status_code=400, detail="Correct option index is out of range")
    return clean_options


def _get_active_questions_by_ids(db: Session, question_ids: list[int]):
    if not question_ids:
        return []
    questions = (
        db.query(AptitudeQuestion)
        .filter(AptitudeQuestion.id.in_(question_ids), AptitudeQuestion.is_active == True)
        .all()
    )
    questions_by_id = {question.id: question for question in questions}
    return [questions_by_id[question_id] for question_id in question_ids if question_id in questions_by_id]


def _attempt_result(attempt: AptitudeAttempt):
    answer_map = {answer.question_id: answer.selected_option for answer in attempt.answers}
    include_answers = attempt.status == "submitted"
    review_questions = []
    if attempt.test:
        for link in attempt.test.questions:
            if link.question and link.question.is_active:
                review_questions.append(
                    _question_payload(
                        link.question,
                        include_answer=include_answers,
                        selected_option=answer_map.get(link.question_id) if include_answers else None,
                    )
                )

    return {
        **_attempt_summary(attempt),
        "test": {
            "id": attempt.test.id,
            "title": attempt.test.title,
            "category": attempt.test.category,
            "difficulty": attempt.test.difficulty,
            "duration_minutes": attempt.test.duration_minutes,
        } if attempt.test else None,
        "topic_breakdown": attempt.topic_breakdown or {},
        "questions": review_questions,
    }


def _build_recommendations(score: float, topic_breakdown: dict):
    weak_topics = [
        (topic, values)
        for topic, values in topic_breakdown.items()
        if values.get("accuracy", 0) < 70
    ]
    weak_topics.sort(key=lambda item: item[1].get("accuracy", 0))

    recommendations = []
    if score >= 85:
        recommendations.append("Strong attempt. Move to harder mixed mock tests to build speed.")
    elif score >= 65:
        recommendations.append("Good base. Focus on speed and revise the topics below 70% accuracy.")
    else:
        recommendations.append("Rebuild fundamentals with topic-wise practice before the next mock test.")

    for topic, values in weak_topics[:3]:
        recommendations.append(
            f"Revise {topic}; current accuracy is {round(values.get('accuracy', 0), 1)}%."
        )
    return recommendations


@router.get("/admin/dashboard")
def get_staff_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_hod_faculty),
):
    attempts = _staff_attempt_query(db, current_user).order_by(AptitudeAttempt.submitted_at.desc()).all()
    tests = (
        db.query(AptitudeTest)
        .options(joinedload(AptitudeTest.questions).joinedload(AptitudeTestQuestion.question))
        .order_by(AptitudeTest.created_at.desc())
        .all()
    )
    question_count = db.query(AptitudeQuestion).filter(AptitudeQuestion.is_active == True).count()

    student_query = db.query(Student).filter(Student.is_active == True)
    if current_user.role in ("hod", "faculty"):
        dept_id = get_user_dept(current_user)
        if dept_id:
            student_query = student_query.filter(Student.department_id == dept_id)

    topic_totals = {}
    test_totals = {}
    active_student_ids = set()
    for attempt in attempts:
        active_student_ids.add(attempt.student_id)
        test_bucket = test_totals.setdefault(
            attempt.test_id,
            {
                "test_id": attempt.test_id,
                "test_title": attempt.test.title if attempt.test else "Unknown test",
                "attempts": 0,
                "score_total": 0,
            },
        )
        test_bucket["attempts"] += 1
        test_bucket["score_total"] += attempt.score or 0

        for topic, values in (attempt.topic_breakdown or {}).items():
            bucket = topic_totals.setdefault(topic, {"total": 0, "correct": 0})
            bucket["total"] += values.get("total", 0)
            bucket["correct"] += values.get("correct", 0)

    topic_performance = []
    for topic, values in topic_totals.items():
        total = values["total"]
        correct = values["correct"]
        topic_performance.append({
            "topic": topic,
            "total": total,
            "correct": correct,
            "accuracy": round((correct / total) * 100, 2) if total else 0,
        })
    topic_performance.sort(key=lambda item: item["accuracy"])

    test_performance = []
    for values in test_totals.values():
        attempts_count = values["attempts"]
        test_performance.append({
            "test_id": values["test_id"],
            "test_title": values["test_title"],
            "attempts": attempts_count,
            "average_score": round(values["score_total"] / attempts_count, 2) if attempts_count else 0,
        })
    test_performance.sort(key=lambda item: item["average_score"], reverse=True)

    avg_score = (
        sum(attempt.score or 0 for attempt in attempts) / len(attempts)
        if attempts else 0
    )

    return {
        "summary": {
            "tests": len(tests),
            "questions": question_count,
            "submitted_attempts": len(attempts),
            "active_students": len(active_student_ids),
            "students_in_scope": student_query.count(),
            "average_score": round(avg_score, 2),
        },
        "tests": [_test_summary(db, test) for test in tests],
        "recent_attempts": [_staff_attempt_payload(attempt) for attempt in attempts[:10]],
        "topic_performance": topic_performance[:10],
        "test_performance": test_performance[:8],
    }


@router.get("/dashboard")
def get_aptitude_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    student = _student_or_403(current_user)

    tests = (
        db.query(AptitudeTest)
        .options(joinedload(AptitudeTest.questions).joinedload(AptitudeTestQuestion.question))
        .filter(AptitudeTest.is_published == True)
        .order_by(AptitudeTest.created_at.desc())
        .all()
    )
    attempts = (
        db.query(AptitudeAttempt)
        .options(joinedload(AptitudeAttempt.test))
        .filter(AptitudeAttempt.student_id == student.id, AptitudeAttempt.status == "submitted")
        .order_by(AptitudeAttempt.submitted_at.desc())
        .all()
    )

    topic_totals = {}
    for attempt in attempts:
        for topic, values in (attempt.topic_breakdown or {}).items():
            bucket = topic_totals.setdefault(topic, {"total": 0, "correct": 0})
            bucket["total"] += values.get("total", 0)
            bucket["correct"] += values.get("correct", 0)

    topic_performance = []
    for topic, values in topic_totals.items():
        total = values["total"]
        correct = values["correct"]
        topic_performance.append({
            "topic": topic,
            "total": total,
            "correct": correct,
            "accuracy": round((correct / total) * 100, 2) if total else 0,
        })
    topic_performance.sort(key=lambda item: item["accuracy"], reverse=True)

    best_score = max([attempt.score for attempt in attempts], default=0)
    average_accuracy = (
        sum(attempt.accuracy or 0 for attempt in attempts) / len(attempts)
        if attempts else 0
    )
    strongest_topic = topic_performance[0]["topic"] if topic_performance else None
    focus_topic = topic_performance[-1]["topic"] if topic_performance else None

    return {
        "summary": {
            "tests_available": len(tests),
            "attempts_completed": len(attempts),
            "best_score": round(best_score, 2),
            "average_accuracy": round(average_accuracy, 2),
            "strongest_topic": strongest_topic,
            "focus_topic": focus_topic,
        },
        "tests": [_test_summary(db, test, student.id) for test in tests],
        "recent_attempts": [_attempt_summary(attempt) for attempt in attempts[:8]],
        "topic_performance": topic_performance,
    }


@router.get("/tests")
def list_tests(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = (
        db.query(AptitudeTest)
        .options(joinedload(AptitudeTest.questions).joinedload(AptitudeTestQuestion.question))
        .filter(AptitudeTest.is_published == True)
    )
    if category:
        q = q.filter(AptitudeTest.category.ilike(f"%{category}%"))
    if difficulty:
        q = q.filter(AptitudeTest.difficulty == difficulty)

    student_id = current_user.student.id if current_user.student else None
    tests = q.order_by(AptitudeTest.created_at.desc()).all()
    return [_test_summary(db, test, student_id) for test in tests]


@router.post("/tests/{test_id}/start", status_code=201)
def start_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    student = _student_or_403(current_user)
    test = (
        db.query(AptitudeTest)
        .options(joinedload(AptitudeTest.questions).joinedload(AptitudeTestQuestion.question))
        .filter(AptitudeTest.id == test_id, AptitudeTest.is_published == True)
        .first()
    )
    if not test:
        raise HTTPException(status_code=404, detail="Aptitude test not found")

    questions = [link.question for link in test.questions if link.question and link.question.is_active]
    if not questions:
        raise HTTPException(status_code=400, detail="This test has no active questions")

    attempt = AptitudeAttempt(
        test_id=test.id,
        student_id=student.id,
        status="in_progress",
        total_questions=len(questions),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "attempt_id": attempt.id,
        "started_at": attempt.started_at,
        "test": {
            "id": test.id,
            "title": test.title,
            "description": test.description,
            "category": test.category,
            "difficulty": test.difficulty,
            "duration_minutes": test.duration_minutes,
            "question_count": len(questions),
        },
        "questions": [_question_payload(question) for question in questions],
    }


@router.post("/attempts/{attempt_id}/submit")
def submit_attempt(
    attempt_id: int,
    data: AptitudeAttemptSubmit,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    student = _student_or_403(current_user)
    attempt = (
        db.query(AptitudeAttempt)
        .options(
            joinedload(AptitudeAttempt.test)
            .joinedload(AptitudeTest.questions)
            .joinedload(AptitudeTestQuestion.question),
            joinedload(AptitudeAttempt.answers).joinedload(AptitudeAttemptAnswer.question),
        )
        .filter(AptitudeAttempt.id == attempt_id, AptitudeAttempt.student_id == student.id)
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.status == "submitted":
        return _attempt_result(attempt)

    answers_by_question = {answer.question_id: answer for answer in data.answers}
    questions = [link.question for link in attempt.test.questions if link.question and link.question.is_active]
    if not questions:
        raise HTTPException(status_code=400, detail="Attempt has no questions")

    for existing in list(attempt.answers):
        db.delete(existing)
    db.flush()

    correct = 0
    topic_breakdown = {}
    for question in questions:
        submitted = answers_by_question.get(question.id)
        selected_option = submitted.selected_option if submitted else None
        time_spent = submitted.time_spent_seconds if submitted else 0

        if selected_option is not None and (selected_option < 0 or selected_option >= len(question.options or [])):
            raise HTTPException(status_code=400, detail=f"Invalid option for question {question.id}")

        is_correct = selected_option == question.correct_option
        if is_correct:
            correct += 1

        bucket = topic_breakdown.setdefault(question.topic, {"total": 0, "correct": 0})
        bucket["total"] += 1
        bucket["correct"] += 1 if is_correct else 0

        db.add(AptitudeAttemptAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            selected_option=selected_option,
            is_correct=is_correct,
            time_spent_seconds=max(0, time_spent or 0),
        ))

    total = len(questions)
    score = round((correct / total) * 100, 2) if total else 0
    for values in topic_breakdown.values():
        values["accuracy"] = round((values["correct"] / values["total"]) * 100, 2) if values["total"] else 0

    attempt.status = "submitted"
    attempt.submitted_at = datetime.utcnow()
    attempt.duration_seconds = data.duration_seconds or int((attempt.submitted_at - attempt.started_at).total_seconds())
    attempt.total_questions = total
    attempt.correct_answers = correct
    attempt.score = score
    attempt.accuracy = score
    attempt.topic_breakdown = topic_breakdown
    attempt.recommendations = _build_recommendations(score, topic_breakdown)

    db.add(ActivityLog(
        user_id=current_user.id,
        action="APTITUDE_ATTEMPT_SUBMITTED",
        entity_type="aptitude_attempt",
        entity_id=attempt.id,
        details=f"{attempt.test.title}: {correct}/{total} ({score}%)",
    ))
    db.commit()

    attempt = (
        db.query(AptitudeAttempt)
        .options(
            joinedload(AptitudeAttempt.test)
            .joinedload(AptitudeTest.questions)
            .joinedload(AptitudeTestQuestion.question),
            joinedload(AptitudeAttempt.answers).joinedload(AptitudeAttemptAnswer.question),
        )
        .filter(AptitudeAttempt.id == attempt_id)
        .first()
    )
    return _attempt_result(attempt)


@router.get("/attempts/{attempt_id}")
def get_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    student = _student_or_403(current_user)
    attempt = (
        db.query(AptitudeAttempt)
        .options(
            joinedload(AptitudeAttempt.test)
            .joinedload(AptitudeTest.questions)
            .joinedload(AptitudeTestQuestion.question),
            joinedload(AptitudeAttempt.answers).joinedload(AptitudeAttemptAnswer.question),
        )
        .filter(AptitudeAttempt.id == attempt_id, AptitudeAttempt.student_id == student.id)
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    return _attempt_result(attempt)


@router.get("/questions")
def list_questions(
    category: Optional[str] = None,
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_hod_faculty),
):
    q = db.query(AptitudeQuestion).filter(AptitudeQuestion.is_active == True)
    if category:
        q = q.filter(AptitudeQuestion.category.ilike(f"%{category}%"))
    if topic:
        q = q.filter(AptitudeQuestion.topic.ilike(f"%{topic}%"))
    if difficulty:
        q = q.filter(AptitudeQuestion.difficulty == difficulty)
    questions = q.order_by(AptitudeQuestion.category, AptitudeQuestion.topic).all()
    return [_question_payload(question, include_answer=True) for question in questions]


@router.post("/questions", status_code=201)
def create_question(
    data: AptitudeQuestionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_hod_faculty),
):
    options = _validate_question_payload(data.options, data.correct_option)

    payload = data.dict()
    payload["options"] = options
    question = AptitudeQuestion(**payload)
    db.add(question)
    db.commit()
    db.refresh(question)
    return _question_payload(question, include_answer=True)


@router.put("/questions/{question_id}")
def update_question(
    question_id: int,
    data: AptitudeQuestionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_hod_faculty),
):
    question = db.query(AptitudeQuestion).filter(AptitudeQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    updates = data.dict(exclude_unset=True)
    if "options" in updates or "correct_option" in updates:
        options = updates.get("options", question.options or [])
        correct_option = updates.get("correct_option", question.correct_option)
        updates["options"] = _validate_question_payload(options, correct_option)

    for key, value in updates.items():
        setattr(question, key, value)

    db.add(ActivityLog(
        user_id=current_user.id,
        action="APTITUDE_QUESTION_UPDATED",
        entity_type="aptitude_question",
        entity_id=question.id,
        details=f"Updated aptitude question {question.id}",
    ))
    db.commit()
    db.refresh(question)
    return _question_payload(question, include_answer=True)


@router.delete("/questions/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_hod_faculty),
):
    question = db.query(AptitudeQuestion).filter(AptitudeQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    question.is_active = False
    db.add(ActivityLog(
        user_id=current_user.id,
        action="APTITUDE_QUESTION_DELETED",
        entity_type="aptitude_question",
        entity_id=question.id,
        details=f"Archived aptitude question {question.id}",
    ))
    db.commit()
    return {"message": "Question archived"}


@router.post("/tests", status_code=201)
def create_test(
    data: AptitudeTestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_hod_faculty),
):
    if db.query(AptitudeTest).filter(AptitudeTest.title == data.title).first():
        raise HTTPException(status_code=400, detail="A test with this title already exists")

    question_ids = data.question_ids or []
    questions = []
    if question_ids:
        questions = _get_active_questions_by_ids(db, question_ids)
    else:
        questions = (
            db.query(AptitudeQuestion)
            .filter(AptitudeQuestion.category == data.category, AptitudeQuestion.is_active == True)
            .limit(20)
            .all()
        )
    if not questions:
        raise HTTPException(status_code=400, detail="Select at least one active question")

    payload = data.dict(exclude={"question_ids"})
    test = AptitudeTest(**payload, created_by=current_user.id)
    db.add(test)
    db.flush()
    question_order = {question_id: index for index, question_id in enumerate(question_ids)}
    for index, question in enumerate(questions):
        db.add(AptitudeTestQuestion(
            test_id=test.id,
            question_id=question.id,
            sort_order=question_order.get(question.id, index),
        ))
    db.commit()
    db.refresh(test)
    return _test_summary(db, test)


@router.put("/tests/{test_id}")
def update_test(
    test_id: int,
    data: AptitudeTestUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_hod_faculty),
):
    test = (
        db.query(AptitudeTest)
        .options(joinedload(AptitudeTest.questions).joinedload(AptitudeTestQuestion.question))
        .filter(AptitudeTest.id == test_id)
        .first()
    )
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    updates = data.dict(exclude_unset=True)
    question_ids = updates.pop("question_ids", None)

    if "title" in updates:
        duplicate = (
            db.query(AptitudeTest)
            .filter(AptitudeTest.title == updates["title"], AptitudeTest.id != test.id)
            .first()
        )
        if duplicate:
            raise HTTPException(status_code=400, detail="A test with this title already exists")

    if "duration_minutes" in updates and updates["duration_minutes"] is not None and updates["duration_minutes"] < 1:
        raise HTTPException(status_code=400, detail="Duration must be at least 1 minute")

    for key, value in updates.items():
        setattr(test, key, value)

    if question_ids is not None:
        questions = _get_active_questions_by_ids(db, question_ids)
        if not questions:
            raise HTTPException(status_code=400, detail="Select at least one active question")
        for existing in list(test.questions):
            db.delete(existing)
        db.flush()
        for index, question in enumerate(questions):
            db.add(AptitudeTestQuestion(
                test_id=test.id,
                question_id=question.id,
                sort_order=index,
            ))

    db.add(ActivityLog(
        user_id=current_user.id,
        action="APTITUDE_TEST_UPDATED",
        entity_type="aptitude_test",
        entity_id=test.id,
        details=f"Updated aptitude test {test.title}",
    ))
    db.commit()

    test = (
        db.query(AptitudeTest)
        .options(joinedload(AptitudeTest.questions).joinedload(AptitudeTestQuestion.question))
        .filter(AptitudeTest.id == test_id)
        .first()
    )
    return _test_summary(db, test)


@router.delete("/tests/{test_id}")
def delete_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_hod_faculty),
):
    test = db.query(AptitudeTest).filter(AptitudeTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    test.is_published = False
    db.add(ActivityLog(
        user_id=current_user.id,
        action="APTITUDE_TEST_DELETED",
        entity_type="aptitude_test",
        entity_id=test.id,
        details=f"Unpublished aptitude test {test.title}",
    ))
    db.commit()
    return {"message": "Test unpublished"}
