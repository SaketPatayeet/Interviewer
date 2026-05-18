INTERVIEWER_PROMPT = """
Generate ONE interview question.

Current topic:
{topic}

Difficulty:
{difficulty}

Weak topics:
{weak_topics}

Questions already asked:
{question_count}

Recent conversation:
{conversation}

Return ONLY valid JSON.

Format:

{{
  "question": "question text"
}}
"""