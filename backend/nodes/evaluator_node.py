from llm import generate_json
from prompts.evaluator_prompt import EVALUATOR_PROMPT


MAX_FOLLOWUPS = 2
QUESTIONS_PER_TOPIC = 2


def evaluator_node(state):

    current_question = state["current_question"]

    topic = current_question["topic"]

    answer = state["last_answer"]

    topic_index = state.get("current_topic_index", 0)

    weak_topics = state.get("weak_topics", [])

    evaluations = state.get("evaluations", [])

    follow_up_count = state.get("follow_up_count", 0)

    topic_question_count = state.get("topic_question_count", 0)

    conversation = state.get("conversation", [])

    # ===== USER TERMINATION =====

    stop_commands = [
        "stop",
        "end interview",
        "generate report",
        "finish"
    ]

    if answer.lower().strip() in stop_commands:

        return {
            "should_end": True
        }

    # ===== EVALUATE ANSWER =====

    prompt = EVALUATOR_PROMPT.format(
        topic=topic,
        question=current_question["question"],
        answer=answer,
        follow_up_count=follow_up_count
    )

    result = generate_json(prompt, max_tokens=256)

    print(result)

    score = result["score"]

    is_complete = result["is_complete"]

    follow_up = result.get("follow_up")

    # ===== SAFETY FIXES =====

    if score <= 3:
        is_complete = False

    if is_complete:
        follow_up = None

    # ===== SAVE CONVERSATION =====

    conversation.append({
        "role": "candidate",
        "content": answer
    })

    # ===== SAVE EVALUATION =====

    evaluations.append({
        "topic": topic,
        "question": current_question["question"],
        "answer": answer,
        "score": score
    })

    # ===== GOOD ANSWER =====

    if is_complete:

        new_topic_question_count = topic_question_count + 1

        print("Topic Question Count:", new_topic_question_count)

        # ===== MOVE TO NEXT TOPIC =====

        if new_topic_question_count >= QUESTIONS_PER_TOPIC:

            return {
                "current_topic_index": topic_index + 1,

                "topic_question_count": 0,

                "follow_up": None,

                "follow_up_count": 0,

                "evaluations": evaluations,

                "conversation": conversation
            }

        # ===== STAY ON SAME TOPIC =====

        return {
            "topic_question_count": new_topic_question_count,

            "follow_up": None,

            "follow_up_count": 0,

            "evaluations": evaluations,

            "conversation": conversation
        }

    # ===== WEAK ANSWER =====

    if topic not in weak_topics:

        weak_topics.append(topic)

    print("Follow_up count:", follow_up_count)

    # ===== FOLLOW-UP LIMIT REACHED =====

    if follow_up_count + 1 >= MAX_FOLLOWUPS:

        return {
            "current_topic_index": topic_index + 1,

            "topic_question_count": 0,

            "follow_up": None,

            "follow_up_count": 0,

            "weak_topics": weak_topics,

            "evaluations": evaluations,

            "conversation": conversation
        }

    # ===== ASK FOLLOW-UP =====

    return {
        "follow_up": follow_up,

        "follow_up_count": follow_up_count + 1,

        "weak_topics": weak_topics,

        "evaluations": evaluations,

        "conversation": conversation
    }