# ADR-001: Technology Stack Selection

**Date:** 2026-04-30  
**Status:** Accepted

## Context

We need a full-stack web application for French language learning with AI evaluation. The key constraints are:
- No local GPU (all AI via API)
- Rapid development for MVP
- Must support async AI calls without blocking UI
- Needs experiment tracking from day one

## Decision

**Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui  
**Backend:** FastAPI (Python 3.12) + SQLAlchemy 2.0 (async) + Alembic  
**Database:** PostgreSQL 16  
**AI:** Anthropic Claude API (`claude-sonnet-4-6`)  
**Tracking:** MLflow 2.x  
**Auth:** Supabase Auth (frontend) + custom JWT (backend)  

## Alternatives Considered

| Option | Rejected Because |
|--------|-----------------|
| Next.js full-stack | Added complexity; we want a clear API boundary |
| Django REST Framework | Slower async support; Pydantic v2 integration less smooth |
| OpenAI GPT-4 | Higher cost, no prompt caching; Claude output is more structured |
| Weights & Biases | Heavier dependency; MLflow is OSS and self-hostable |
| Firebase Auth | Vendor lock-in; Supabase is already in the codebase |

## Consequences

- **Positive:** FastAPI + async SQLAlchemy enables non-blocking Claude API calls
- **Positive:** Pydantic v2 schemas serve as the single source of truth for request/response contracts
- **Positive:** MLflow self-hosted means no SaaS dependency for experiment tracking
- **Negative:** Two auth systems (Supabase + own JWT) require the `useBackendAuth` bridge hook
- **Negative:** Python async + anthropic SDK requires careful error handling (SDK is sync-first)
