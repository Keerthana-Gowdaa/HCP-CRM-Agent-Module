"""
main.py – FastAPI application with CORS middleware and API endpoints.
"""

import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import init_db, Interaction, get_db
from app.agent import run_agent


# ── Lifespan: auto-create tables on startup ───────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database tables when the application starts."""
    init_db()
    print("[OK] Database tables created / verified.")
    yield


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="HCP CRM Agent API",
    description="AI-powered CRM for managing Healthcare Professional interactions.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware – allow all origins during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / response schemas ────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


class LogRequest(BaseModel):
    hcp_name: str
    interaction_type: str = "Meeting"
    date: str = ""
    time: str = ""
    topics: str = ""
    materials: str = ""
    sentiment: str = "Neutral"
    outcomes: str = ""
    attendees: str = ""
    samples_distributed: str = ""
    follow_up_actions: str = ""


class LogResponse(BaseModel):
    status: str
    message: str
    record: dict | None = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Send a message to the AI agent and receive a response."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        response_text = await run_agent(request.message)
        return ChatResponse(response=response_text)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


@app.post("/api/log", response_model=LogResponse)
async def log_endpoint(request: LogRequest, db: Session = Depends(get_db)):
    """Manually log a structured HCP interaction."""
    try:
        record = Interaction(
            hcp_name=request.hcp_name,
            interaction_type=request.interaction_type,
            date=request.date,
            time=request.time,
            topics=request.topics,
            materials=request.materials,
            sentiment=request.sentiment,
            outcomes=request.outcomes,
            attendees=request.attendees,
            samples_distributed=request.samples_distributed,
            follow_up_actions=request.follow_up_actions,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return LogResponse(
            status="success",
            message=f"Interaction #{record.id} logged successfully.",
            record=record.to_dict(),
        )
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/interactions")
async def get_interactions(db: Session = Depends(get_db)):
    """Retrieve all logged interactions, most recent first."""
    try:
        records = (
            db.query(Interaction)
            .order_by(Interaction.created_at.desc())
            .limit(50)
            .all()
        )
        return {"interactions": [r.to_dict() for r in records]}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/")
async def root():
    return {"message": "HCP CRM Agent API is running.", "docs": "/docs"}
