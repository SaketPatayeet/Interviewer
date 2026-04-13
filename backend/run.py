from graph import graph
from utils.pdf_parser import extract_text

# 🔹 Step 1: Load PDF
syllabus_text = extract_text("sample_syllabus.pdf")

# 🔹 Step 2: Initial state
state = {
    "syllabus_text": syllabus_text,
    "strictness": 5,
    "covered_ids": [],
    "weak_topics": [],
    "conversation": [],
    "follow_up": None
}

# 🔹 Step 3: First run (until interviewer)
state = graph.invoke(state)

while True:

    question = state.get("current_question")

    # 🔚 If done → report
    if question is None:
        state = graph.invoke(state, {"entry": "report"})
        print("\nFINAL REPORT:\n", state["report"])
        break

    # 🗣 Ask question
    print("\nQ:", question["question"])

    # 👤 User input
    answer = input("Your answer: ")

    # 🔹 Add answer to state
    state["last_answer"] = answer

    # 🔹 Resume graph from evaluator
    state = graph.invoke(state, {"entry": "evaluator"})