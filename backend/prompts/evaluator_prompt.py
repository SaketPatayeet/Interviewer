EVALUATOR_PROMPT = """
Evaluate the candidate's interview answer.

Topic:
{topic}

Question:
{question}

Candidate Answer:
{answer}

Current follow-up count:
{follow_up_count}

Return ONLY valid JSON.

Format:

{{
  "score": 0,
  "is_complete": false,
  "follow_up": null
}}

STRICT RULES:

- score must be between 0 and 10
- if answer is incorrect, vague, empty, or "idk":
  - score must be <= 3
  - is_complete MUST be false
  - generate a follow-up question

- if answer is partially correct:
  - score between 4 and 6
  - is_complete can be false

- if answer is mostly correct:
  - score >= 7
  - is_complete MUST be true
  - follow_up MUST be null

- NEVER set:
  - low score + is_complete=true

- Do not ask questions that are conceptually very similar to recent questions in the conversation.

- NEVER generate follow_up if is_complete=true

Return ONLY valid JSON.
"""