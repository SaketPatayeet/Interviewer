from llm import generate_json
from prompts.report_prompt import REPORT_PROMPT


def report_node(state):

    evaluations = state.get("evaluations", [])

    weak_topics = state.get("weak_topics", [])

    question_count = state.get("question_count", 0)

    prompt = REPORT_PROMPT.format(
        evaluations=evaluations,
        weak_topics=weak_topics,
        question_count=question_count
    )

    report = generate_json(prompt, max_tokens=512)

    return {
        "report": report
    }