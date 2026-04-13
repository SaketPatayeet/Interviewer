import ollama
import json
from prompts.syllabus_prompt import SYLLABUS_PROMPT

def syllabus_node(state):
    # 1. Read input
    syllabus = state["syllabus_text"]

    # 2. Build prompt
    prompt = SYLLABUS_PROMPT.format(syllabus=syllabus)

    # 3. Call LLM
    response = ollama.chat(
        model="llama3.2",   # or llama3.2 if installed
        messages=[{"role": "user", "content": prompt}]
    )

    # 4. Extract output
    raw = response["message"]["content"]

    # 5. Clean output
    raw = raw.replace("```json", "").replace("```", "").strip()

    # 6. Convert to JSON
    topics = json.loads(raw)

    # 7. Return result
    return {
        "topics": topics
    }