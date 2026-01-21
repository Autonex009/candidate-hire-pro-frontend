"""
Tests for Authentication API endpoints
"""
import pytest
from httpx import AsyncClient


class TestHealthCheck:
    """Test health check endpoints"""

    async def test_root_endpoint(self, client: AsyncClient):
        """Test the root endpoint returns API info"""
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["status"] == "running"

    async def test_health_endpoint(self, client: AsyncClient):
        """Test the health check endpoint"""
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestRegistration:
    """Test user registration endpoint"""

    async def test_register_success(self, client: AsyncClient):
        """Test successful user registration"""
        user_data = {
            "email": "newuser@example.com",
            "name": "New User",
            "registration_number": "NEW001",
            "password": "securepassword123"
        }
        response = await client.post("/api/auth/register", json=user_data)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["name"] == user_data["name"]
        assert data["registration_number"] == user_data["registration_number"]
        assert "id" in data
        assert "hashed_password" not in data

    async def test_register_duplicate_email(self, client: AsyncClient, test_user):
        """Test registration fails with duplicate email"""
        user_data = {
            "email": test_user.email,  # Duplicate email
            "name": "Another User",
            "registration_number": "ANOTHER001",
            "password": "password123"
        }
        response = await client.post("/api/auth/register", json=user_data)
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]

    async def test_register_duplicate_registration_number(self, client: AsyncClient, test_user):
        """Test registration fails with duplicate registration number"""
        user_data = {
            "email": "unique@example.com",
            "name": "Another User",
            "registration_number": test_user.registration_number,  # Duplicate
            "password": "password123"
        }
        response = await client.post("/api/auth/register", json=user_data)
        assert response.status_code == 400
        assert "Registration number already exists" in response.json()["detail"]

    async def test_register_invalid_email(self, client: AsyncClient):
        """Test registration fails with invalid email"""
        user_data = {
            "email": "invalid-email",
            "name": "Test User",
            "registration_number": "TEST002",
            "password": "password123"
        }
        response = await client.post("/api/auth/register", json=user_data)
        assert response.status_code == 422  # Validation error

    async def test_register_missing_fields(self, client: AsyncClient):
        """Test registration fails with missing required fields"""
        user_data = {
            "email": "test@example.com"
            # Missing name, registration_number, password
        }
        response = await client.post("/api/auth/register", json=user_data)
        assert response.status_code == 422


class TestLogin:
    """Test user login endpoint"""

    async def test_login_success(self, client: AsyncClient, test_user):
        """Test successful login"""
        login_data = {
            "username": test_user.email,
            "password": "testpassword123"
        }
        response = await client.post(
            "/api/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, client: AsyncClient, test_user):
        """Test login fails with wrong password"""
        login_data = {
            "username": test_user.email,
            "password": "wrongpassword"
        }
        response = await client.post(
            "/api/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]

    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login fails with nonexistent email"""
        login_data = {
            "username": "nonexistent@example.com",
            "password": "anypassword"
        }
        response = await client.post(
            "/api/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 401


class TestGetCurrentUser:
    """Test get current user endpoint"""

    async def test_get_me_authenticated(self, client: AsyncClient, test_user, auth_headers):
        """Test getting current user profile with valid token"""
        response = await client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["name"] == test_user.name
        assert data["id"] == test_user.id

    async def test_get_me_unauthenticated(self, client: AsyncClient):
        """Test getting current user fails without token"""
        response = await client.get("/api/auth/me")
        assert response.status_code == 401

    async def test_get_me_invalid_token(self, client: AsyncClient):
        """Test getting current user fails with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await client.get("/api/auth/me", headers=headers)
        assert response.status_code == 401

    async def test_get_me_expired_token(self, client: AsyncClient):
        """Test getting current user fails with malformed token"""
        headers = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxfQ.invalid"}
        response = await client.get("/api/auth/me", headers=headers)
        assert response.status_code == 401
