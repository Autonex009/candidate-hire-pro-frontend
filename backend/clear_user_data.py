"""
Clear user and submission data while preserving test/question content.

Tables CLEARED:
- users (and cascade: candidate_profiles, all profile related tables)
- jobs
- job_applications
- test_results (submissions)
- test_answers
- notifications
- messages
- resume_parsing_jobs
- assessments, assessment_results
- course_enrollments

Tables PRESERVED:
- tests (test definitions)
- divisions
- questions
- skills
"""

import asyncio
import os
import sys

# Add the app directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker


async def clear_user_data():
    """Clear all user-related data while preserving test/question content."""
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not set")
        return
    
    # Convert to async URL if needed
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    print(f"Connecting to database...")
    engine = create_async_engine(database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    # Tables to clear (order matters for foreign key constraints)
    # Clear in order: dependent tables first, then parent tables
    tables_to_clear = [
        # Profile related (depend on candidate_profiles)
        "profile_skills",
        "user_languages",
        "awards",
        "publications", 
        "certifications",
        "projects",
        "work_experience",
        "education",
        
        # Notifications and messages
        "notifications",
        "messages",
        
        # Resume jobs
        "resume_parsing_jobs",
        
        # Test submissions (depend on users and tests)
        "test_answers",
        "test_results",
        
        # Assessments
        "assessment_results",
        "assessments",
        
        # Course enrollments
        "course_enrollments",
        
        # Job applications
        "job_applications",
        
        # Parent tables
        "candidate_profiles",  # depends on users
        "jobs",               # independent
        "users",              # parent
    ]
    
    async with async_session() as session:
        try:
            print("\n" + "="*60)
            print("CLEARING USER DATA")
            print("="*60 + "\n")
            
            for table in tables_to_clear:
                try:
                    # Check if table exists
                    check_query = text(f"""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_name = :table_name
                        )
                    """)
                    result = await session.execute(check_query, {"table_name": table})
                    exists = result.scalar()
                    
                    if exists:
                        # Get count before
                        count_result = await session.execute(text(f'SELECT COUNT(*) FROM "{table}"'))
                        count = count_result.scalar()
                        
                        if count > 0:
                            # Use TRUNCATE with CASCADE to handle any remaining FK dependencies
                            await session.execute(text(f'TRUNCATE TABLE "{table}" CASCADE'))
                            print(f"✓ Cleared {table}: {count} rows deleted")
                        else:
                            print(f"  {table}: already empty")
                    else:
                        print(f"  {table}: table does not exist (skipped)")
                        
                except Exception as e:
                    print(f"✗ Error clearing {table}: {e}")
            
            await session.commit()
            
            print("\n" + "="*60)
            print("PRESERVED TABLES (not touched)")
            print("="*60 + "\n")
            
            preserved = ["tests", "divisions", "questions", "skills", "courses"]
            for table in preserved:
                try:
                    result = await session.execute(text(f'SELECT COUNT(*) FROM "{table}"'))
                    count = result.scalar()
                    print(f"  {table}: {count} rows preserved")
                except:
                    print(f"  {table}: table does not exist")
            
            print("\n✅ User data cleared successfully!")
            print("   Test content (questions, divisions) preserved.")
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            await session.rollback()
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    print("\n⚠️  WARNING: This will DELETE all user data!")
    print("   - Users, profiles, submissions")
    print("   - Jobs and applications")
    print("   - Notifications and messages")
    print("\n   Test content (questions, divisions) will be PRESERVED.\n")
    
    confirm = input("Type 'DELETE' to confirm: ")
    if confirm == "DELETE":
        asyncio.run(clear_user_data())
    else:
        print("Cancelled.")
