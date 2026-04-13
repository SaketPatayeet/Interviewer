from langgraph.graph import StateGraph, END
from state import InterviewState

# import your nodes
from nodes.syllabus_node import syllabus_node
from nodes.planner_node import planner_node
from nodes.interviewer_node import interviewer_node
from nodes.evaluator_node import evaluator_node
from nodes.report_node import report_node

def route_from_evaluator(state: InterviewState):

    if state.get("current_question") is None:
        return "report"
    
    if state.get("follow-up"):
        return "interviewer"
    
    return "interviewer"

builder = StateGraph(InterviewState)

builder.add_node("syllabus",syllabus_node)
builder.add_node("planner",planner_node)
builder.add_node("interviewer",interviewer_node)
builder.add_node("evaluator",evaluator_node)
builder.add_node("report",report_node)

builder.set_entry_point("syllabus")

builder.add_edge("syllabus","planner")
builder.add_edge("planner","interviewer")

builder.add_edge("interviewer", END)

builder.add_conditional_edges(
    "evaluator",
    route_from_evaluator,
    {
        "interviewer": "interviewer",
        "report": "report"
    }
)

builder.add_edge("report", END)

# Compile graph
graph = builder.compile()