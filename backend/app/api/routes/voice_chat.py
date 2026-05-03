"""
Voice chat API routes.
"""
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.core.deps import DB, CurrentUser
from app.schemas.voice_chat import (
    StartSessionRequest,
    StartSessionResponse,
    ChatMessageRequest,
    ChatMessageResponse,
    EndSessionResponse,
    VoiceSessionSummary,
)
from app.services.voice_chat_service import (
    start_voice_session,
    chat_turn,
    end_voice_session,
    get_user_sessions,
)

router = APIRouter(prefix="/voice-chat", tags=["voice-chat"])


@router.post("/sessions", response_model=StartSessionResponse, status_code=201)
async def start_session(
    body: StartSessionRequest,
    db: DB,
    current_user: CurrentUser,
):
    """Start a new voice conversation session and return the first greeting."""
    session = await start_voice_session(
        user=current_user,
        db=db,
        exam_type=body.exam_type,
        level=body.level,
    )

    # Generate the opening greeting immediately
    try:
        greeting = await chat_turn(session.id, "__GREET__", db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate greeting: {exc}") from exc

    await db.commit()

    return StartSessionResponse(
        session_id=str(session.id),
        exam_type=session.exam_type,
        level=session.level,
        topic=session.topic_chosen or "",
        greeting=greeting,
    )


@router.post("/sessions/{session_id}/message", response_model=ChatMessageResponse)
async def send_message(
    session_id: UUID,
    body: ChatMessageRequest,
    db: DB,
    current_user: CurrentUser,
):
    """Send a user message and get the agent response."""
    try:
        agent_message = await chat_turn(session_id, body.user_message, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Chat error: {exc}") from exc

    await db.commit()

    return ChatMessageResponse(
        agent_message=agent_message,
        turn_number=body.turn_number + 1,
    )


@router.post("/sessions/{session_id}/end", response_model=EndSessionResponse)
async def end_session(
    session_id: UUID,
    db: DB,
    current_user: CurrentUser,
):
    """End the session and return structured feedback."""
    # Load session to get transcript before ending
    from sqlalchemy import select
    from app.models.voice_session import VoiceSession

    result = await db.execute(
        select(VoiceSession).where(
            VoiceSession.id == session_id,
            VoiceSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    transcript = list(session.turns or [])

    try:
        feedback = await end_voice_session(session_id, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Feedback error: {exc}") from exc

    await db.commit()

    return EndSessionResponse(
        session_id=str(session_id),
        score=float(feedback.get("score", 0)),
        overall_feedback=feedback.get("overall_feedback", ""),
        grammar_errors=feedback.get("grammar_errors", []),
        vocabulary_suggestions=feedback.get("vocabulary_suggestions", []),
        strengths=feedback.get("strengths", []),
        improvements=feedback.get("improvements", []),
        transcript=transcript,
    )


@router.get("/sessions", response_model=list[VoiceSessionSummary])
async def list_sessions(
    db: DB,
    current_user: CurrentUser,
):
    """List all voice sessions for the current user."""
    sessions = await get_user_sessions(current_user.id, db)
    return [
        VoiceSessionSummary(
            session_id=str(s.id),
            exam_type=s.exam_type,
            level=s.level,
            topic=s.topic_chosen,
            score=s.score,
            created_at=s.created_at.isoformat(),
            status=s.status,
        )
        for s in sessions
    ]
