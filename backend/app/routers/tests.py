"""
Test Engine API endpoints for candidates to take tests
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from datetime import datetime, timezone

from ..database import get_db
from ..models.user import User
from ..models.test import Test, TestQuestion, Question, TestAttempt, UserAnswer
from ..schemas.test import (
    StartTestRequest, SubmitAnswerRequest, CompleteTestRequest,
    TestAttemptResponse, TestSessionResponse, TestResultResponse,
    QuestionForTest
)
from ..services.auth import get_current_user

router = APIRouter(prefix="/api/tests", tags=["Test Engine"])


@router.get("/available")
async def get_available_tests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all available tests for the current user"""
    result = await db.execute(
        select(Test)
        .where(Test.is_active == True)
        .where(Test.is_published == True)
        .order_by(Test.created_at.desc())
    )
    tests = result.scalars().all()
    
    # Get user's attempts for each test
    test_data = []
    for test in tests:
        attempt_result = await db.execute(
            select(TestAttempt)
            .where(TestAttempt.test_id == test.id)
            .where(TestAttempt.user_id == current_user.id)
            .order_by(TestAttempt.started_at.desc())
            .limit(1)
        )
        attempt = attempt_result.scalar_one_or_none()
        
        test_data.append({
            "id": test.id,
            "title": test.title,
            "description": test.description,
            "duration_minutes": test.duration_minutes,
            "total_questions": test.total_questions,
            "total_marks": test.total_marks,
            "has_attempted": attempt is not None,
            "attempt_status": attempt.status if attempt else None,
            "last_score": attempt.score if attempt else None,
            "last_percentage": attempt.percentage if attempt else None
        })
    
    return test_data


@router.post("/start", response_model=TestSessionResponse)
async def start_test(
    data: StartTestRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a new test session"""
    # Get the test
    result = await db.execute(
        select(Test)
        .where(Test.id == data.test_id)
        .where(Test.is_active == True)
        .where(Test.is_published == True)
    )
    test = result.scalar_one_or_none()
    
    if not test:
        raise HTTPException(status_code=404, detail="Test not found or not available")
    
    # Check if user has an in-progress attempt
    existing_result = await db.execute(
        select(TestAttempt)
        .where(TestAttempt.test_id == data.test_id)
        .where(TestAttempt.user_id == current_user.id)
        .where(TestAttempt.status == "in_progress")
    )
    existing_attempt = existing_result.scalar_one_or_none()
    
    if existing_attempt:
        # Resume existing attempt
        attempt = existing_attempt
    else:
        # Create new attempt
        attempt = TestAttempt(
            user_id=current_user.id,
            test_id=test.id,
            total_marks=test.total_marks
        )
        db.add(attempt)
        await db.commit()
        await db.refresh(attempt)
    
    # Get questions for this test
    questions_result = await db.execute(
        select(Question)
        .join(TestQuestion, Question.id == TestQuestion.question_id)
        .where(TestQuestion.test_id == test.id)
        .order_by(TestQuestion.order)
    )
    questions = questions_result.scalars().all()
    
    # If no questions linked yet, get questions based on test config
    if not questions:
        # For demo, generate some sample MCQ questions
        questions = await _get_sample_questions(db, test)
    
    # Convert to response format (without correct answers)
    question_responses = [
        QuestionForTest(
            id=q.id,
            question_type=q.question_type,
            question_text=q.question_text,
            options=q.options,
            media_url=q.media_url,
            marks=q.marks
        )
        for q in questions
    ]
    
    return TestSessionResponse(
        attempt_id=attempt.id,
        test_id=test.id,
        test_title=test.title,
        duration_minutes=test.duration_minutes,
        total_questions=len(question_responses),
        questions=question_responses,
        started_at=attempt.started_at
    )


async def _get_sample_questions(db: AsyncSession, test: Test) -> List[Question]:
    """Get sample questions based on test configuration"""
    questions = []
    
    if test.mcq_count > 0:
        result = await db.execute(
            select(Question)
            .where(Question.question_type == "mcq")
            .where(Question.is_active == True)
            .limit(test.mcq_count)
        )
        questions.extend(result.scalars().all())
    
    if test.text_annotation_count > 0:
        result = await db.execute(
            select(Question)
            .where(Question.question_type == "text_annotation")
            .where(Question.is_active == True)
            .limit(test.text_annotation_count)
        )
        questions.extend(result.scalars().all())
    
    if test.image_annotation_count > 0:
        result = await db.execute(
            select(Question)
            .where(Question.question_type == "image_annotation")
            .where(Question.is_active == True)
            .limit(test.image_annotation_count)
        )
        questions.extend(result.scalars().all())
    
    if test.video_annotation_count > 0:
        result = await db.execute(
            select(Question)
            .where(Question.question_type == "video_annotation")
            .where(Question.is_active == True)
            .limit(test.video_annotation_count)
        )
        questions.extend(result.scalars().all())
    
    return questions


@router.post("/submit-answer")
async def submit_answer(
    attempt_id: int,
    data: SubmitAnswerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit an answer for a question"""
    # Verify attempt belongs to user
    result = await db.execute(
        select(TestAttempt)
        .where(TestAttempt.id == attempt_id)
        .where(TestAttempt.user_id == current_user.id)
        .where(TestAttempt.status == "in_progress")
    )
    attempt = result.scalar_one_or_none()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Test attempt not found or already completed")
    
    # Get the question
    q_result = await db.execute(
        select(Question).where(Question.id == data.question_id)
    )
    question = q_result.scalar_one_or_none()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check if answer already exists
    existing_result = await db.execute(
        select(UserAnswer)
        .where(UserAnswer.attempt_id == attempt_id)
        .where(UserAnswer.question_id == data.question_id)
    )
    existing_answer = existing_result.scalar_one_or_none()
    
    if existing_answer:
        # Update existing answer
        existing_answer.answer_text = data.answer_text
        existing_answer.annotation_data = data.annotation_data
        existing_answer.time_spent_seconds = data.time_spent_seconds
        existing_answer.answered_at = datetime.now(timezone.utc)
        
        # Auto-score for MCQ
        if question.question_type == "mcq" and question.correct_answer:
            existing_answer.is_correct = (data.answer_text == question.correct_answer)
            existing_answer.marks_obtained = question.marks if existing_answer.is_correct else 0
        
        await db.commit()
        return {"message": "Answer updated", "answer_id": existing_answer.id}
    else:
        # Create new answer
        is_correct = None
        marks_obtained = 0
        
        # Auto-score for MCQ
        if question.question_type == "mcq" and question.correct_answer:
            is_correct = (data.answer_text == question.correct_answer)
            marks_obtained = question.marks if is_correct else 0
        
        answer = UserAnswer(
            attempt_id=attempt_id,
            question_id=data.question_id,
            answer_text=data.answer_text,
            annotation_data=data.annotation_data,
            is_correct=is_correct,
            marks_obtained=marks_obtained,
            time_spent_seconds=data.time_spent_seconds
        )
        db.add(answer)
        await db.commit()
        await db.refresh(answer)
        
        # Update current question in attempt
        attempt.current_question += 1
        await db.commit()
        
        return {"message": "Answer submitted", "answer_id": answer.id}


@router.post("/complete/{attempt_id}", response_model=TestResultResponse)
async def complete_test(
    attempt_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Complete a test and get results"""
    # Verify attempt belongs to user
    result = await db.execute(
        select(TestAttempt)
        .where(TestAttempt.id == attempt_id)
        .where(TestAttempt.user_id == current_user.id)
    )
    attempt = result.scalar_one_or_none()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Test attempt not found")
    
    if attempt.status == "completed":
        raise HTTPException(status_code=400, detail="Test already completed")
    
    # Get the test
    test_result = await db.execute(
        select(Test).where(Test.id == attempt.test_id)
    )
    test = test_result.scalar_one_or_none()
    
    # Calculate score from all answers
    answers_result = await db.execute(
        select(UserAnswer).where(UserAnswer.attempt_id == attempt_id)
    )
    answers = answers_result.scalars().all()
    
    total_score = sum(a.marks_obtained for a in answers)
    total_marks = attempt.total_marks or test.total_marks
    percentage = (total_score / total_marks * 100) if total_marks > 0 else 0
    passed = percentage >= 50  # 50% passing
    
    # Update attempt
    now = datetime.now(timezone.utc)
    attempt.status = "completed"
    attempt.score = total_score
    attempt.percentage = percentage
    attempt.passed = passed
    attempt.completed_at = now
    # Handle timezone-naive started_at from SQLite
    started_at = attempt.started_at
    if started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=timezone.utc)
    attempt.time_taken_seconds = int((now - started_at).total_seconds())
    
    await db.commit()
    await db.refresh(attempt)
    
    # Build answer details
    answer_details = []
    for answer in answers:
        q_result = await db.execute(
            select(Question).where(Question.id == answer.question_id)
        )
        question = q_result.scalar_one_or_none()
        
        answer_details.append({
            "question_id": answer.question_id,
            "question_text": question.question_text if question else "",
            "user_answer": answer.answer_text,
            "correct_answer": question.correct_answer if question else None,
            "is_correct": answer.is_correct,
            "marks_obtained": answer.marks_obtained,
            "max_marks": question.marks if question else 0
        })
    
    return TestResultResponse(
        attempt_id=attempt.id,
        test_id=attempt.test_id,
        test_title=test.title if test else "Unknown",
        score=attempt.score,
        total_marks=total_marks,
        percentage=attempt.percentage,
        passed=attempt.passed,
        time_taken_seconds=attempt.time_taken_seconds or 0,
        completed_at=attempt.completed_at,
        answers=answer_details
    )


@router.post("/flag-violation/{attempt_id}")
async def flag_violation(
    attempt_id: int,
    violation_type: str,  # "tab_switch", "fullscreen_exit", "copy_paste"
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a cheating violation"""
    result = await db.execute(
        select(TestAttempt)
        .where(TestAttempt.id == attempt_id)
        .where(TestAttempt.user_id == current_user.id)
        .where(TestAttempt.status == "in_progress")
    )
    attempt = result.scalar_one_or_none()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Test attempt not found")
    
    if violation_type == "tab_switch":
        attempt.tab_switches += 1
        if attempt.tab_switches >= 3:
            attempt.is_flagged = True
            attempt.flag_reason = f"Multiple tab switches: {attempt.tab_switches}"
    elif violation_type == "fullscreen_exit":
        attempt.fullscreen_exits += 1
        if attempt.fullscreen_exits >= 2:
            attempt.is_flagged = True
            attempt.flag_reason = f"Multiple fullscreen exits: {attempt.fullscreen_exits}"
    
    await db.commit()
    
    return {
        "tab_switches": attempt.tab_switches,
        "fullscreen_exits": attempt.fullscreen_exits,
        "is_flagged": attempt.is_flagged
    }


@router.get("/my-attempts", response_model=List[TestAttemptResponse])
async def get_my_attempts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's test attempts"""
    result = await db.execute(
        select(TestAttempt)
        .where(TestAttempt.user_id == current_user.id)
        .order_by(TestAttempt.started_at.desc())
    )
    attempts = result.scalars().all()
    
    responses = []
    for attempt in attempts:
        test_result = await db.execute(
            select(Test.title).where(Test.id == attempt.test_id)
        )
        test_title = test_result.scalar()
        
        responses.append(TestAttemptResponse(
            id=attempt.id,
            test_id=attempt.test_id,
            test_title=test_title,
            status=attempt.status,
            current_question=attempt.current_question,
            score=attempt.score,
            total_marks=attempt.total_marks,
            percentage=attempt.percentage,
            passed=attempt.passed,
            tab_switches=attempt.tab_switches,
            is_flagged=attempt.is_flagged,
            started_at=attempt.started_at,
            completed_at=attempt.completed_at,
            time_taken_seconds=attempt.time_taken_seconds
        ))
    
    return responses


@router.get("/result/{attempt_id}", response_model=TestResultResponse)
async def get_test_result(
    attempt_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed result for a completed test"""
    result = await db.execute(
        select(TestAttempt)
        .where(TestAttempt.id == attempt_id)
        .where(TestAttempt.user_id == current_user.id)
        .where(TestAttempt.status == "completed")
    )
    attempt = result.scalar_one_or_none()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Test result not found")
    
    # Get test
    test_result = await db.execute(
        select(Test).where(Test.id == attempt.test_id)
    )
    test = test_result.scalar_one_or_none()
    
    # Get answers with questions
    answers_result = await db.execute(
        select(UserAnswer).where(UserAnswer.attempt_id == attempt_id)
    )
    answers = answers_result.scalars().all()
    
    answer_details = []
    for answer in answers:
        q_result = await db.execute(
            select(Question).where(Question.id == answer.question_id)
        )
        question = q_result.scalar_one_or_none()
        
        answer_details.append({
            "question_id": answer.question_id,
            "question_text": question.question_text if question else "",
            "user_answer": answer.answer_text,
            "correct_answer": question.correct_answer if question else None,
            "is_correct": answer.is_correct,
            "marks_obtained": answer.marks_obtained,
            "max_marks": question.marks if question else 0
        })
    
    return TestResultResponse(
        attempt_id=attempt.id,
        test_id=attempt.test_id,
        test_title=test.title if test else "Unknown",
        score=attempt.score,
        total_marks=attempt.total_marks,
        percentage=attempt.percentage,
        passed=attempt.passed,
        time_taken_seconds=attempt.time_taken_seconds or 0,
        completed_at=attempt.completed_at,
        answers=answer_details
    )
