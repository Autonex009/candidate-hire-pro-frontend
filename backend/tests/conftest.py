"""
Pytest configuration and fixtures for API testing
"""
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.database import Base, get_db
from app.models.user import User, UserRole
from app.models.job import Job, JobApplication, JobStatus
from app.models.course import Course, CourseEnrollment
from app.models.assessment import Assessment, Badge, AssessmentAttempt
from app.models.test import Division, Question, Test, TestAttempt
from app.services.auth import get_password_hash, create_access_token

# Use in-memory SQLite for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def test_engine():
    """Create a test database engine."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture(scope="function")
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async_session_maker = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session_maker() as session:
        yield session


@pytest.fixture(scope="function")
async def client(test_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with database override."""
    async def override_get_db():
        try:
            yield test_session
            await test_session.commit()
        except Exception:
            await test_session.rollback()
            raise

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(test_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        email="testuser@example.com",
        name="Test User",
        registration_number="TEST001",
        hashed_password=get_password_hash("testpassword123"),
        role=UserRole.STUDENT,
        degree="B.Tech",
        branch="Computer Science",
        batch="2025",
        college="Test College"
    )
    test_session.add(user)
    await test_session.commit()
    await test_session.refresh(user)
    return user


@pytest.fixture
async def test_admin(test_session: AsyncSession) -> User:
    """Create a test admin user."""
    admin = User(
        email="admin@example.com",
        name="Admin User",
        registration_number="ADMIN001",
        hashed_password=get_password_hash("adminpassword123"),
        role=UserRole.ADMIN,
        degree="B.Tech",
        branch="Computer Science",
        batch="2025",
        college="Test College"
    )
    test_session.add(admin)
    await test_session.commit()
    await test_session.refresh(admin)
    return admin


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """Create authentication headers for test user."""
    token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_auth_headers(test_admin: User) -> dict:
    """Create authentication headers for admin user."""
    token = create_access_token(data={"sub": str(test_admin.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def test_job(test_session: AsyncSession) -> Job:
    """Create a test job."""
    from app.models.job import OfferType
    job = Job(
        company_name="Test Company",
        company_logo="https://example.com/logo.png",
        role="Software Engineer",
        location="Remote",
        ctc=10.0,  # Float value in LPA
        job_type="Full Time",
        offer_type=OfferType.REGULAR,
        is_active=True
    )
    test_session.add(job)
    await test_session.commit()
    await test_session.refresh(job)
    return job


@pytest.fixture
async def test_course(test_session: AsyncSession) -> Course:
    """Create a test course."""
    course = Course(
        title="Test Course",
        description="A test course for testing",
        cover_image="https://example.com/cover.png",
        duration_hours=10,
        is_active=True
    )
    test_session.add(course)
    await test_session.commit()
    await test_session.refresh(course)
    return course


@pytest.fixture
async def test_assessment(test_session: AsyncSession) -> Assessment:
    """Create a test assessment."""
    assessment = Assessment(
        title="Test Assessment",
        description="A test assessment",
        company_name="Test Company",
        is_active=True
    )
    test_session.add(assessment)
    await test_session.commit()
    await test_session.refresh(assessment)
    return assessment


@pytest.fixture
async def test_division(test_session: AsyncSession) -> Division:
    """Create a test division."""
    division = Division(
        name="Test Division",
        description="A test division for testing",
        is_active=True
    )
    test_session.add(division)
    await test_session.commit()
    await test_session.refresh(division)
    return division


@pytest.fixture
async def test_question(test_session: AsyncSession, test_division: Division) -> Question:
    """Create a test MCQ question."""
    question = Question(
        question_type="mcq",
        question_text="What is 2 + 2?",
        division_id=test_division.id,
        options=["3", "4", "5", "6"],
        correct_answer="4",
        marks=1.0,
        difficulty="easy",
        is_active=True
    )
    test_session.add(question)
    await test_session.commit()
    await test_session.refresh(question)
    return question


@pytest.fixture
async def test_test(test_session: AsyncSession, test_division: Division) -> Test:
    """Create a test exam."""
    test_obj = Test(
        title="Sample Test",
        description="A sample test for testing",
        division_id=test_division.id,
        duration_minutes=60,
        total_questions=10,
        total_marks=10,
        passing_marks=5,
        mcq_count=10,
        is_active=True,
        is_published=True
    )
    test_session.add(test_obj)
    await test_session.commit()
    await test_session.refresh(test_obj)
    return test_obj


@pytest.fixture
async def test_attempt(test_session: AsyncSession, test_user: User, test_test: Test) -> TestAttempt:
    """Create a test attempt."""
    from datetime import datetime, timezone

    attempt = TestAttempt(
        user_id=test_user.id,
        test_id=test_test.id,
        status="in_progress",
        total_marks=test_test.total_marks,
        started_at=datetime.now(timezone.utc)  # Use timezone-aware datetime
    )
    test_session.add(attempt)
    await test_session.commit()
    await test_session.refresh(attempt)
    return attempt
