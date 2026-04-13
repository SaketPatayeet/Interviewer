from typing import TypedDict, Optional, List, Dict

class InterviewState(TypedDict):
    # ===== INPUT =====
    syllabus_text: str
    strictness: int

    # ===== AFTER SYLLABUS NODE =====
    topics: Dict

    # ===== AFTER PLANNER NODE =====
    question_bank: Dict

    # ===== DURING INTERVIEW =====
    current_question: Dict
    conversation: List[Dict]
    covered_ids: List[str]
    weak_topics: List[str]

    last_answer: str
    last_score: int
    follow_up: Optional[str]

    # ===== FINAL =====
    report: Dict