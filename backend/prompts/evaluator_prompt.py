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

Communication Metrics:
- Speech pacing information
- Pause analysis
- Vocal stability estimate

These are weak supportive communication signals only.
DO NOT heavily penalize candidates based on these metrics.
Technical correctness must dominate evaluation.

Vision Metrics:
- Gaze Alignement Ratio: {gaze_alignment_ratio}
- Face Presence Ratio: {face_presence_ratio}
- Fidgeting Score: {fidgeting_score}

Use these ONLY as communication/presentation signals.

Do NOT heavily penalize technical correctness based on video behavior.

Low eye contact or higher movement may indicate nervousness,
but should not dominate scoring.

Return ONLY valid JSON.
"""