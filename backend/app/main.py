import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.core.config import get_settings
from app.core.database import create_tables
from app.api.routes import auth, topics, exercises, responses, sessions, progress, evaluations
from app.api.routes import voice_chat
from app.models.voice_session import VoiceSession  # noqa: F401 — needed for create_tables

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    try:
        from app.db.seed_data import seed
        await seed()
    except Exception as exc:
        print(f"[startup] seed_data skipped: {exc}")
    try:
        from app.services.cache_service import warm_cache
        from app.services.async_eval_service import run_evaluation_background
        # Recover orphaned async evaluations
        from app.models.async_evaluation import AsyncEvaluation
        from app.core.database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            orphans = (await db.execute(
                select(AsyncEvaluation).where(AsyncEvaluation.status.in_(["pending", "running"]))
            )).scalars().all()
            for orphan in orphans:
                orphan.status = "pending"
                task = asyncio.create_task(run_evaluation_background(orphan.id))
            if orphans:
                await db.commit()
        # Pre-warm common combinations
        asyncio.create_task(warm_cache([
            ("DELF", "A2", "writing_prompt"), ("DELF", "B1", "writing_prompt"),
            ("FIDE", "A2", "role_play"), ("FIDE", "B1", "writing_prompt"),
        ]))
    except Exception as e:
        print(f"[startup] cache/recovery skipped: {e}")
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Adaptive French learning platform for FIDE and DELF exam preparation",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"
app.include_router(auth.router, prefix=PREFIX)
app.include_router(topics.router, prefix=PREFIX)
app.include_router(exercises.router, prefix=PREFIX)
app.include_router(responses.router, prefix=PREFIX)
app.include_router(sessions.router, prefix=PREFIX)
app.include_router(progress.router, prefix=PREFIX)
app.include_router(evaluations.router, prefix=PREFIX)
app.include_router(voice_chat.router, prefix=PREFIX)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
