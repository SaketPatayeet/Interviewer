from langgraph.graph import StateGraph
from langgraph.checkpoint.memory import MemorySaver

from state import InterviewState

from nodes.syllabus_node import syllabus_node
from nodes.interviewer_node import interviewer_node
from nodes.evaluator_node import evaluator_node
from nodes.report_node import report_node


# ===== ROUTER =====

def route_from_evaluator(state: InterviewState):

    if state.get("should_end"):
        return "report"

    return "interviewer"


# ===== BUILD GRAPH =====

builder = StateGraph(InterviewState)

builder.add_node("syllabus", syllabus_node)

builder.add_node("interviewer", interviewer_node)

builder.add_node("evaluator", evaluator_node)

builder.add_node("report", report_node)


# ===== FLOW =====

builder.set_entry_point("syllabus")

builder.add_edge("syllabus", "interviewer")

builder.add_edge("interviewer", "evaluator")

builder.add_conditional_edges(
    "evaluator",
    route_from_evaluator,
    {
        "interviewer": "interviewer",
        "report": "report"
    }
)


# ===== CHECKPOINTING =====

memory = MemorySaver()

graph = builder.compile(checkpointer=memory)