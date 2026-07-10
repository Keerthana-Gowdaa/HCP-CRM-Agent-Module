"""
agent.py – LangGraph StateGraph agent using Groq's gemma2-9b-it model.

Implements a ReAct-style loop: agent → should_continue → tool → agent
"""

import os
from typing import Annotated, Any
from typing_extensions import TypedDict

from dotenv import load_dotenv
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from app.tools import all_tools

load_dotenv()

# ── State schema ──────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    """State that flows through the LangGraph graph."""
    messages: Annotated[list[BaseMessage], add_messages]


# ── LLM setup ────────────────────────────────────────────────────────────────

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

llm = ChatGroq(
    model="gemma2-9b-it",
    api_key=GROQ_API_KEY,
    temperature=0.3,
    max_tokens=4096,
)

# Override model_name at runtime because Groq has decommissioned gemma2-9b-it
llm.model_name = "llama-3.1-8b-instant"

# Bind all five CRM tools to the model
llm_with_tools = llm.bind_tools(all_tools)


# ── System prompt ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an AI assistant for a pharmaceutical CRM system that manages Healthcare Professional (HCP) interactions. You help field sales representatives log, track, and manage their HCP engagements.

Your capabilities:
1. **Log Interactions**: When a user describes a meeting, call, or interaction with an HCP, extract the relevant fields (HCP name, type, date, time, topics, materials, sentiment, outcomes) and use the log_interaction tool.
2. **Edit Interactions**: When a user wants to modify an existing interaction record, use the edit_interaction tool with the record ID and updated fields.
3. **View History**: When a user asks about past interactions with a specific HCP, use the get_hcp_history tool.
4. **Search Materials**: When a user asks about scientific materials, clinical data, or product resources, use the search_medical_materials tool.
5. **Suggest Follow-ups**: When a user wants recommendations on next steps after an interaction, use the suggest_follow_ups tool.

Extraction & Mapping Guidelines:
- When a user submits an interaction narrative via chat, aggressively extract and populate ALL the following attributes for the `log_interaction` tool:
  * `hcp_name`: Extract clean names (e.g., "Dr. Smith").
  * `interaction_type`: Default to "Meeting" unless another mode is explicitly stated.
  * `date` & `time`: Extract the date (formatted as YYYY-MM-DD or MM/DD/YYYY) and time if specified.
  * `attendees`: List any colleague names or additional personnel present.
  * `topics`: Map discussion text directly (e.g., "Product X efficiency").
  * `materials`: Capture materials shared dynamically (e.g., if the user says "I shared the brochures", populate this field with "Brochures").
  * `samples_distributed`: Map any specific product samples left behind.
  * `sentiment`: Classify strictly as "Positive", "Neutral", or "Negative" (e.g., if the user mentions "positive sentiment" or a welcoming tone, map it to "Positive").
  * `outcomes` & `follow_up_actions`: Extract any next steps or action items mentioned.

General Guidelines:
- Always extract as many structured fields as possible from the user's natural language input.
- Be professional, concise, and helpful.
- When presenting results, format them clearly.
- If the user's request is ambiguous, ask for clarification before using a tool.
- Always confirm successful actions to the user.
- Do NOT manually generate XML/HTML tags or '<function=...>' or '</function>' wrappers in your text response. Let the API handle tool invocation natively.
"""


# ── Graph nodes ───────────────────────────────────────────────────────────────

def agent_node(state: AgentState) -> dict:
    """Invoke the LLM with the current message history."""
    messages = state["messages"]

    # Prepend system prompt if this is the first invocation
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + list(messages)

    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}


def should_continue(state: AgentState) -> str:
    """Decide whether to route to tools or end the conversation."""
    last_message = state["messages"][-1]

    # If the LLM made tool calls, route to the tool node
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END


# ── Tool node ─────────────────────────────────────────────────────────────────

tool_node = ToolNode(all_tools)


# ── Build the graph ───────────────────────────────────────────────────────────

def build_agent_graph():
    """Construct and compile the LangGraph StateGraph."""
    # pyrefly: ignore[bad-specialization]
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)

    # Set entry point
    graph.set_entry_point("agent")

    # Add conditional edge from agent
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})

    # Tools always route back to agent for another reasoning step
    graph.add_edge("tools", "agent")

    return graph.compile()



agent_graph = build_agent_graph()

# Run agent helper
async def run_agent(user_message: str) -> Any:
    """Run the agent graph with a user message and return the final AI response."""
    input_state = {"messages": [HumanMessage(content=user_message)]}

    for attempt in range(2):
        try:
            final_state = await agent_graph.ainvoke(input_state)
            last_message = final_state["messages"][-1]
            if hasattr(last_message, "content"):
                return str(last_message.content)
            return "I processed your request but couldn't generate a response. Please try again."
        except Exception as e:
            if "rate_limit" in str(e).lower() or "429" in str(e):
                return "⚠️ Rate limit reached. The Groq API is temporarily busy. Please wait a few seconds and try again."
            if "tool_use_failed" in str(e).lower() and attempt == 0:
                # Intermittent Groq tool parsing error, retry once
                continue
            raise e

    return "I processed your request but couldn't generate a response. Please try again."
