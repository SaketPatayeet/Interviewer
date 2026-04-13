SYLLABUS_PROMPT = """
You are an expert syllabus parser.

Your task is to extract all units, topics, and subtopics from the syllabus.

Return ONLY a valid JSON object.
Do NOT include explanations, notes, or markdown.

The JSON must follow this structure exactly:

{{
  "Unit 1: Unit Name": {{
    "Topic Name": ["subtopic1", "subtopic2"]
  }}
}}

Syllabus:
{syllabus}
"""