# Architecture — Le Français Malin

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (React SPA)                                             │
│  • Supabase Auth (JWT)     • Backend API calls (JWT)            │
│  • TanStack Query          • Recharts, shadcn/ui                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
┌────────────────────────────▼────────────────────────────────────┐
│  FastAPI Backend (Python 3.12)                                   │
│                                                                  │
│  Routes                   Services                              │
│  /auth/*          ──────► AuthService (JWT + bcrypt)            │
│  /topics/*        ──────► TopicRepository                       │
│  /exercises/*     ──────► ExerciseService ──► Claude API        │
│  /evaluations/*   ──────► EvaluationService ──► Claude API     │
│                            └──► MLflowService ──► MLflow        │
│  /sessions/*      ──────► SessionRepository                     │
│  /progress/*      ──────► WeaknessService                       │
│                            RecommendationService                 │
└────────────┬──────────────────────────────────────────────────-─┘
             │
     ┌───────▼───────┐    ┌──────────────┐    ┌────────────────┐
     │  PostgreSQL   │    │  Anthropic   │    │  MLflow Server │
     │  (SQLAlchemy) │    │  Claude API  │    │  (SQLite / S3) │
     └───────────────┘    └──────────────┘    └────────────────┘
```

## Request Flow: Exercise Generation

```
1. User clicks "Nouvel exercice" in UI
2. Frontend calls POST /api/v1/exercises/generate
   { exam_type: "DELF", level: "B1", exercise_type: "writing_prompt", ... }
3. ExerciseService:
   a. Resolves topic (from DB or creates default)
   b. Builds user message from EXERCISE_USER_TEMPLATE_V1
   c. Calls Claude API with cached system prompt
   d. Parses JSON response
   e. Persists Exercise to PostgreSQL
4. Returns ExerciseOut to frontend
5. Frontend displays exercise prompt + context
```

## Request Flow: Response Evaluation

```
1. User submits response text
2. Frontend calls POST /api/v1/evaluations/evaluate
   { exercise_id, session_id, response_content, attempt_number }
3. EvaluationService:
   a. Builds evaluation prompt from EVALUATION_USER_TEMPLATE_V1
   b. Opens MLflow run via MLflowService.start_eval_run()
   c. Calls Claude API with cached system prompt
   d. Parses JSON evaluation (score, errors, next_steps)
   e. Persists UserResponse, ResponseErrors, ExperimentRun
   f. Closes MLflow run with metrics (score, latency, error counts)
4. WeaknessService.update_weakness() — increments error counts per topic
5. WeaknessService.update_skill_level() — EMA update of skill score
6. RecommendationService.refresh_recommendations() — rebuilds top-5
7. Returns EvaluationResult to frontend
8. Frontend shows: score ring, errors with corrections, next-step choices
9. User picks a next step (reformulate, retry, variation, role-play, grammar)
```

## Data Flow: Memory System

```
Each evaluation → ResponseError rows (per mistake)
                ↓
          Weakness table (user × topic → error count, severity)
                ↓
     ReviewRecommendation table (top 5 by error count)
                ↓
     SkillLevel table (per skill, EMA of score history)
                ↓
     Dashboard API aggregates all for display
```

## Prompt Versioning

System prompts are stored in `backend/app/prompts/`.
Each module exposes a `PROMPT_VERSION` constant (`"v1"`, `"v2"`, …).
The version is:
- stored on every `Exercise` row
- stored on every `ExperimentRun` row
- logged as an MLflow tag on every evaluation run

This allows comparing evaluation quality across prompt versions in MLflow.

## Authentication

**Frontend:** Supabase Auth (email/password, OAuth)  
**Backend:** Own JWT (`python-jose` + `bcrypt`)  
**Bridge:** `useBackendAuth` hook auto-registers the Supabase user on the backend on first load, then stores the backend JWT in `localStorage`. No password input required from the user.

## Claude API Integration

- Model: `claude-sonnet-4-6`  
- System prompts use `"cache_control": {"type": "ephemeral"}` for prompt caching (reduces cost and latency on repeated calls)
- Responses are expected as strict JSON; code fences are stripped before parsing
- All calls are sync (anthropic SDK used synchronously inside async FastAPI handlers via thread executor for full async support in the future)

## MLflow Tracking

- Experiment name: `francais-malin-evaluations` (configurable via `MLFLOW_EXPERIMENT_NAME`)
- Each evaluation call = 1 MLflow run
- Tags: `prompt_version`, `model`, `eval_type`
- Params: `exam_type`, `level`, `exercise_type`, `attempt_number`
- Metrics: `score`, `error_count`, `strengths_count`, `latency_ms`
- Artifacts: `evaluation.json` (full Claude response), `request_params.json`

## Scalability Notes

- Async SQLAlchemy engine with connection pool (ready for horizontal scaling)
- Stateless backend (sessions in DB, not server memory)
- MLflow can be backed by S3 + RDS for production (change in docker-compose)
- Claude API calls are the main latency source (~1-3s); can be moved to background tasks with a queue if needed
