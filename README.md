# CDC VIT Assessment Portal Clone

A full-stack clone of the CDC VIT Assessment Portal built with:
- **Frontend**: Vite + React + TypeScript
- **Backend**: Python FastAPI + SQLAlchemy + SQLite

## Project Structure

```
Hiring Pro/
├── frontend/          # React + TypeScript frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── types/       # TypeScript types
│   └── ...
│
└── backend/           # FastAPI backend
    ├── app/
    │   ├── models/      # SQLAlchemy models
    │   ├── schemas/     # Pydantic schemas
    │   ├── routers/     # API routes
    │   └── services/    # Business logic
    └── ...
```

## Getting Started

### Backend Setup

```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Seed database with demo data
python seed_data.py

# Start server
uvicorn app.main:app --reload
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

## Demo Credentials

After running `seed_data.py`:
- **Email**: vinayak.shukla@gmail.com
- **Password**: password123

## Features

- ✅ JWT Authentication
- ✅ Dashboard with skill stats
- ✅ Jobs listing with filters
- ✅ Assessments & badges
- ✅ User profile
- ✅ Responsive sidebar navigation



**Context:**
Build a "In-Page Browser" and Document Viewer for an assessment platform. This application must handle high concurrency (10k+ users), so the frontend code must be optimized to minimize unnecessary re-renders and server requests.

**Core Components:**

1.  **Left Panel (Optimized In-Page Browser):**
    - **Implementation:** Use an `<iframe>` with `srcDoc`.
    - **Performance Constraint:** Wrap this specific component in `React.memo`. The iframe **must not re-render** when the user interacts with the sidebar or other UI elements (like a timer). Re-rendering iframes is expensive and causes flickering.
    - **Features:**
        - Render raw HTML strings passed via props.
        - "Full Screen" toggle button (expands to overlay `z-50`, absolute inset-0).
        - "Close/Exit" button visible only in full-screen mode.

2.  **Right Panel (Lazy-Loaded Docs):**
    - **UI:** A sidebar list for "Task Understanding Documents" (Doc 1, Doc 2...).
    - **Optimization:** Create the structure such that the list of *titles* is loaded first, but the *content* of a document is only fetched/rendered when the user actually clicks the card (Lazy Loading pattern).

*

**Output:**
Generate the complete, optimized React code. Ensure the `<iframe>` component is isolated to prevent performance bottlenecks.