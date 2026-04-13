import ollama
import json
from prompts.planner_prompt import PLANNER_PROMPT

def planner_node(state):
    topics = state["topics"]
    
    prompt = PLANNER_PROMPT.format(
        topics=json.dumps(topics, indent=2)
    )

    response = ollama.chat(
        model="llama3.2",
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response["message"]["content"]

    raw = raw.replace("```json", "").replace("```", "").strip()

    start = raw.find("{")
    end = raw.rfind("}")
    raw = raw[start:end+1]

    # Fix missing braces
    open_braces = raw.count("{")
    close_braces = raw.count("}")

    if close_braces < open_braces:
        raw += "}" * (open_braces - close_braces)

    try:
        question_bank = json.loads(raw)
    except Exception as e:
        print("FINAL RAW:", raw)
        raise e
    
    return{
        "question_bank":question_bank
    }