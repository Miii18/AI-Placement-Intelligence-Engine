from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    student_id: int
    target_role: str
    target_company: str | None = None
    preparation_days: int
    current_skills: list[str]
    assessment_report: str