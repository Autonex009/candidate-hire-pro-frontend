"""
Tests for Test Engine API endpoints
"""
import pytest
from httpx import AsyncClient
from app.models.test import TestAttempt, UserAnswer, Question, TestQuestion


class TestAvailableTests:
    """Test available tests endpoint"""

    async def test_get_available_tests_authenticated(
        self, client: AsyncClient, test_user, auth_headers, test_test
    ):
        """Test getting available tests with authentication"""
        response = await client.get("/api/tests/available", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        test_data = next((t for t in data if t["id"] == test_test.id), None)
        assert test_data is not None
        assert test_data["title"] == test_test.title
        assert test_data["has_attempted"] is False

    async def test_get_available_tests_unauthenticated(self, client: AsyncClient, test_test):
        """Test getting available tests fails without authentication"""
        response = await client.get("/api/tests/available")
        assert response.status_code == 401


class TestStartTest:
    """Test start test endpoint"""

    async def test_start_test_success(
        self, client: AsyncClient, test_user, auth_headers, test_test, test_question, test_session
    ):
        """Test successfully starting a test"""
        # Link question to test
        test_question_link = TestQuestion(
            test_id=test_test.id,
            question_id=test_question.id,
            order=1
        )
        test_session.add(test_question_link)
        await test_session.commit()

        response = await client.post(
            "/api/tests/start",
            json={"test_id": test_test.id},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "attempt_id" in data
        assert data["test_id"] == test_test.id
        assert data["test_title"] == test_test.title
        assert "questions" in data

    async def test_start_test_creates_attempt(
        self, client: AsyncClient, test_user, auth_headers, test_test
    ):
        """Test that starting a test creates an attempt record"""
        response = await client.post(
            "/api/tests/start",
            json={"test_id": test_test.id},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["attempt_id"] is not None

    async def test_start_test_resume_existing(
        self, client: AsyncClient, test_user, auth_headers, test_test, test_attempt
    ):
        """Test that starting a test with existing in-progress attempt resumes it"""
        response = await client.post(
            "/api/tests/start",
            json={"test_id": test_test.id},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["attempt_id"] == test_attempt.id  # Should resume existing

    async def test_start_nonexistent_test(self, client: AsyncClient, test_user, auth_headers):
        """Test starting a nonexistent test fails"""
        response = await client.post(
            "/api/tests/start",
            json={"test_id": 99999},
            headers=auth_headers
        )
        assert response.status_code == 404

    async def test_start_test_unauthenticated(self, client: AsyncClient, test_test):
        """Test starting a test fails without authentication"""
        response = await client.post(
            "/api/tests/start",
            json={"test_id": test_test.id}
        )
        assert response.status_code == 401


class TestSubmitAnswer:
    """Test submit answer endpoint"""

    async def test_submit_answer_success(
        self, client: AsyncClient, test_user, auth_headers, test_attempt, test_question
    ):
        """Test successfully submitting an answer"""
        response = await client.post(
            f"/api/tests/submit-answer?attempt_id={test_attempt.id}",
            json={
                "question_id": test_question.id,
                "answer_text": "4",
                "time_spent_seconds": 30
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "answer_id" in data

    async def test_submit_correct_answer_scored(
        self, client: AsyncClient, test_user, auth_headers, test_attempt, test_question, test_session
    ):
        """Test that correct MCQ answers are auto-scored"""
        response = await client.post(
            f"/api/tests/submit-answer?attempt_id={test_attempt.id}",
            json={
                "question_id": test_question.id,
                "answer_text": "4",  # Correct answer
                "time_spent_seconds": 30
            },
            headers=auth_headers
        )
        assert response.status_code == 200

        # Check the answer was scored correctly
        from sqlalchemy import select
        result = await test_session.execute(
            select(UserAnswer).where(UserAnswer.attempt_id == test_attempt.id)
        )
        answer = result.scalar_one_or_none()
        assert answer is not None
        assert answer.is_correct is True
        assert answer.marks_obtained == test_question.marks

    async def test_submit_answer_update_existing(
        self, client: AsyncClient, test_user, auth_headers, test_attempt, test_question, test_session
    ):
        """Test updating an existing answer"""
        # Submit first answer
        response1 = await client.post(
            f"/api/tests/submit-answer?attempt_id={test_attempt.id}",
            json={
                "question_id": test_question.id,
                "answer_text": "3",
                "time_spent_seconds": 30
            },
            headers=auth_headers
        )
        assert response1.status_code == 200

        # Update answer
        response2 = await client.post(
            f"/api/tests/submit-answer?attempt_id={test_attempt.id}",
            json={
                "question_id": test_question.id,
                "answer_text": "4",
                "time_spent_seconds": 45
            },
            headers=auth_headers
        )
        assert response2.status_code == 200
        assert "Answer updated" in response2.json()["message"]

    async def test_submit_answer_invalid_attempt(
        self, client: AsyncClient, test_user, auth_headers, test_question
    ):
        """Test submitting answer for invalid attempt fails"""
        response = await client.post(
            "/api/tests/submit-answer?attempt_id=99999",
            json={
                "question_id": test_question.id,
                "answer_text": "4",
                "time_spent_seconds": 30
            },
            headers=auth_headers
        )
        assert response.status_code == 404


class TestCompleteTest:
    """Test complete test endpoint"""

    async def test_complete_test_success(
        self, client: AsyncClient, test_user, auth_headers, test_attempt, test_question, test_session
    ):
        """Test successfully completing a test"""
        # Submit an answer first
        answer = UserAnswer(
            attempt_id=test_attempt.id,
            question_id=test_question.id,
            answer_text="4",
            is_correct=True,
            marks_obtained=1.0,
            time_spent_seconds=30
        )
        test_session.add(answer)
        await test_session.commit()

        response = await client.post(
            f"/api/tests/complete/{test_attempt.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["attempt_id"] == test_attempt.id
        assert "score" in data
        assert "percentage" in data
        assert "passed" in data
        assert "answers" in data

    async def test_complete_test_already_completed(
        self, client: AsyncClient, test_user, auth_headers, test_attempt, test_session
    ):
        """Test completing an already completed test fails"""
        # Mark attempt as completed
        test_attempt.status = "completed"
        await test_session.commit()

        response = await client.post(
            f"/api/tests/complete/{test_attempt.id}",
            headers=auth_headers
        )
        assert response.status_code == 400
        assert "already completed" in response.json()["detail"]

    async def test_complete_test_invalid_attempt(self, client: AsyncClient, test_user, auth_headers):
        """Test completing invalid attempt fails"""
        response = await client.post(
            "/api/tests/complete/99999",
            headers=auth_headers
        )
        assert response.status_code == 404


class TestFlagViolation:
    """Test flag violation endpoint"""

    async def test_flag_tab_switch(
        self, client: AsyncClient, test_user, auth_headers, test_attempt
    ):
        """Test recording a tab switch violation"""
        response = await client.post(
            f"/api/tests/flag-violation/{test_attempt.id}?violation_type=tab_switch",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["tab_switches"] == 1
        assert data["is_flagged"] is False  # Only flagged after 3 switches

    async def test_flag_multiple_tab_switches_triggers_flag(
        self, client: AsyncClient, test_user, auth_headers, test_attempt
    ):
        """Test that 3+ tab switches flags the attempt"""
        for _ in range(3):
            response = await client.post(
                f"/api/tests/flag-violation/{test_attempt.id}?violation_type=tab_switch",
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["tab_switches"] == 3
        assert data["is_flagged"] is True

    async def test_flag_fullscreen_exit(
        self, client: AsyncClient, test_user, auth_headers, test_attempt
    ):
        """Test recording a fullscreen exit violation"""
        response = await client.post(
            f"/api/tests/flag-violation/{test_attempt.id}?violation_type=fullscreen_exit",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["fullscreen_exits"] == 1


class TestMyAttempts:
    """Test my attempts endpoint"""

    async def test_get_my_attempts_empty(self, client: AsyncClient, test_user, auth_headers):
        """Test getting attempts when none exist"""
        response = await client.get("/api/tests/my-attempts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    async def test_get_my_attempts_with_attempt(
        self, client: AsyncClient, test_user, auth_headers, test_attempt, test_test
    ):
        """Test getting attempts after starting a test"""
        response = await client.get("/api/tests/my-attempts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == test_attempt.id
        assert data[0]["test_id"] == test_test.id


class TestGetResult:
    """Test get result endpoint"""

    async def test_get_result_completed(
        self, client: AsyncClient, test_user, auth_headers, test_attempt, test_test, test_session
    ):
        """Test getting result for completed test"""
        from datetime import datetime, timezone

        # Complete the attempt
        test_attempt.status = "completed"
        test_attempt.score = 8
        test_attempt.percentage = 80
        test_attempt.passed = True
        test_attempt.completed_at = datetime.now(timezone.utc)
        test_attempt.time_taken_seconds = 300
        await test_session.commit()

        response = await client.get(
            f"/api/tests/result/{test_attempt.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["attempt_id"] == test_attempt.id
        assert data["score"] == 8
        assert data["percentage"] == 80
        assert data["passed"] is True

    async def test_get_result_not_completed(
        self, client: AsyncClient, test_user, auth_headers, test_attempt
    ):
        """Test getting result for incomplete test fails"""
        response = await client.get(
            f"/api/tests/result/{test_attempt.id}",
            headers=auth_headers
        )
        assert response.status_code == 404

    async def test_get_result_invalid_attempt(self, client: AsyncClient, test_user, auth_headers):
        """Test getting result for invalid attempt fails"""
        response = await client.get("/api/tests/result/99999", headers=auth_headers)
        assert response.status_code == 404
