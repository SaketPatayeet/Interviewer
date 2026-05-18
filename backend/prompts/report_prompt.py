REPORT_PROMPT = """
Generate a professional interview evaluation report.

Interview evaluations:
{evaluations}

Weak topics:
{weak_topics}

Total questions asked:
{question_count}

Return ONLY valid JSON.

Format:

{{
  "overall_performance": "...",
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "suggestions": ["...", "..."],
  "final_score": 0
}}

Rules:
- final_score must be between 0 and 10
- keep feedback concise
- be professional and constructive
"""