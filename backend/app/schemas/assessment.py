from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AssessmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    company_name: Optional[str] = None
    duration_minutes: int = 60
    total_questions: int = 0


class AssessmentCreate(AssessmentBase):
    pass


class AssessmentResponse(AssessmentBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class BadgeResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    icon_url: Optional[str] = None
    is_super_badge: bool
    earned_at: datetime

    class Config:
        from_attributes = True


class AssessmentStats(BaseModel):
    tests_enrolled: int
    tests_completed: int
    badges: int
    super_badges: int
