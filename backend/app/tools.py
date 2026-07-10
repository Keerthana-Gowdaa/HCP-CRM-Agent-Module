"""
tools.py – Five LangChain-compatible tools for the HCP CRM agent.

Each tool is decorated with @tool so LangGraph can bind them to the LLM.
"""

import json
from langchain_core.tools import tool
from app.database import SessionLocal, Interaction


# ---------------------------------------------------------------------------
# 1. log_interaction

@tool
def log_interaction(
    hcp_name: str,
    interaction_type: str = "Meeting",
    date: str = "",
    time: str = "",
    topics: str = "",
    materials: str = "",
    sentiment: str = "Neutral",
    outcomes: str = "",
    attendees: str = "",
    samples_distributed: str = "",
    follow_up_actions: str = "",
) -> str:
    """Log a new HCP interaction to the CRM database.

    Args:
        hcp_name: Full name of the healthcare professional (e.g. "Dr. Smith").
        interaction_type: Type of interaction – Meeting, Call, Email, Conference, or Lunch.
        date: Date of the interaction (e.g. "2025-07-10").
        time: Time of the interaction (e.g. "14:30").
        topics: Comma-separated topics discussed.
        materials: Materials shared or referenced.
        sentiment: Overall sentiment – Positive, Neutral, or Negative.
        outcomes: Key outcomes or next steps.
    """
    db = SessionLocal()
    try:
        record = Interaction(
            hcp_name=hcp_name,
            interaction_type=interaction_type,
            date=date,
            time=time,
            topics=topics,
            materials=materials,
            sentiment=sentiment,
            outcomes=outcomes,
            attendees=attendees,
            samples_distributed=samples_distributed,
            follow_up_actions=follow_up_actions,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return json.dumps(
            {
                "status": "success",
                "message": f"Interaction #{record.id} logged for {hcp_name}.",
                "record": record.to_dict(),
            },
            default=str,
        )
    except Exception as e:
        db.rollback()
        return json.dumps({"status": "error", "message": str(e)})
    finally:
        db.close()


# ---------------------------------------------------------------------------
# 2. edit_interaction
# ---------------------------------------------------------------------------
@tool
def edit_interaction(
    interaction_id: int,
    hcp_name: str = "",
    interaction_type: str = "",
    date: str = "",
    time: str = "",
    topics: str = "",
    materials: str = "",
    sentiment: str = "",
    outcomes: str = "",
    attendees: str = "",
    samples_distributed: str = "",
    follow_up_actions: str = "",
) -> str:
    """Edit an existing HCP interaction in the CRM database.

    Args:
        interaction_id: The ID of the interaction record to update.
        hcp_name: Updated HCP name (leave empty to keep current).
        interaction_type: Updated interaction type (leave empty to keep current).
        date: Updated date (leave empty to keep current).
        time: Updated time (leave empty to keep current).
        topics: Updated topics (leave empty to keep current).
        materials: Updated materials (leave empty to keep current).
        sentiment: Updated sentiment (leave empty to keep current).
        outcomes: Updated outcomes (leave empty to keep current).
    """
    db = SessionLocal()
    try:
        record = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not record:
            return json.dumps(
                {"status": "error", "message": f"Interaction #{interaction_id} not found."}
            )

        if hcp_name:
            record.hcp_name = hcp_name
        if interaction_type:
            record.interaction_type = interaction_type
        if date:
            record.date = date
        if time:
            record.time = time
        if topics:
            record.topics = topics
        if materials:
            record.materials = materials
        if sentiment:
            record.sentiment = sentiment
        if outcomes:
            record.outcomes = outcomes
        if attendees:
            record.attendees = attendees
        if samples_distributed:
            record.samples_distributed = samples_distributed
        if follow_up_actions:
            record.follow_up_actions = follow_up_actions

        db.commit()
        db.refresh(record)
        return json.dumps(
            {
                "status": "success",
                "message": f"Interaction #{interaction_id} updated.",
                "record": record.to_dict(),
            },
            default=str,
        )
    except Exception as e:
        db.rollback()
        return json.dumps({"status": "error", "message": str(e)})
    finally:
        db.close()


# ---------------------------------------------------------------------------
# 3. get_hcp_history
# ---------------------------------------------------------------------------
@tool
def get_hcp_history(hcp_name: str) -> str:
    """Retrieve all past interactions for a given HCP from the CRM database.

    Args:
        hcp_name: Full or partial name of the healthcare professional to search.
    """
    db = SessionLocal()
    try:
        results = (
            db.query(Interaction)
            .filter(Interaction.hcp_name.like(f"%{hcp_name}%"))
            .order_by(Interaction.created_at.desc())
            .all()
        )
        if not results:
            return json.dumps(
                {
                    "status": "success",
                    "message": f"No interactions found for '{hcp_name}'.",
                    "records": [],
                }
            )
        return json.dumps(
            {
                "status": "success",
                "message": f"Found {len(results)} interaction(s) for '{hcp_name}'.",
                "records": [r.to_dict() for r in results],
            },
            default=str,
        )
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})
    finally:
        db.close()


# ---------------------------------------------------------------------------
# 4. search_medical_materials
# ---------------------------------------------------------------------------
@tool
def search_medical_materials(query: str) -> str:
    """Search the medical materials library for relevant scientific assets.

    Args:
        query: A keyword or phrase to search for in the materials library (e.g. "OncoBoost", "diabetes", "cardiology").
    """
    # Mock materials database – in production, this would query a real document store.
    materials_db = [
        {
            "id": "MAT-001",
            "title": "OncoBoost Phase III Clinical Trial Results",
            "type": "PDF",
            "category": "Oncology",
            "keywords": ["oncoboost", "oncology", "phase iii", "clinical trial", "cancer"],
            "description": "Comprehensive Phase III trial data showing 34% improvement in progression-free survival.",
            "approved_date": "2025-03-15",
        },
        {
            "id": "MAT-002",
            "title": "CardioGuard Efficacy Summary",
            "type": "PDF",
            "category": "Cardiology",
            "keywords": ["cardioguard", "cardiology", "heart", "efficacy", "cardiovascular"],
            "description": "Summary of CardioGuard's efficacy in reducing major cardiac events by 28%.",
            "approved_date": "2025-05-20",
        },
        {
            "id": "MAT-003",
            "title": "DiabeCare HbA1c Reduction Data",
            "type": "Slide Deck",
            "category": "Endocrinology",
            "keywords": ["diabecare", "diabetes", "hba1c", "endocrinology", "glucose"],
            "description": "Real-world evidence showing 1.2% HbA1c reduction over 24 weeks.",
            "approved_date": "2025-01-10",
        },
        {
            "id": "MAT-004",
            "title": "ImmunoShield Safety Profile",
            "type": "PDF",
            "category": "Immunology",
            "keywords": ["immunoshield", "immunology", "safety", "autoimmune", "biologics"],
            "description": "Post-market safety data from 10,000+ patients across 3 years.",
            "approved_date": "2025-06-01",
        },
        {
            "id": "MAT-005",
            "title": "NeuroCalm Mechanism of Action",
            "type": "Video",
            "category": "Neurology",
            "keywords": ["neurocalm", "neurology", "mechanism", "cns", "anxiety", "depression"],
            "description": "Animated explainer on NeuroCalm's novel dual-receptor mechanism.",
            "approved_date": "2025-04-22",
        },
        {
            "id": "MAT-006",
            "title": "PulmoFlex Respiratory Outcomes",
            "type": "PDF",
            "category": "Pulmonology",
            "keywords": ["pulmoflex", "pulmonology", "respiratory", "copd", "asthma", "lung"],
            "description": "12-month data on FEV1 improvements in moderate-to-severe COPD patients.",
            "approved_date": "2025-02-28",
        },
    ]

    query_lower = query.lower()
    matches = [
        m
        for m in materials_db
        if any(kw in query_lower for kw in m["keywords"])
        or query_lower in str(m["title"]).lower()
        or query_lower in str(m["category"]).lower()
    ]

    if not matches:
        return json.dumps(
            {
                "status": "success",
                "message": f"No materials found matching '{query}'. Try broader keywords like 'oncology' or 'diabetes'.",
                "materials": [],
            }
        )

    return json.dumps(
        {
            "status": "success",
            "message": f"Found {len(matches)} material(s) matching '{query}'.",
            "materials": [
                {
                    "id": m["id"],
                    "title": m["title"],
                    "type": m["type"],
                    "category": m["category"],
                    "description": m["description"],
                    "approved_date": m["approved_date"],
                }
                for m in matches
            ],
        }
    )


# ---------------------------------------------------------------------------
# 5. suggest_follow_ups
# ---------------------------------------------------------------------------
@tool
def suggest_follow_ups(context: str) -> str:
    """Suggest compliant follow-up actions based on the interaction context.

    Args:
        context: A description of the recent interaction, including HCP name, topics discussed, and any commitments made.
    """
    context_lower = context.lower()

    suggestions = []

    # General follow-ups applicable to any interaction
    base_follow_ups = [
        {
            "action": "Send Thank-You Email",
            "timeline": "Within 24 hours",
            "priority": "High",
            "compliance_note": "Use approved email templates only. Do not include off-label information.",
        },
        {
            "action": "Update CRM Record",
            "timeline": "Same day",
            "priority": "High",
            "compliance_note": "Ensure all interaction details are accurately captured for audit trail.",
        },
    ]
    suggestions.extend(base_follow_ups)

    # Context-specific follow-ups
    if any(kw in context_lower for kw in ["trial", "clinical", "study", "phase", "data"]):
        suggestions.append(
            {
                "action": "Share Approved Clinical Data Package",
                "timeline": "Within 48 hours",
                "priority": "High",
                "compliance_note": "Only share MLR-approved materials. Verify expiry dates.",
            }
        )

    if any(kw in context_lower for kw in ["sample", "prescription", "prescribe", "dosing"]):
        suggestions.append(
            {
                "action": "Arrange Product Sample Delivery",
                "timeline": "Within 1 week",
                "priority": "Medium",
                "compliance_note": "Follow state-level sample distribution regulations. Log in PDMA system.",
            }
        )

    if any(kw in context_lower for kw in ["speaker", "presentation", "conference", "advisory"]):
        suggestions.append(
            {
                "action": "Submit Speaker Engagement Request",
                "timeline": "Within 1 week",
                "priority": "Medium",
                "compliance_note": "Requires medical affairs approval. HCP must pass Fair Market Value assessment.",
            }
        )

    if any(kw in context_lower for kw in ["question", "concern", "adverse", "side effect", "safety"]):
        suggestions.append(
            {
                "action": "Escalate to Medical Information Team",
                "timeline": "Within 24 hours",
                "priority": "Critical",
                "compliance_note": "Any adverse event reports must be submitted to pharmacovigilance within 24 hours.",
            }
        )

    if any(kw in context_lower for kw in ["competitive", "competitor", "comparison"]):
        suggestions.append(
            {
                "action": "Prepare Approved Competitive Positioning Materials",
                "timeline": "Before next interaction",
                "priority": "Medium",
                "compliance_note": "Only use approved competitive materials. No disparagement of competitor products.",
            }
        )

    suggestions.append(
        {
            "action": "Schedule Follow-Up Meeting",
            "timeline": "Within 2 weeks",
            "priority": "Medium",
            "compliance_note": "Ensure meeting frequency complies with institutional access policies.",
        }
    )

    return json.dumps(
        {
            "status": "success",
            "message": f"Generated {len(suggestions)} follow-up suggestion(s).",
            "follow_ups": suggestions,
        }
    )


# Export all tools as a list for the agent to bind
all_tools = [
    log_interaction,
    edit_interaction,
    get_hcp_history,
    search_medical_materials,
    suggest_follow_ups,
]
