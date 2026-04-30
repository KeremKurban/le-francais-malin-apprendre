# ADR-002: AI Evaluation Strategy

**Date:** 2026-04-30  
**Status:** Accepted

## Context

We need to evaluate free-text French responses automatically and extract:
- An overall score (0–100)
- Specific errors with corrections
- Actionable next steps for the learner

## Decision

Use Claude (`claude-sonnet-4-6`) with a **structured JSON output** approach:
1. System prompt is versioned and cached (`cache_control: ephemeral`)
2. User message includes the exercise, rubric, level, and user response
3. Claude returns strict JSON (no prose outside the JSON)
4. Frontend renders errors, corrections, and next-step choices

**Error taxonomy:** 6 types (grammar, vocabulary, spelling, syntax, register, conjugation)  
**Severity:** 3 levels (minor, moderate, major)  
**Next steps:** 5 types (reformulate, retry, variation, mini_role_play, grammar_focus)

## Why Not Fine-Tuning or RAG?

- Fine-tuning requires GPU inference — excluded by constraint
- RAG for French grammar rules would need a maintained knowledge base; Claude already encodes this
- Structured prompting gives us full control over evaluation dimensions without model training

## Prompt Caching

System prompts are long (~500 tokens). By adding `cache_control: ephemeral`, Anthropic caches them for 5 minutes. On back-to-back exercise evaluations (common pattern), this reduces cost by ~60% and latency by ~30%.

## Consequences

- **Positive:** Zero infrastructure for AI; scales to any load via API
- **Positive:** Prompt caching reduces cost on repeated evaluations
- **Positive:** JSON output is deterministic enough for parsing (tested with 100+ responses)
- **Negative:** Rare JSON parse failures require a retry or fallback error message
- **Negative:** Score calibration varies by Claude model version; must re-validate on model upgrades
