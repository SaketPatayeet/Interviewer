import ollama
import json
from prompts.report_prompt import REPORT_PROMPT

def report_node(state):
    covered = state.get("covered_ids",[])
    weak_topics = state.get("weak_topics", [])
    conversation = state.get("conversation", [])
    question_bank = state.get("question_bank", {})

    total = sum(
        len(levels.get("basic", [])) +
        len(levels.get("intermediate", [])) +
        len(levels.get("advanced", []))
        for levels in question_bank.values()
    )

    prompt = REPORT_PROMPT.format(
        covered = len(covered),
        total = total,
        weak_topics = json.dumps(weak_topics),
        conversation = json.dumps(conversation)
    )

    response = ollama.chat(
        model = "llama3.2",
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response["message"]["content"]

    raw = raw.replace("```json", "").replace("```", "").strip()

    start = raw.find("{")
    end = raw.rfind("}")
    raw = raw[start:end+1]

    # fix braces
    open_braces = raw.count("{")
    close_braces = raw.count("}")
    if close_braces < open_braces:
        raw += "}" * (open_braces - close_braces)

    try:
        report = json.loads(raw)
    except Exception as e:
        print("REPORT RAW:", raw)
        raise e

    return {
        "report": report
    }
