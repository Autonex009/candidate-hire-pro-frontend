"""
Tests for Courses API endpoints
"""
import pytest
from httpx import AsyncClient
from app.models.course import CourseEnrollment


class TestGetCourses:
    """Test get courses endpoints"""

    async def test_get_all_courses_authenticated(self, client: AsyncClient, test_user, auth_headers, test_course):
        """Test getting all courses with authentication"""
        response = await client.get("/api/courses", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["title"] == test_course.title

    async def test_get_all_courses_unauthenticated(self, client: AsyncClient, test_course):
        """Test getting all courses fails without authentication"""
        response = await client.get("/api/courses")
        assert response.status_code == 401

    async def test_get_enrolled_courses_empty(self, client: AsyncClient, test_user, auth_headers):
        """Test getting enrolled courses when none exist"""
        response = await client.get("/api/courses/enrolled", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    async def test_get_enrolled_courses_with_enrollment(
        self, client: AsyncClient, test_user, auth_headers, test_course, test_session
    ):
        """Test getting enrolled courses after enrolling"""
        # Create enrollment
        enrollment = CourseEnrollment(
            user_id=test_user.id,
            course_id=test_course.id,
            progress=50
        )
        test_session.add(enrollment)
        await test_session.commit()

        response = await client.get("/api/courses/enrolled", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["course"]["id"] == test_course.id
        assert data[0]["progress"] == 50


class TestCourseStats:
    """Test course statistics endpoint"""

    async def test_get_course_stats_empty(self, client: AsyncClient, test_user, auth_headers):
        """Test getting course stats with no enrollments"""
        response = await client.get("/api/courses/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["courses_enrolled"] == 0
        assert data["completed"] == 0
        assert data["completion_percentage"] == 0

    async def test_get_course_stats_with_enrollments(
        self, client: AsyncClient, test_user, auth_headers, test_course, test_session
    ):
        """Test getting course stats after enrolling"""
        # Create enrollment with some progress
        enrollment = CourseEnrollment(
            user_id=test_user.id,
            course_id=test_course.id,
            progress=75,
            completed=False
        )
        test_session.add(enrollment)
        await test_session.commit()

        response = await client.get("/api/courses/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["courses_enrolled"] == 1
        assert data["completed"] == 0
        assert data["completion_percentage"] == 75

    async def test_get_course_stats_completed(
        self, client: AsyncClient, test_user, auth_headers, test_course, test_session
    ):
        """Test getting course stats with completed course"""
        # Create completed enrollment
        enrollment = CourseEnrollment(
            user_id=test_user.id,
            course_id=test_course.id,
            progress=100,
            completed=True
        )
        test_session.add(enrollment)
        await test_session.commit()

        response = await client.get("/api/courses/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["courses_enrolled"] == 1
        assert data["completed"] == 1

    async def test_get_course_stats_unauthenticated(self, client: AsyncClient):
        """Test getting course stats fails without authentication"""
        response = await client.get("/api/courses/stats")
        assert response.status_code == 401
