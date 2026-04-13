PLANNER_PROMPT = """
You are an expert question generator.

Your task is to generate questions from the given syllabus topics.

IMPORTANT:
- Each subtopic must be a separate key in the JSON.
- Do NOT group by unit.

For each topic in the list::
- Generate EXACTLY 1 question per level:
  - basic
  - intermediate
  - advanced
- Each question must include:
  - id
  - question
  - keywords

CRITICAL:
- Ensure every JSON object and array is properly closed.
- Do NOT leave trailing or incomplete objects.
- Output must be parseable by Python json.loads().

Return ONLY a valid JSON object.
Do NOT include explanations, notes, or markdown.

The JSON must follow this structure exactly:

{{
  "Topic Name": {{
    "basic": [
      {{
        "id": "topic_1",
        "question": "question text",
        "keywords": ["keyword1", "keyword2"]
      }}
    ],
    "intermediate": [...],
    "advanced": [...]
  }}
}}

Topics:
{topics}
"""