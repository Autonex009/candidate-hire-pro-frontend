from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from ..models.user import User
from ..models.course import Course, CourseEnrollment
from ..schemas.course import CourseResponse, CourseEnrollmentResponse, CourseStats
from ..services.auth import get_current_user

router = APIRouter(prefix="/api/courses", tags=["Courses"])


@router.get("", response_model=list[CourseResponse])
async def get_all_courses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all available courses"""
    result = await db.execute(
        select(Course).where(Course.is_active == True).order_by(Course.created_at.desc())
    )
    return result.scalars().all()


@router.get("/enrolled", response_model=list[CourseEnrollmentResponse])
async def get_enrolled_courses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's enrolled courses"""
    result = await db.execute(
        select(CourseEnrollment, Course)
        .join(Course, CourseEnrollment.course_id == Course.id)
        .where(CourseEnrollment.user_id == current_user.id)
        .order_by(CourseEnrollment.enrolled_at.desc())
    )
    rows = result.all()
    
    enrollments = []
    for enrollment, course in rows:
        enrollments.append(CourseEnrollmentResponse(
            id=enrollment.id,
            course_id=enrollment.course_id,
            progress=enrollment.progress,
            completed=enrollment.completed,
            enrolled_at=enrollment.enrolled_at,
            completed_at=enrollment.completed_at,
            course=CourseResponse(
                id=course.id,
                title=course.title,
                description=course.description,
                cover_image=course.cover_image,
                duration_hours=course.duration_hours,
                is_active=course.is_active,
                created_at=course.created_at
            )
        ))
    
    return enrollments


@router.get("/stats", response_model=CourseStats)
async def get_course_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get course statistics for current user"""
    result = await db.execute(
        select(CourseEnrollment).where(CourseEnrollment.user_id == current_user.id)
    )
    enrollments = result.scalars().all()
    
    total = len(enrollments)
    completed = sum(1 for e in enrollments if e.completed)
    total_progress = sum(e.progress for e in enrollments)
    
    return CourseStats(
        courses_enrolled=total,
        completion_percentage=total_progress / total if total > 0 else 0,
        completed=completed,
        expired=0  # Would need expiry logic
    )
