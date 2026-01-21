from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from ..models.user import User
from ..models.assessment import Assessment, AssessmentAttempt, Badge
from ..schemas.assessment import AssessmentResponse, BadgeResponse, AssessmentStats
from ..services.auth import get_current_user

router = APIRouter(prefix="/api/assessments", tags=["Assessments"])


@router.get("", response_model=list[AssessmentResponse])
async def get_all_assessments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all available assessments"""
    result = await db.execute(
        select(Assessment).where(Assessment.is_active == True).order_by(Assessment.created_at.desc())
    )
    return result.scalars().all()


@router.get("/company", response_model=list[AssessmentResponse])
async def get_company_assessments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get company-specific assessments"""
    result = await db.execute(
        select(Assessment)
        .where(Assessment.is_active == True)
        .where(Assessment.company_name.isnot(None))
        .order_by(Assessment.company_name)
    )
    return result.scalars().all()


@router.get("/badges", response_model=list[BadgeResponse])
async def get_user_badges(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's earned badges"""
    result = await db.execute(
        select(Badge)
        .where(Badge.user_id == current_user.id)
        .order_by(Badge.earned_at.desc())
    )
    return result.scalars().all()


@router.get("/stats", response_model=AssessmentStats)
async def get_assessment_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get assessment statistics for current user"""
    # Get attempts
    attempts = await db.execute(
        select(AssessmentAttempt).where(AssessmentAttempt.user_id == current_user.id)
    )
    all_attempts = attempts.scalars().all()
    
    # Get badges
    badges = await db.execute(
        select(Badge).where(Badge.user_id == current_user.id)
    )
    all_badges = badges.scalars().all()
    
    return AssessmentStats(
        tests_enrolled=len(all_attempts),
        tests_completed=sum(1 for a in all_attempts if a.completed),
        badges=sum(1 for b in all_badges if not b.is_super_badge),
        super_badges=sum(1 for b in all_badges if b.is_super_badge)
    )
