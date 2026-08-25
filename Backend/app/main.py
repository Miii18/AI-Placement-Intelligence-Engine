from typing import Optional
import json

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models.student import Student
from app.models.placement_analysis import PlacementAnalysis
from app.schemas.analyze import AnalyzeRequest
from app.services.gemini_service import analyze_student

# Dashboard API
from app.api.dashboard import router as dashboard_router


# --------------------------------------------------
# Create database tables
# --------------------------------------------------
Base.metadata.create_all(bind=engine)


# --------------------------------------------------
# FastAPI application
# --------------------------------------------------
app = FastAPI(
    title="AI Placement Intelligence Engine",
    description="AI-powered personalized placement preparation system",
    version="1.0.0"
)


# --------------------------------------------------
# CORS
# --------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Student Request Schema
# --------------------------------------------------
class StudentCreate(BaseModel):
    name: str
    target_role: str
    target_company: Optional[str] = None
    preparation_days: int
    skills: Optional[str] = None


# --------------------------------------------------
# Root API
# --------------------------------------------------
@app.get("/")
def root():
    return {
        "message": "AI Placement Intelligence Engine is running!"
    }


# --------------------------------------------------
# Health API
# --------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# --------------------------------------------------
# Create Student
# --------------------------------------------------
@app.post("/students")
def create_student(
    student_data: StudentCreate,
    db: Session = Depends(get_db)
):
    student = Student(
        name=student_data.name,
        target_role=student_data.target_role,
        target_company=student_data.target_company,
        preparation_days=student_data.preparation_days,
        skills=student_data.skills
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    return {
        "message": "Student saved successfully",
        "student_id": student.id
    }


# --------------------------------------------------
# AI Placement Analysis
# --------------------------------------------------
@app.post("/analyze")
def analyze(
    request: AnalyzeRequest,
    db: Session = Depends(get_db)
):
    # Generate AI analysis
    result = analyze_student(request)

    # Save to PostgreSQL
    analysis = PlacementAnalysis(
        student_id=request.student_id,
        strengths=json.dumps(result.get("strengths", [])),
        weaknesses=json.dumps(result.get("weaknesses", [])),
        priorities=json.dumps(result.get("priorities", [])),
        roadmap=json.dumps(result.get("roadmap", [])),
        today_tasks=json.dumps(result.get("today_tasks", [])),
        readiness_score=result.get("readiness_score"),
        readiness_reason=result.get("readiness_reason"),
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return {
        "analysis": result,
        "analysis_id": analysis.id,
        "student_id": request.student_id,
        "saved_to_database": True,
    }


# --------------------------------------------------
# Get Student + Latest Analysis
# --------------------------------------------------
@app.get("/students/{student_id}")
def get_student(
    student_id: int,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    analysis = (
        db.query(PlacementAnalysis)
        .filter(PlacementAnalysis.student_id == student_id)
        .order_by(PlacementAnalysis.id.desc())
        .first()
    )

    return {
        "student": {
            "id": student.id,
            "name": student.name,
            "target_role": student.target_role,
            "target_company": student.target_company,
            "preparation_days": student.preparation_days,
            "skills": student.skills,
        },
        "analysis": {
            "id": analysis.id,
            "strengths": json.loads(analysis.strengths) if analysis and analysis.strengths else [],
            "weaknesses": json.loads(analysis.weaknesses) if analysis and analysis.weaknesses else [],
            "priorities": json.loads(analysis.priorities) if analysis and analysis.priorities else [],
            "roadmap": json.loads(analysis.roadmap) if analysis and analysis.roadmap else [],
            "today_tasks": json.loads(analysis.today_tasks) if analysis and analysis.today_tasks else [],
            "readiness_score": analysis.readiness_score if analysis else None,
            "readiness_reason": analysis.readiness_reason if analysis else None,
            "created_at": analysis.created_at.isoformat() if analysis and analysis.created_at else None,
        } if analysis else None,
    }


# --------------------------------------------------
# Get Student Analysis History
# --------------------------------------------------
@app.get("/students/{student_id}/analyses")
def get_student_analyses(
    student_id: int,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    analysis_records = (
        db.query(PlacementAnalysis)
        .filter(PlacementAnalysis.student_id == student_id)
        .order_by(PlacementAnalysis.id.desc())
        .all()
    )

    analyses = []

    for a in analysis_records:
        analyses.append({
            "id": a.id,
            "student_id": a.student_id,
            "strengths": json.loads(a.strengths) if a.strengths else [],
            "weaknesses": json.loads(a.weaknesses) if a.weaknesses else [],
            "priorities": json.loads(a.priorities) if a.priorities else [],
            "roadmap": json.loads(a.roadmap) if a.roadmap else [],
            "today_tasks": json.loads(a.today_tasks) if a.today_tasks else [],
            "readiness_score": a.readiness_score,
            "readiness_reason": a.readiness_reason,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        })

    return {
        "student": {
            "id": student.id,
            "name": student.name,
            "target_role": student.target_role,
            "target_company": student.target_company,
        },
        "total_analyses": len(analyses),
        "analyses": analyses,
    }


# --------------------------------------------------
# Dashboard API Routes
# --------------------------------------------------
app.include_router(dashboard_router)