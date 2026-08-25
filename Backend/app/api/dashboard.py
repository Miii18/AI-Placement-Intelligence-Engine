from collections import Counter
import json
from typing import Dict, Any

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.placement_analysis import PlacementAnalysis
from app.models.student import Student

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    # 1. Total Students
    total_students = db.query(Student).count()

    # 2. Total Analyses
    total_analyses = db.query(PlacementAnalysis).count()

    # 3. Average & Highest Readiness Score
    avg_score, max_score = db.query(
        func.avg(PlacementAnalysis.readiness_score),
        func.max(PlacementAnalysis.readiness_score)
    ).filter(PlacementAnalysis.readiness_score.isnot(None)).first()

    average_readiness = round(float(avg_score)) if avg_score is not None else 0
    highest_readiness = int(max_score) if max_score is not None else 0

    # 4. Most Common Weakness
    weakness_counter = Counter()
    analyses_weaknesses = db.query(PlacementAnalysis.weaknesses).filter(
        PlacementAnalysis.weaknesses.isnot(None)
    ).all()

    for (w_text,) in analyses_weaknesses:
        if not w_text:
            continue
        try:
            items = json.loads(w_text) if isinstance(w_text, str) else w_text
            if isinstance(items, list):
                for item in items:
                    if isinstance(item, str) and item.strip():
                        weakness_counter[item.strip()] += 1
            elif isinstance(items, str) and items.strip():
                weakness_counter[items.strip()] += 1
        except Exception:
            if isinstance(w_text, str) and w_text.strip():
                weakness_counter[w_text.strip()] += 1

    most_common_weakness = (
        weakness_counter.most_common(1)[0][0] if weakness_counter else "N/A"
    )

    # 5. Most Target Company
    company_counter = Counter()
    students_companies = db.query(Student.target_company).filter(
        Student.target_company.isnot(None)
    ).all()

    for (company,) in students_companies:
        if company and company.strip():
            company_counter[company.strip()] += 1

    most_target_company = (
        company_counter.most_common(1)[0][0] if company_counter else "N/A"
    )

    return {
        "total_students": total_students,
        "total_analyses": total_analyses,
        "average_readiness": average_readiness,
        "highest_readiness": highest_readiness,
        "most_common_weakness": most_common_weakness,
        "most_target_company": most_target_company
    }