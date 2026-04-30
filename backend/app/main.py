from contextlib import asynccontextmanager

import mlflow
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import create_tables
from app.api.routes import auth, topics, exercises, responses, sessions, progress, evaluations

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
    mlflow.set_experiment(settings.mlflow_experiment_name)
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


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
