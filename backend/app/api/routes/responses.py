from fastapi import APIRouter
from sqlalchemy import select

from app.core.deps import DB, CurrentUser
from app.models.response import UserResponse

router = APIRouter(prefix="/responses", tags=["responses"])


@router.get("/session/{session_id}")
async def get_session_responses(session_id: str, db: DB, current_user: CurrentUser):
    from uuid import UUID
    result = await db.execute(
        select(UserResponse).where(
            UserResponse.session_id == UUID(session_id),
            UserResponse.user_id == current_user.id,
        ).order_by(UserResponse.created_at)
    )
    responses = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "exercise_id": str(r.exercise_id),
            "content": r.content,
            "score": r.score,
            "attempt_number": r.attempt_number,
            "created_at": r.created_at.isoformat(),
        }
        for r in responses
    ]
