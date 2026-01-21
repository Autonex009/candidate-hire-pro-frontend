from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration_hours: int = 0


class CourseCreate(CourseBase):
    cover_image: Optional[str] = None


class CourseResponse(CourseBase):
    id: int
    cover_image: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CourseEnrollmentResponse(BaseModel):
    id: int
    course_id: int
    progress: float
    completed: bool
    enrolled_at: datetime
    completed_at: Optional[datetime] = None
    course: CourseResponse

    class Config:
        from_attributes = True


class CourseStats(BaseModel):
    courses_enrolled: int
    completion_percentage: float
    completed: int
    expired: int
