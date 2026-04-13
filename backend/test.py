from nodes.syllabus_node import syllabus_node
from nodes.planner_node import planner_node
from nodes.interviewer_node import interviewer_node
from nodes.evaluator_node import evaluator_node
from nodes.report_node import report_node

state = {
    "syllabus_text": "Unit 1: Stack and Queue. Stack has push, pop. Queue has FIFO.",
    "strictness": 5,
    "topics": {
        "Stack": ["push", "pop", "LIFO"],
        "Queue": ["enqueue", "dequeue", "FIFO"]
    },
    "covered_ids": ["stack_1", "queue_1"],
    "weak_topics": ["Stack"],
    "conversation": [
        {"role": "interviewer", "content": "What is a stack?"},
        {"role": "user", "content": "It is a data structure"},
        {"role": "interviewer", "content": "Explain LIFO"},
        {"role": "user", "content": "Last in first out"}
    ],
    "question_bank": {
        "Stack": {
            "basic": [{"id": "stack_1"}],
            "intermediate": [],
            "advanced": []
        },
        "Queue": {
            "basic": [{"id": "queue_1"}],
            "intermediate": [],
            "advanced": []
        }
    }
}


result = report_node(state)

print(result)