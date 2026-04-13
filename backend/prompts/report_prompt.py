REPORT_PROMPT = """
You are an expert evaluator.

Interview summary:

- Questions answered: {covered}/{total}
- Weak topics: {weak_topics}

Conversation:
{conversation}

Generate a final report.

CRITICAL:
- Output ONLY valid JSON
- No explanation

Format:

{{
  "summary": "overall performance",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."]
}}
"""