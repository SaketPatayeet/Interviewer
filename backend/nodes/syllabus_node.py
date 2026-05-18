from prompts.syllabus_prompt import SYLLABUS_PROMPT
from llm import generate_json

def syllabus_node(state):
    prompt = SYLLABUS_PROMPT.format(
        syllabus=state["syllabus_text"]
    )

    result = generate_json(prompt)

    return {
        "topics": result["topics"],
        "current_topic_index": 0,
        "question_count": 0,
        "should_end": False,
        "evaluations": []
    }