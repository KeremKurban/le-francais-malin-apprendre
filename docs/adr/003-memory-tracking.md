# ADR-003: Memory and Weakness Tracking

**Date:** 2026-04-30  
**Status:** Accepted

## Context

The platform must remember recurring mistakes and adapt exercises accordingly. We need a "memory model" that is:
- Persistent (survives sessions)
- Fast to query (for real-time recommendations)
- Interpretable (user-facing weakness display)

## Decision

Use a **relational aggregate approach** (not a vector store or graph DB for MVP):

### Weakness Table
- One row per (user, topic) pair
- `error_count`: cumulative across all sessions
- `error_type_counts`: JSONB map of error type → count
- `severity`: computed from error_count (low/medium/high)
- Updated in-place after every evaluation

### SkillLevel Table
- One row per (user, skill)
- Score updated via **Exponential Moving Average** (α=0.3)
- Level derived from score thresholds (A1/A2/B1/B2)
- Confidence grows with sample count, caps at 1.0

### ReviewRecommendation Table
- Rebuilt from scratch after each evaluation (top 5 by error count)
- Avoids stale recommendations
- Dominant error type → exercise type mapping drives suggestions

## Alternatives Considered

| Option | Rejected Because |
|--------|-----------------|
| Vector similarity search | Overkill for MVP; no semantic similarity needed |
| LLM-generated recommendations | Extra API call; deterministic mapping is fast and predictable |
| Spaced repetition (SM-2) | Good future addition but complexity not justified for MVP |
| Graph DB (Neo4j) | Adds ops overhead; topic graph is small and can use adjacency lists in PG |

## Consequences

- **Positive:** All reads are simple indexed SQL queries
- **Positive:** No ML inference needed for recommendations
- **Positive:** Easy to debug and explain to users
- **Negative:** EMA decay may be too slow to react to sudden improvement
- **Negative:** Weakness severity is a coarse signal (error count, not error recency)
- **Mitigation:** Add `last_seen` timestamp so the UI can show "not seen in X days"
