from collections import Counter, defaultdict
import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.student import Student
from app.models.placement_analysis import PlacementAnalysis

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def dashboard_stats(db: Session = Depends(get_db)):
    students = db.query(Student).all()
    analyses = (
        db.query(PlacementAnalysis)
        .options(joinedload(PlacementAnalysis.student))
        .order_by(PlacementAnalysis.id.asc())
        .all()
    )

    total_students = len(students)
    total_analyses = len(analyses)

    readiness_scores = [a.readiness_score for a in analyses if a.readiness_score is not None]

    average_readiness = (
        round(sum(readiness_scores) / len(readiness_scores))
        if readiness_scores else 0
    )

    highest_readiness = max(readiness_scores) if readiness_scores else 0

    # 1. Top Strengths & 2. Top Weaknesses counters
    strength_counter = Counter()
    weakness_counter = Counter()

    for analysis in analyses:
        if analysis.strengths:
            try:
                parsed_strengths = json.loads(analysis.strengths)
                if isinstance(parsed_strengths, list):
                    strength_counter.update(parsed_strengths)
            except Exception:
                pass

        if analysis.weaknesses:
            try:
                parsed_weaknesses = json.loads(analysis.weaknesses)
                if isinstance(parsed_weaknesses, list):
                    weakness_counter.update(parsed_weaknesses)
            except Exception:
                pass

    # Count target companies
    company_counter = Counter()
    for student in students:
        if student.target_company:
            company_counter.update([student.target_company])

    # 3. Average Readiness grouped by Target Role
    role_scores = defaultdict(list)
    for analysis in analyses:
        if analysis.readiness_score is not None and analysis.student:
            role = analysis.student.target_role or "Unknown"
            role_scores[role].append(analysis.readiness_score)

    role_readiness_chart = [
        {
            "role": role,
            "avg_score": round(sum(scores) / len(scores))
        }
        for role, scores in role_scores.items()
    ]

    # 4. Readiness Score Distribution in ranges (40–50, 50–60, 60–70, 70–80, 80–90, 90–100)
    distribution_bins = {
        "40–50": 0,
        "50–60": 0,
        "60–70": 0,
        "70–80": 0,
        "80–90": 0,
        "90–100": 0,
    }

    for s in readiness_scores:
        if 40 <= s < 50:
            distribution_bins["40–50"] += 1
        elif 50 <= s < 60:
            distribution_bins["50–60"] += 1
        elif 60 <= s < 70:
            distribution_bins["60–70"] += 1
        elif 70 <= s < 80:
            distribution_bins["70–80"] += 1
        elif 80 <= s < 90:
            distribution_bins["80–90"] += 1
        elif 90 <= s <= 100:
            distribution_bins["90–100"] += 1
        elif s < 40:
            distribution_bins["40–50"] += 1

    readiness_distribution_chart = [
        {"range": key, "count": count}
        for key, count in distribution_bins.items()
    ]

    # 5. Recent Analyses table showing the latest 5 students
    recent_analyses_raw = (
        db.query(PlacementAnalysis)
        .options(joinedload(PlacementAnalysis.student))
        .order_by(PlacementAnalysis.id.desc())
        .limit(5)
        .all()
    )

    recent_analyses = []
    for a in recent_analyses_raw:
        recent_analyses.append({
            "id": a.id,
            "name": a.student.name if a.student else "Unknown",
            "target_company": a.student.target_company if a.student else "N/A",
            "target_role": a.student.target_role if a.student else "N/A",
            "readiness_score": a.readiness_score if a.readiness_score is not None else 0,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        })

    most_common_strength = strength_counter.most_common(1)[0][0] if strength_counter else "N/A"
    most_common_weakness = weakness_counter.most_common(1)[0][0] if weakness_counter else "N/A"
    most_target_company = company_counter.most_common(1)[0][0] if company_counter else "N/A"

    return {
        "total_students": total_students,
        "total_analyses": total_analyses,
        "average_readiness": average_readiness,
        "highest_readiness": highest_readiness,
        "most_common_strength": most_common_strength,
        "most_common_weakness": most_common_weakness,
        "most_target_company": most_target_company,

        # Data for Top Strengths Chart
        "strength_chart": [
            {"name": k, "count": v}
            for k, v in strength_counter.most_common(10)
        ],

        # Data for Top Weaknesses Chart
        "weakness_chart": [
            {"name": k, "count": v}
            for k, v in weakness_counter.most_common(10)
        ],

        # Data for Average Readiness by Role Chart
        "role_readiness_chart": role_readiness_chart,

        # Data for Readiness Distribution Chart
        "readiness_distribution_chart": readiness_distribution_chart,

        # Recent 5 Analyses Table Data
        "recent_analyses": recent_analyses,

        # Backward compatibility
        "readiness_chart": [
            {
                "analysis": f"A{i+1}",
                "score": a.readiness_score,
            }
            for i, a in enumerate(analyses)
            if a.readiness_score is not None
        ],
        "company_chart": [
            {"name": k, "value": v}
            for k, v in company_counter.items()
        ],
    }