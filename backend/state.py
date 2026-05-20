from typing import TypedDict, Optional, List, Dict


class InterviewState(TypedDict):

    # ===== INPUT =====
    syllabus_text: str
    strictness: int

    # ===== AFTER SYLLABUS NODE =====
    topics: List[str]

    # ===== INTERVIEW FLOW =====
    current_topic_index: int
    question_count: int
    topic_question_count: int

    current_question: Dict

    conversation: List[Dict]

    weak_topics: List[str]

    follow_up: Optional[str]
    follow_up_count: int

    should_end: bool

    audio_metrics: List[Dict]
    vision_metrics: List[Dict]
    # ===== TEMPORARY =====
    last_answer: str

    # ===== EVALUATION HISTORY =====
    evaluations: List[Dict]

    # ===== FINAL =====
    report: Dict