import ollama
import json
from prompts.evaluator_prompt import EVALUATOR_PROMPT

def evaluator_node(state):
    question = state["current_question"]["question"]
    keywords = state["current_question"].get("keywords", [])
    answer = state["last_answer"]
    strictness = state.get("strictness", 5)

    prompt = EVALUATOR_PROMPT.format(
        question = question,
        keywords = json.dumps(keywords),
        answer = answer,
        strictness = strictness
    )

    response = ollama.chat(
        model = "llama3.2",
        messages = [{"role":"user","content":prompt}]
    )

    raw = response["message"]["content"]

    # 🔹 Clean output
    raw = raw.replace("```json", "").replace("```", "").strip()

    start = raw.find("{")
    end = raw.rfind("}")
    raw = raw[start:end+1]

    # 🔹 Fix missing braces
    open_braces = raw.count("{")
    close_braces = raw.count("}")

    if close_braces < open_braces:
        raw += "}" * (open_braces - close_braces)

    try:
        result = json.loads(raw)
    except Exception as e:
        print("EVALUATOR RAW:", raw)
        raise e
    
    score = result.get("score", 0)
    is_complete = result.get("is_complete", False)
    follow_up = result.get("follow_up", None)

    
    covered_ids = state.get("covered_ids", []).copy()
    if is_complete:
        covered_ids.append(state["current_question"]["id"])


    weak_topics = state.get("weak_topics", []).copy()
    if score < 5:
        topic = state["current_question"]["topic"]
        if topic not in weak_topics:
            weak_topics.append(topic)

    return {
        "last_score": score,
        "follow_up": follow_up,
        "covered_ids": covered_ids,
        "weak_topics": weak_topics
    }





