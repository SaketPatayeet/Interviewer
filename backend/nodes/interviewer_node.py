def interviewer_node(state):

    question_bank = state["question_bank"]
    covered_ids = state.get("covered_ids", [])
    follow_up = state.get("follow_up")
    strictness = state.get("strictness", 5)
    conversation = state.get("conversation", [])

    # 1️⃣ If follow-up exists → ask it first
    if follow_up:
        question = {
            "id": "follow_up",
            "question": follow_up,
            "topic": state["current_question"]["topic"],
            "level": "follow_up"
        }

        conversation.append({
            "role": "interviewer",
            "content": follow_up
        })

        return {
            "current_question": question,
            "conversation": conversation,
            "follow_up": None   # clear after asking
        }

    # 2️⃣ Decide allowed difficulty levels
    levels = ["basic"]
    if strictness >= 4:
        levels.append("intermediate")
    if strictness >= 8:
        levels.append("advanced")

    # 3️⃣ Find next uncovered question
    for topic, level_data in question_bank.items():
        for level in levels:
            for q in level_data.get(level, []):
                if q["id"] not in covered_ids:

                    question = {
                        **q,
                        "topic": topic,
                        "level": level
                    }

                    conversation.append({
                        "role": "interviewer",
                        "content": q["question"]
                    })

                    return {
                        "current_question": question,
                        "conversation": conversation
                    }

    # 4️⃣ No questions left → signal end
    return {
        "current_question": None,
        "conversation": conversation
    }