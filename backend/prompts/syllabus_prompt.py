SYLLABUS_PROMPT = """
Extract the important interview topics from this syllabus.

Return ONLY valid JSON.

Format:

{{
  "topics": [
    "Topic 1",
    "Topic 2",
    "Topic 3"
  ]
}}

Rules:
- Keep only important technical interview topics
- Remove units and numbering
- Keep topics concise
- No explanations
- No markdown

Syllabus:
{syllabus}
"""