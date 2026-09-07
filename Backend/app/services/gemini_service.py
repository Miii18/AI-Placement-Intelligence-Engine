import json
from google import genai
from app.config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)

def analyze_student(data):
    prompt = f"""

    Generate a personalized placement readiness report.

Preparation Days: {data.preparation_days}

Roadmap Rules:
- Divide the preparation days into weekly goals (7 days = 1 week).
- Generate one roadmap object for every week.
- Return all weeks inside the roadmap array.
You are an expert AI Placement Coach.

Analyze this student and return ONLY valid JSON.

Student:
- Target Role: {data.target_role}
- Target Company: {data.target_company}
- Preparation Days: {data.preparation_days}
- Current Skills: {', '.join(data.current_skills)}

Assessment Report:
{data.assessment_report}

Return ONLY this JSON structure:

{{
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "priorities": [
    {{
      "skill": "...",
      "reason": "..."
    }}
  ],
  "roadmap": [
  {{
    "week": 1,
    "focus": "..."
  }},
  {{
    "week": 2,
    "focus": "..."
  }},
  {{
    "week": 3,
    "focus": "..."
  }}
],
  "today_tasks": ["...", "...", "..."],
  "readiness_score": 72,
  "readiness_reason": "...",
  "suitable_roles": ["Role 1", "Role 2", "Role 3"],
  "recommended_companies": ["Company 1", "Company 2", "Company 3", "Company 4"],
  "placement_probability": 78,
  "priority_skills": ["Skill 1", "Skill 2", "Skill 3"],
  "ai_recommendation": "Short personalized career advice."
}}

Do not add markdown, explanations, or code fences.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    text = (response.text or "").strip()

    # Remove accidental markdown if Gemini adds it
    text = text.replace("```json", "").replace("```", "").strip()

    result = json.loads(text)

    # Fallbacks for robust parsing
    if not isinstance(result.get("suitable_roles"), list):
        result["suitable_roles"] = [data.target_role, "Software Engineer", "AI/ML Engineer"]
    if not isinstance(result.get("recommended_companies"), list):
        result["recommended_companies"] = [data.target_company or "TechCorp", "Google", "Amazon", "Microsoft"]
    if not isinstance(result.get("placement_probability"), int):
        result["placement_probability"] = result.get("readiness_score", 75)
    if not isinstance(result.get("priority_skills"), list):
        result["priority_skills"] = [p.get("skill") for p in result.get("priorities", []) if isinstance(p, dict) and p.get("skill")][:3] or ["System Design", "Data Structures"]
    if not isinstance(result.get("ai_recommendation"), str) or not result.get("ai_recommendation"):
        result["ai_recommendation"] = f"Consistently practice core skills for {data.target_role} to build interview confidence."

    return result