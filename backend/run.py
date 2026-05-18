from graph import graph
from utils.pdf_parser import extract_text

from langgraph.types import Command

import threading


# ===== SETTINGS =====

ANSWER_TIME_LIMIT = 30


# ===== SELECT MODE =====

print("Select Interview Mode:")
print("1. Text Mode")
print("2. Voice Mode")

choice = input("Enter choice (1 or 2): ").strip()

VOICE_MODE = choice == "2"


# ===== OPTIONAL VOICE IMPORTS =====

if VOICE_MODE:

    from voice.tts import speak
    from voice.stt import listen

    print("\nVoice mode enabled.\n")

else:

    print("\nText mode enabled.\n")


# ===== LOAD PDF =====

syllabus_text = extract_text("sample_syllabus.pdf")


# ===== INITIAL STATE =====

state = {

    "syllabus_text": syllabus_text,

    "strictness": 5,

    "conversation": [],

    "weak_topics": [],

    "follow_up": None,

    "question_count": 0,

    "follow_up_count": 0,

    "topic_question_count": 0,

    "current_topic_index": 0,

    "evaluations": [],

    "should_end": False
}


# ===== THREAD CONFIG =====

config = {
    "configurable": {
        "thread_id": "interview-1"
    }
}


# ===== START GRAPH =====

result = graph.invoke(
    state,
    config=config
)


# ===== INTERVIEW LOOP =====

while True:

    # ===== FINAL REPORT =====

    if result.get("report"):

        print("\nFINAL REPORT:\n")

        print(result["report"])

        if VOICE_MODE:

            speak("Interview completed. Final report generated.")

        break

    # ===== GET QUESTION =====

    question = result["__interrupt__"][0].value

    print("\nQ:", question)

    print(f"\nYou have {ANSWER_TIME_LIMIT} seconds to answer.")

    # ===== SPEAK QUESTION =====

    if VOICE_MODE:

        speak(question)

        speak(f"You have {ANSWER_TIME_LIMIT} seconds to answer.")

    # ===== USER ANSWER =====

    if VOICE_MODE:

        answer = listen(seconds=ANSWER_TIME_LIMIT)

        print("\nYou said:", answer)

    else:

        answer_container = {
            "answer": None
        }

        def get_input():

            answer_container["answer"] = input("Your answer: ")

        thread = threading.Thread(target=get_input)

        thread.daemon = True

        thread.start()

        thread.join(timeout=ANSWER_TIME_LIMIT)

        # ===== TIMEOUT =====

        if thread.is_alive():

            print("\nTime Up!")

            answer = ""

        else:

            answer = answer_container["answer"]

    # ===== RESUME GRAPH =====

    result = graph.invoke(
        Command(resume=answer),
        config=config
    )