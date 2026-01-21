"""
Tests for Assessments API endpoints
"""
import pytest
from httpx import AsyncClient
from app.models.assessment import Assessment, Badge, AssessmentAttempt


class TestGetAssessments:
    """Test get assessments endpoints"""

    async def test_get_all_assessments_authenticated(
        self, client: AsyncClient, test_user, auth_headers, test_assessment
    ):
        """Test getting all assessments with authentication"""
        response = await client.get("/api/assessments", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["title"] == test_assessment.title

    async def test_get_all_assessments_unauthenticated(self, client: AsyncClient, test_assessment):
        """Test getting all assessments fails without authentication"""
        response = await client.get("/api/assessments")
        assert response.status_code == 401

    async def test_get_company_assessments(
        self, client: AsyncClient, test_user, auth_headers, test_assessment
    ):
        """Test getting company-specific assessments"""
        response = await client.get("/api/assessments/company", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # test_assessment has a company_name so it should be included
        assert any(a["company_name"] == test_assessment.company_name for a in data)


class TestUserBadges:
    """Test user badges endpoint"""

    async def test_get_user_badges_empty(self, client: AsyncClient, test_user, auth_headers):
        """Test getting badges when none exist"""
        response = await client.get("/api/assessments/badges", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    async def test_get_user_badges_with_badges(
        self, client: AsyncClient, test_user, auth_headers, test_session
    ):
        """Test getting badges after earning some"""
        # Create badges for user
        badge1 = Badge(
            user_id=test_user.id,
            title="Test Badge",
            description="A test badge",
            is_super_badge=False
        )
        badge2 = Badge(
            user_id=test_user.id,
            title="Super Badge",
            description="A super badge",
            is_super_badge=True
        )
        test_session.add_all([badge1, badge2])
        await test_session.commit()

        response = await client.get("/api/assessments/badges", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    async def test_get_user_badges_unauthenticated(self, client: AsyncClient):
        """Test getting badges fails without authentication"""
        response = await client.get("/api/assessments/badges")
        assert response.status_code == 401


class TestAssessmentStats:
    """Test assessment statistics endpoint"""

    async def test_get_assessment_stats_empty(self, client: AsyncClient, test_user, auth_headers):
        """Test getting assessment stats with no attempts"""
        response = await client.get("/api/assessments/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["tests_enrolled"] == 0
        assert data["tests_completed"] == 0
        assert data["badges"] == 0
        assert data["super_badges"] == 0

    async def test_get_assessment_stats_with_attempts(
        self, client: AsyncClient, test_user, auth_headers, test_assessment, test_session
    ):
        """Test getting assessment stats after attempting assessments"""
        # Create assessment attempt
        attempt = AssessmentAttempt(
            user_id=test_user.id,
            assessment_id=test_assessment.id,
            completed=True
        )
        test_session.add(attempt)
        await test_session.commit()

        response = await client.get("/api/assessments/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["tests_enrolled"] == 1
        assert data["tests_completed"] == 1

    async def test_get_assessment_stats_with_badges(
        self, client: AsyncClient, test_user, auth_headers, test_session
    ):
        """Test getting assessment stats with badges"""
        # Create regular and super badges
        badge1 = Badge(
            user_id=test_user.id,
            title="Regular Badge",
            description="Regular",
            is_super_badge=False
        )
        badge2 = Badge(
            user_id=test_user.id,
            title="Super Badge",
            description="Super",
            is_super_badge=True
        )
        test_session.add_all([badge1, badge2])
        await test_session.commit()

        response = await client.get("/api/assessments/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["badges"] == 1
        assert data["super_badges"] == 1

    async def test_get_assessment_stats_unauthenticated(self, client: AsyncClient):
        """Test getting assessment stats fails without authentication"""
        response = await client.get("/api/assessments/stats")
        assert response.status_code == 401
