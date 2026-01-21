"""
Tests for Jobs API endpoints
"""
import pytest
from httpx import AsyncClient
from app.models.job import Job, JobApplication


class TestGetJobs:
    """Test get jobs endpoints"""

    async def test_get_all_jobs_authenticated(self, client: AsyncClient, test_user, auth_headers, test_job):
        """Test getting all jobs with authentication"""
        response = await client.get("/api/jobs", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["company_name"] == test_job.company_name

    async def test_get_all_jobs_unauthenticated(self, client: AsyncClient, test_job):
        """Test getting all jobs fails without authentication"""
        response = await client.get("/api/jobs")
        assert response.status_code == 401

    async def test_get_my_jobs_empty(self, client: AsyncClient, test_user, auth_headers):
        """Test getting my jobs when no applications exist"""
        response = await client.get("/api/jobs/my", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    async def test_get_my_jobs_with_applications(
        self, client: AsyncClient, test_user, auth_headers, test_job, test_session
    ):
        """Test getting my jobs after applying"""
        # First apply to the job
        application = JobApplication(user_id=test_user.id, job_id=test_job.id)
        test_session.add(application)
        await test_session.commit()

        response = await client.get("/api/jobs/my", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == test_job.id


class TestApplyToJob:
    """Test job application endpoint"""

    async def test_apply_to_job_success(self, client: AsyncClient, test_user, auth_headers, test_job):
        """Test successful job application"""
        response = await client.post(f"/api/jobs/{test_job.id}/apply", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_job.id
        assert data["application_status"] == "applied"

    async def test_apply_to_job_twice(self, client: AsyncClient, test_user, auth_headers, test_job):
        """Test applying to same job twice fails"""
        # First application
        response1 = await client.post(f"/api/jobs/{test_job.id}/apply", headers=auth_headers)
        assert response1.status_code == 200

        # Second application should fail
        response2 = await client.post(f"/api/jobs/{test_job.id}/apply", headers=auth_headers)
        assert response2.status_code == 400
        assert "Already applied" in response2.json()["detail"]

    async def test_apply_to_nonexistent_job(self, client: AsyncClient, test_user, auth_headers):
        """Test applying to nonexistent job fails"""
        response = await client.post("/api/jobs/99999/apply", headers=auth_headers)
        assert response.status_code == 404
        assert "Job not found" in response.json()["detail"]

    async def test_apply_to_job_unauthenticated(self, client: AsyncClient, test_job):
        """Test applying to job fails without authentication"""
        response = await client.post(f"/api/jobs/{test_job.id}/apply")
        assert response.status_code == 401


class TestJobStats:
    """Test job statistics endpoint"""

    async def test_get_job_stats_empty(self, client: AsyncClient, test_user, auth_headers):
        """Test getting job stats with no applications"""
        response = await client.get("/api/jobs/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_jobs" in data
        assert data["placed"] == 0
        assert data["waiting"] == 0
        assert data["rejected"] == 0

    async def test_get_job_stats_with_applications(
        self, client: AsyncClient, test_user, auth_headers, test_job, test_session
    ):
        """Test getting job stats after applying"""
        # Apply to job
        application = JobApplication(user_id=test_user.id, job_id=test_job.id)
        test_session.add(application)
        await test_session.commit()

        response = await client.get("/api/jobs/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["waiting"] == 1  # Applied status counts as waiting

    async def test_get_job_stats_unauthenticated(self, client: AsyncClient):
        """Test getting job stats fails without authentication"""
        response = await client.get("/api/jobs/stats")
        assert response.status_code == 401
