from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.core.deps import DB, CurrentUser
from app.models.session import LearningSession
from app.schemas.session import CreateSessionRequest, SessionOut

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionOut, status_code=201)
async def create_session(body: CreateSessionRequest, db: DB, current_user: CurrentUser):
    session = LearningSession(
        user_id=current_user.id,
        exam_type=body.exam_type,
        mode=body.mode,
        level=body.level,
    )
    db.add(session)
    await db.flush()
    return session


@router.get("", response_model=list[SessionOut])
async def list_sessions(db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(LearningSession)
        .where(LearningSession.user_id == current_user.id)
        .order_by(LearningSession.started_at.desc())
        .limit(20)
    )
    return result.scalars().all()


@router.patch("/{session_id}/end", response_model=SessionOut)
async def end_session(session_id: str, db: DB, current_user: CurrentUser):
    from uuid import UUID
    result = await db.execute(
        select(LearningSession).where(
            LearningSession.id == UUID(session_id),
            LearningSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.ended_at = datetime.now(timezone.utc)
    await db.flush()
    return session
