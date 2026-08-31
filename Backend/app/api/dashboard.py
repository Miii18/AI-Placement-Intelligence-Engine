from collections import Counter
import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.student import Student
from app.models.placement_analysis import PlacementAnalysis

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def dashboard_stats(db: Session = Depends(get_db)):
    students = db.query(Student).all()
    analyses = db.query(PlacementAnalysis).order_by(PlacementAnalysis.id.asc()).all()

    total_students = len(students)
    total_analyses = len(analyses)

    readiness_scores = [a.readiness_score for a in analyses if a.readiness_score]

    average_readiness = (
        round(sum(readiness_scores) / len(readiness_scores))
        if readiness_scores else 0
    )

    highest_readiness = max(readiness_scores) if readiness_scores else 0

    # Count weaknesses
    weakness_counter = Counter()

    for analysis in analyses:
        if analysis.weaknesses:
            try:
                weakness_counter.update(json.loads(analysis.weaknesses))
            except:
                pass

    # Count target companies
    company_counter = Counter()

    for student in students:
        if student.target_company:
            company_counter.update([student.target_company])

    return {
        "total_students": total_students,
        "total_analyses": total_analyses,
        "average_readiness": average_readiness,
        "highest_readiness": highest_readiness,
        "most_common_weakness": weakness_counter.most_common(1)[0][0] if weakness_counter else "N/A",
        "most_target_company": company_counter.most_common(1)[0][0] if company_counter else "N/A",

        # Data for Bar Chart
        "weakness_chart": [
            {"name": k, "count": v}
            for k, v in weakness_counter.items()
        ],

        # Data for Line Chart
        "readiness_chart": [
            {
                "analysis": f"A{i+1}",
                "score": a.readiness_score,
            }
            for i, a in enumerate(analyses)
            if a.readiness_score
        ],

        # Data for Pie Chart
        "company_chart": [
            {"name": k, "value": v}
            for k, v in company_counter.items()
        ],
    }