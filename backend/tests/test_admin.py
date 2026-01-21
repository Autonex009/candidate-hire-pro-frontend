"""
Tests for Admin API endpoints
"""
import pytest
from httpx import AsyncClient
from app.models.test import Division, Question, Test
from app.models.user import User, UserRole


class TestAdminStats:
    """Test admin dashboard stats endpoint"""

    async def test_get_admin_stats(self, client: AsyncClient, test_admin, admin_auth_headers):
        """Test getting admin dashboard statistics"""
        response = await client.get("/api/admin/stats", headers=admin_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_candidates" in data
        assert "active_jobs" in data
        assert "tests_completed" in data
        assert "flagged_attempts" in data

    async def test_get_admin_stats_unauthenticated(self, client: AsyncClient):
        """Test getting admin stats fails without authentication"""
        response = await client.get("/api/admin/stats")
        assert response.status_code == 401


class TestDivisionCRUD:
    """Test division CRUD operations"""

    async def test_get_divisions(self, client: AsyncClient, test_admin, admin_auth_headers, test_division):
        """Test getting all divisions"""
        response = await client.get("/api/admin/divisions", headers=admin_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    async def test_create_division(self, client: AsyncClient, test_admin, admin_auth_headers):
        """Test creating a new division"""
        division_data = {
            "name": "New Division",
            "description": "A new test division"
        }
        response = await client.post(
            "/api/admin/divisions",
            json=division_data,
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == division_data["name"]
        assert data["description"] == division_data["description"]
        assert "id" in data

    async def test_update_division(
        self, client: AsyncClient, test_admin, admin_auth_headers, test_division
    ):
        """Test updating a division"""
        update_data = {
            "name": "Updated Division Name",
            "description": "Updated description"
        }
        response = await client.put(
            f"/api/admin/divisions/{test_division.id}",
            json=update_data,
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]

    async def test_update_nonexistent_division(self, client: AsyncClient, test_admin, admin_auth_headers):
        """Test updating nonexistent division fails"""
        response = await client.put(
            "/api/admin/divisions/99999",
            json={"name": "Test"},
            headers=admin_auth_headers
        )
        assert response.status_code == 404

    async def test_delete_division(
        self, client: AsyncClient, test_admin, admin_auth_headers, test_division
    ):
        """Test soft deleting a division"""
        response = await client.delete(
            f"/api/admin/divisions/{test_division.id}",
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()


class TestQuestionCRUD:
    """Test question CRUD operations"""

    async def test_get_questions(
        self, client: AsyncClient, test_admin, admin_auth_headers, test_question
    ):
        """Test getting all questions"""
        response = await client.get("/api/admin/questions", headers=admin_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_get_questions_with_filters(
        self, client: AsyncClient, test_admin, admin_auth_headers, test_question
    ):
        """Test getting questions with filters"""
        response = await client.get(
            "/api/admin/questions?question_type=mcq&difficulty=easy",
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert all(q["question_type"] == "mcq" for q in data)

    async def test_create_question(
        self, client: AsyncClient, test_admin, admin_auth_headers, test_division
    ):
        """Test creating a new question"""
        question_data = {
            "question_type": "mcq",
            "question_text": "What is the capital of France?",
            "division_id": test_division.id,
            "options": ["London", "Paris", "Berlin", "Madrid"],
            "correct_answer": "Paris",
            "marks": 2.0,
            "difficulty": "easy"
        }
        response = await client.post(
            "/api/admin/questions",
            json=question_data,
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["question_text"] == question_data["question_text"]
        assert data["correct_answer"] == question_data["correct_answer"]

    async def test_update_question(
        self, client: AsyncClient, test_admin, admin_auth_headers, test_question
    ):
        """Test updating a question"""
        update_data = {
            "question_text": "Updated question text",
            "marks": 3.0
        }
        response = await client.put(
            f"/api/admin/questions/{test_question.id}",
            json=update_data,
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["question_text"] == update_data["question_text"]
        assert data["marks"] == update_data["marks"]

    async def test_delete_question(
        self, client: AsyncClient, test_admin, admin_auth_headers, test_question
    ):
        """Test soft deleting a question"""
        response = await client.delete(
            f"/api/admin/questions/{test_question.id}",
            headers=admin_auth_headers
        )
        assert response.status_code == 200


class TestTestManagement:
    """Test test management operations"""

    async def test_get_tests(self, client: AsyncClient, test_admin, admin_auth_headers, test_test):
        """Test getting all tests"""
        response = await client.get("/api/admin/tests", headers=admin_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_generate_test(
        self, client: AsyncClient, test_admin, admin_auth_headers, test_division
    ):
        """Test generating a new test"""
        test_data = {
            "title": "Generated Test",
            "description": "A generated test",
            "division_id": test_division.id,
            "duration_minutes": 60,
            "mcq": {
                "enabled": True,
                "count": 10,
                "marks_per_question": 1
            }
        }
        response = await client.post(
            "/api/admin/tests/generate",
            json=test_data,
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == test_data["title"]
        assert data["mcq_count"] == 10

    async def test_update_test(
        self, client: AsyncClient, test_admin, admin_auth_headers, test_test
    ):
        """Test updating a test"""
        update_data = {
            "title": "Updated Test Title",
            "duration_minutes": 90
        }
        response = await client.put(
            f"/api/admin/tests/{test_test.id}",
            json=update_data,
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == update_data["title"]
        assert data["duration_minutes"] == update_data["duration_minutes"]

    async def test_publish_test(
        self, client: AsyncClient, test_admin, admin_auth_headers, test_test, test_session
    ):
        """Test publishing a test"""
        # First unpublish it
        test_test.is_published = False
        await test_session.commit()

        response = await client.post(
            f"/api/admin/tests/{test_test.id}/publish",
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        assert "published" in response.json()["message"].lower()


class TestCandidateManagement:
    """Test candidate management operations"""

    async def test_get_candidates(self, client: AsyncClient, test_admin, admin_auth_headers, test_user):
        """Test getting all candidates"""
        response = await client.get("/api/admin/candidates", headers=admin_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_get_candidate_profile(
        self, client: AsyncClient, test_admin, admin_auth_headers, test_user
    ):
        """Test getting a candidate's full profile"""
        response = await client.get(
            f"/api/admin/candidates/{test_user.id}/profile",
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user.id
        assert data["email"] == test_user.email
        assert "test_attempts" in data
        assert "messages" in data

    async def test_approve_candidate(
        self, client: AsyncClient, test_admin, admin_auth_headers, test_user
    ):
        """Test approving a candidate"""
        response = await client.post(
            f"/api/admin/candidates/{test_user.id}/approve",
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        assert "approved" in response.json()["message"].lower()

    async def test_reject_candidate(
        self, client: AsyncClient, test_admin, admin_auth_headers, test_user
    ):
        """Test rejecting a candidate"""
        response = await client.post(
            f"/api/admin/candidates/{test_user.id}/reject",
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        assert "rejected" in response.json()["message"].lower()

    async def test_get_nonexistent_candidate_profile(
        self, client: AsyncClient, test_admin, admin_auth_headers
    ):
        """Test getting nonexistent candidate profile fails"""
        response = await client.get(
            "/api/admin/candidates/99999/profile",
            headers=admin_auth_headers
        )
        assert response.status_code == 404


class TestTestAttempts:
    """Test test attempts review endpoint"""

    async def test_get_all_attempts(
        self, client: AsyncClient, test_admin, admin_auth_headers, test_attempt
    ):
        """Test getting all test attempts"""
        response = await client.get("/api/admin/attempts", headers=admin_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_get_flagged_attempts_only(
        self, client: AsyncClient, test_admin, admin_auth_headers, test_attempt, test_session
    ):
        """Test getting only flagged attempts"""
        # Flag the attempt
        test_attempt.is_flagged = True
        test_attempt.flag_reason = "Multiple tab switches"
        await test_session.commit()

        response = await client.get(
            "/api/admin/attempts?flagged_only=true",
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert all(a["is_flagged"] for a in data)


class TestAdminMessaging:
    """Test admin messaging endpoint"""

    async def test_send_message(
        self, client: AsyncClient, test_admin, admin_auth_headers, test_user
    ):
        """Test sending a message to a candidate"""
        response = await client.post(
            "/api/admin/messages",
            params={
                "recipient_id": test_user.id,
                "subject": "Test Message",
                "content": "This is a test message",
                "reason": "Testing"
            },
            headers=admin_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "message_id" in data

    async def test_send_message_to_nonexistent_user(
        self, client: AsyncClient, test_admin, admin_auth_headers
    ):
        """Test sending message to nonexistent user fails"""
        response = await client.post(
            "/api/admin/messages",
            params={
                "recipient_id": 99999,
                "subject": "Test",
                "content": "Test"
            },
            headers=admin_auth_headers
        )
        assert response.status_code == 404
