"""
Quick script to add admin user only
"""
import asyncio
from app.database import async_session_maker, init_db
from app.models import User
from app.services.auth import get_password_hash
from sqlalchemy import select


async def add_admin():
    await init_db()
    
    async with async_session_maker() as db:
        # Check if admin already exists
        result = await db.execute(select(User).where(User.email == "admin@autonex.ai"))
        existing = result.scalar_one_or_none()
        
        if existing:
            print(f"✅ Admin already exists: admin@autonex.ai")
            return
        
        # Create admin user
        admin = User(
            email="admin@autonex.ai",
            hashed_password=get_password_hash("admin123"),
            name="Admin",
            registration_number="ADMIN001",
            degree="Admin",
            branch="Administration",
            batch="2024",
            college="Autonex",
            role="admin",
            neo_pat_score=0,
            solved_easy=0,
            solved_medium=0,
            solved_hard=0,
            badges_count=0,
            super_badges_count=0
        )
        db.add(admin)
        await db.commit()
        print("✅ Admin user created!")
        print("   Email: admin@autonex.ai")
        print("   Password: admin123")


if __name__ == "__main__":
    asyncio.run(add_admin())
