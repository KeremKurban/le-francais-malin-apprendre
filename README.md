# Le Français Malin — Adaptive French Learning Platform

An interactive, AI-powered French learning platform for **FIDE** (everyday Swiss life) and **DELF** (A1–B2 structured levels) exam preparation. The platform enforces active engagement: you write a response, the AI evaluates it, surfaces your exact mistakes, and immediately proposes the next practice step.

---

## Product Goal

| Principle | Implementation |
|-----------|---------------|
| Active, not passive | Every session asks you to write or respond |
| Mistake-driven | Errors are stored, analyzed, and re-surfaced |
| Adaptive | Exercises are generated on the fly by Claude |
| Measurable | MLflow tracks every evaluation run and prompt version |
| Exam-ready | Content maps directly to FIDE and DELF rubrics |

---

## Architecture Overview

```
le-francais-malin-apprendre/
├── src/                  # React 18 frontend (Vite + TypeScript + Tailwind + shadcn/ui)
├── backend/              # FastAPI backend (Python 3.12)
│   ├── app/
│   │   ├── api/routes/   # REST endpoints
│   │   ├── core/         # Config, DB engine, JWT security, DI deps
│   │   ├── models/       # SQLAlchemy ORM models (10 entities)
│   │   ├── schemas/      # Pydantic v2 request/response schemas
│   │   ├── services/     # Business logic (exercise, evaluation, weakness, mlflow)
│   │   ├── prompts/      # Versioned system prompts and rubrics
│   │   └── db/           # Seed data and migration helpers
│   └── tests/
├── docs/                 # Architecture decisions, data schema, user stories
│   └── adr/              # Architecture Decision Records
├── mlflow/               # MLflow experiment configuration
├── infra/                # Nginx config, deployment helpers
└── .github/workflows/    # GitHub Actions CI (lint + test)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query |
| Backend | FastAPI, SQLAlchemy 2.0 (async), Alembic |
| Database | PostgreSQL 16 |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) with prompt caching |
| Experiment tracking | MLflow 2.x |
| Auth | Supabase Auth (frontend) + JWT validation (backend) |
| Infrastructure | Docker, docker-compose |
| CI | GitHub Actions |

---

## Quick Start

### Prerequisites

- Docker ≥ 24 and docker-compose v2
- An [Anthropic API key](https://console.anthropic.com/)
- A [Supabase](https://supabase.com/) project (for auth)

### 1. Clone and configure

```bash
git clone https://github.com/keremkurban/le-francais-malin-apprendre.git
cd le-francais-malin-apprendre
cp .env.example .env
# Fill in ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SECRET_KEY
```

### 2. Start all services

```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs |
| MLflow UI | http://localhost:5001 |

### 3. Initialize database

```bash
docker-compose exec backend alembic upgrade head
docker-compose exec backend python -m app.db.seed_data
```

### 4. Local development (without Docker)

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
npm install
npm run dev
```

---

## Key Features

### Active Exercise Loop

```
Present topic → User writes response → Claude evaluates
→ Show mistakes with corrections → User picks next step:
   • Reformulate the same sentence
   • Retry with a variation
   • Mini role-play on the topic
   • Deep-dive grammar focus
→ Memory updated → Next exercise adapts
```

### FIDE Topics (Swiss everyday situations)

- Administrative tasks (bank, doctor, municipality, AHV)
- Transport and housing
- Work, employment, and professional contexts
- Shopping, services, and daily life
- Social and cultural situations in Switzerland

### DELF Topics (A1–B2 structured levels)

- **A1**: Greetings, basic needs, numbers, family
- **A2**: Daily routines, hobbies, directions, feelings
- **B1**: Opinions, social situations, work, current events
- **B2**: Abstract arguments, formal writing, complex grammar

### MLflow Experiment Tracking

Every AI evaluation call logs:
- Prompt version and model parameters
- Score distribution (mean, std, per-skill breakdown)
- Error type frequencies by category
- API latency metrics (p50, p95)

---

## Data Model

See [`docs/data-schema.md`](docs/data-schema.md) for the full entity diagram and field definitions.

Core entities: `User`, `Session`, `Topic`, `Exercise`, `Response`, `Error`, `Weakness`, `SkillLevel`, `ReviewRecommendation`, `ExperimentRun`.

---

## API Reference

Interactive docs at **http://localhost:8000/docs**.

Key endpoints:

```
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/topics?exam_type=FIDE&level=B1
POST /api/v1/exercises/generate
POST /api/v1/evaluations/evaluate
GET  /api/v1/progress/dashboard
GET  /api/v1/progress/weaknesses
GET  /api/v1/progress/recommendations
GET  /api/v1/sessions
POST /api/v1/sessions
```

---

## Running Tests

```bash
cd backend
pytest tests/ -v --asyncio-mode=auto
```

---

## Architecture Decisions

- [ADR-001: Tech Stack Selection](docs/adr/001-tech-stack.md)
- [ADR-002: AI Evaluation Strategy](docs/adr/002-ai-evaluation.md)
- [ADR-003: Memory and Weakness Tracking](docs/adr/003-memory-tracking.md)

---

## Priority User Stories

See [`docs/user-stories.md`](docs/user-stories.md) for the full backlog.

**MVP (this sprint):**
1. As a learner, I can choose FIDE or DELF and my level
2. As a learner, I can write a response to an AI-generated exercise
3. As a learner, I receive structured feedback showing my exact mistakes
4. As a learner, I can choose my next practice step after an error
5. As a learner, I can see my progress dashboard with weak areas
6. As an admin, every evaluation is logged to MLflow for analysis

---

## Next Steps

See [`docs/next-steps.md`](docs/next-steps.md).
