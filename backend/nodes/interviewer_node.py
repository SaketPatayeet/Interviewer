from langgraph.types import interrupt
from llm import generate_json
from prompts.interviewer_prompt import INTERVIEWER_PROMPT


MAX_QUESTIONS = 10


def interviewer_node(state):

    topics = state["topics"]

    topic_index = state.get("current_topic_index", 0)

    strictness = state.get("strictness", 5)

    conversation = state.get("conversation", [])

    follow_up = state.get("follow_up")

    question_count = state.get("question_count", 0)

    weak_topics = state.get("weak_topics", [])

    

    # ===== END CONDITIONS =====

    if topic_index >= len(topics):

        return {
            "should_end": True
        }

    if question_count >= MAX_QUESTIONS:

        return {
            "should_end": True
        }

    # ===== CURRENT TOPIC =====

    topic = topics[topic_index]

    # ===== FOLLOW-UP =====

    if follow_up:

        question = follow_up

    else:

        difficulty = "basic"

        if strictness >= 4:
            difficulty = "intermediate"

        if strictness >= 8:
            difficulty = "advanced"

        prompt = INTERVIEWER_PROMPT.format(
            topic=topic,
            difficulty=difficulty,
            weak_topics=weak_topics,
            question_count=question_count,
            conversation=conversation[-4:]
        )

        result = generate_json(prompt, max_tokens=256,temperature=0.8)

        question = result["question"]

    # ===== SAVE QUESTION =====

    conversation.append({
        "role": "interviewer",  
        "content": question
    })

    # ===== INTERRUPT =====

    response = interrupt(question)

    answer = response["answer"]

    audio_metrics = response.get(
        "audio_metrics",
        {}
    )

    all_audio_metrics = list(
        state.get("audio_metrics", [])
    )

    vision_metrics = response.get(
        "vision_metrics",
        {}
    )

    all_vision_metrics = list(
        state.get("vision_metrics", [])
    )

    if audio_metrics:

        all_audio_metrics.append(audio_metrics)

    

    if vision_metrics:

        all_vision_metrics.append(
            vision_metrics
        )

    print("\nAUDIO METRICS RECEIVED:")
    print(audio_metrics)

    print("\nVIDEO METRICS RECEIVED:")
    print(vision_metrics)

    return {

        "current_question": {
            "question": question,
            "topic": topic
        },

        "last_answer": answer,

        "audio_metrics": all_audio_metrics,

        "vision_metrics": all_vision_metrics,

        "conversation": conversation,

        "question_count": question_count + 1,

        "follow_up": None
    }