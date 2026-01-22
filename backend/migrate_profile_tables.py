"""
Migration script to add profile tables for resume parsing feature.
Run this script to add the new tables to your database.
"""
import asyncio
import sys
sys.path.insert(0, '.')

from sqlalchemy import text


async def migrate():
    from app.database import engine, Base
    # Import all models to register them with Base
    from app.models import (
        CandidateProfile, Skill, Education, WorkExperience, Project,
        Certification, Publication, Award, UserLanguage, profile_skills
    )
    
    async with engine.begin() as conn:
        # Create all new tables
        await conn.run_sync(Base.metadata.create_all)
        print("✅ Created profile tables:")
        print("   - candidate_profiles")
        print("   - skills")
        print("   - profile_skills (junction)")
        print("   - education")
        print("   - work_experience")
        print("   - projects")
        print("   - certifications")
        print("   - publications")
        print("   - awards")
        print("   - user_languages")
    
    print("\n🎉 Migration completed successfully!")


if __name__ == "__main__":
    asyncio.run(migrate())
