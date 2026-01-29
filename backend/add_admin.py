"""
Quick script to add admin user only
"""
import asyncio
from app.database import async_session_maker, init_db
from app.models import User
from app.models.user import UserRole
from app.services.auth import get_password_hash
from sqlalchemy import select


async def add_admin():
    await init_db()
    
    admin_email = "admin@autonexai360.com"
    admin_password = "Autonexai360@123"
    
    async with async_session_maker() as db:
        # Check if admin already exists
        result = await db.execute(select(User).where(User.email == admin_email))
        existing = result.scalar_one_or_none()
        
        if existing:
            print(f"✅ Admin already exists: {admin_email}")
            print("   Updating password...")
            existing.hashed_password = get_password_hash(admin_password)
            await db.commit()
            print("   Password updated!")
            return
        
        # Create admin user
        admin = User(
            email=admin_email,
            hashed_password=get_password_hash(admin_password),
            name="Admin",
            registration_number="ADMIN001",
            degree="Admin",
            branch="Administration",
            batch="2024",
            college="Autonex",
            role=UserRole.ADMIN,  # Use enum value
            is_verified=True,  # Admin should be verified
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
        print(f"   Email: {admin_email}")
        print(f"   Password: {admin_password}")


if __name__ == "__main__":
    asyncio.run(add_admin())


