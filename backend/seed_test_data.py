"""
Seed script for test-related data: divisions, questions, and sample tests
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import engine, async_session_maker
from app.models.test import Division, Question, Test, TestQuestion


async def seed_divisions(db: AsyncSession):
    """Create sample divisions"""
    divisions = [
        {"name": "Data Annotator", "description": "Data labeling and annotation specialists"},
        {"name": "QA Analyst", "description": "Quality assurance and testing professionals"},
        {"name": "Content Moderator", "description": "Content review and moderation specialists"},
        {"name": "Image Analyst", "description": "Image processing and analysis experts"},
        {"name": "Video Analyst", "description": "Video annotation and analysis professionals"},
    ]
    
    for div_data in divisions:
        # Check if exists
        result = await db.execute(
            select(Division).where(Division.name == div_data["name"])
        )
        if not result.scalar_one_or_none():
            division = Division(**div_data)
            db.add(division)
            print(f"Created division: {div_data['name']}")
    
    await db.commit()


async def seed_questions(db: AsyncSession):
    """Create sample questions"""
    mcq_questions = [
        {
            "question_type": "mcq",
            "question_text": "Which of the following is a valid Python data type?",
            "options": ["integer", "floating", "stringy", "listy"],
            "correct_answer": "integer",
            "marks": 1.0,
            "difficulty": "easy"
        },
        {
            "question_type": "mcq",
            "question_text": "What is the output of print(2 ** 3)?",
            "options": ["6", "8", "9", "5"],
            "correct_answer": "8",
            "marks": 1.0,
            "difficulty": "easy"
        },
        {
            "question_type": "mcq",
            "question_text": "Which HTML tag is used for creating a hyperlink?",
            "options": ["<link>", "<a>", "<href>", "<url>"],
            "correct_answer": "<a>",
            "marks": 1.0,
            "difficulty": "easy"
        },
        {
            "question_type": "mcq",
            "question_text": "What does CSS stand for?",
            "options": ["Creative Style Sheets", "Cascading Style Sheets", "Computer Style Sheets", "Colorful Style Sheets"],
            "correct_answer": "Cascading Style Sheets",
            "marks": 1.0,
            "difficulty": "easy"
        },
        {
            "question_type": "mcq",
            "question_text": "Which operator is used for string concatenation in Python?",
            "options": ["&", "+", ".", "++"],
            "correct_answer": "+",
            "marks": 1.0,
            "difficulty": "easy"
        },
        {
            "question_type": "mcq",
            "question_text": "What is the time complexity of binary search?",
            "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
            "correct_answer": "O(log n)",
            "marks": 2.0,
            "difficulty": "medium"
        },
        {
            "question_type": "mcq",
            "question_text": "Which data structure uses LIFO order?",
            "options": ["Queue", "Stack", "Linked List", "Tree"],
            "correct_answer": "Stack",
            "marks": 1.0,
            "difficulty": "easy"
        },
        {
            "question_type": "mcq",
            "question_text": "What is the purpose of the 'finally' block in exception handling?",
            "options": ["To catch exceptions", "To throw exceptions", "To execute code regardless of exceptions", "To ignore exceptions"],
            "correct_answer": "To execute code regardless of exceptions",
            "marks": 2.0,
            "difficulty": "medium"
        },
        {
            "question_type": "mcq",
            "question_text": "Which HTTP method is idempotent?",
            "options": ["POST", "PUT", "PATCH", "None of the above"],
            "correct_answer": "PUT",
            "marks": 2.0,
            "difficulty": "medium"
        },
        {
            "question_type": "mcq",
            "question_text": "What is the default port for HTTPS?",
            "options": ["80", "443", "8080", "3000"],
            "correct_answer": "443",
            "marks": 1.0,
            "difficulty": "easy"
        },
    ]
    
    text_annotation_questions = [
        {
            "question_type": "text_annotation",
            "question_text": "Identify and label all the named entities (person, organization, location) in the following text: 'John Smith works at Google in Mountain View.'",
            "marks": 5.0,
            "difficulty": "medium"
        },
        {
            "question_type": "text_annotation",
            "question_text": "Label the sentiment (positive, negative, neutral) for each sentence in the following review.",
            "marks": 5.0,
            "difficulty": "medium"
        },
    ]
    
    image_annotation_questions = [
        {
            "question_type": "image_annotation",
            "question_text": "Draw bounding boxes around all vehicles in the image.",
            "media_url": "https://images.unsplash.com/photo-1449824913935-59a10b8d2000",
            "marks": 10.0,
            "difficulty": "medium"
        },
        {
            "question_type": "image_annotation",
            "question_text": "Identify and label all objects in the street scene.",
            "media_url": "https://images.unsplash.com/photo-1476973422084-e0fa66ff9456",
            "marks": 10.0,
            "difficulty": "hard"
        },
    ]
    
    all_questions = mcq_questions + text_annotation_questions + image_annotation_questions
    
    for q_data in all_questions:
        # Check if similar question exists
        result = await db.execute(
            select(Question).where(Question.question_text == q_data["question_text"])
        )
        if not result.scalar_one_or_none():
            question = Question(**q_data)
            db.add(question)
            print(f"Created question: {q_data['question_text'][:50]}...")
    
    await db.commit()


async def seed_tests(db: AsyncSession):
    """Create sample tests"""
    # Get divisions
    result = await db.execute(select(Division))
    divisions = {d.name: d.id for d in result.scalars().all()}
    
    tests = [
        {
            "title": "Data Annotation Basics",
            "description": "Basic assessment for data annotation skills",
            "division_id": divisions.get("Data Annotator"),
            "duration_minutes": 30,
            "total_questions": 10,
            "total_marks": 10.0,
            "passing_marks": 5.0,
            "mcq_count": 10,
            "is_published": True
        },
        {
            "title": "Image Labeling Assessment",
            "description": "Test your image annotation skills",
            "division_id": divisions.get("Image Analyst"),
            "duration_minutes": 45,
            "total_questions": 5,
            "total_marks": 50.0,
            "passing_marks": 25.0,
            "mcq_count": 3,
            "image_annotation_count": 2,
            "is_published": True
        },
        {
            "title": "QA Skills Test",
            "description": "Quality assurance fundamentals",
            "division_id": divisions.get("QA Analyst"),
            "duration_minutes": 60,
            "total_questions": 15,
            "total_marks": 20.0,
            "passing_marks": 10.0,
            "mcq_count": 15,
            "is_published": True
        },
    ]
    
    for test_data in tests:
        result = await db.execute(
            select(Test).where(Test.title == test_data["title"])
        )
        if not result.scalar_one_or_none():
            test = Test(**test_data)
            db.add(test)
            print(f"Created test: {test_data['title']}")
    
    await db.commit()


async def main():
    """Run all seeders"""
    print("Starting test data seeding...")
    
    async with async_session_maker() as db:
        await seed_divisions(db)
        await seed_questions(db)
        await seed_tests(db)
    
    print("\nTest data seeding completed!")


if __name__ == "__main__":
    asyncio.run(main())
