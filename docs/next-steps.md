# Next Steps — Le Français Malin

## Sprint 2 (after MVP)

### Speaking Mode
- Integrate Web Speech API (browser) for speech-to-text in the frontend
- Transcribe and send to the same evaluation endpoint
- Add phonetics error type to the error taxonomy
- Display pronunciation corrections

### Richer Topic Graph
- Expose topic dependency edges (e.g., "conditionnel" requires "imparfait")
- Visualize as a force-directed graph in the frontend
- Route users through prerequisite topics before advanced ones

### Streak & Gamification
- Daily streak counter (reset if no session in 24h)
- XP points per session and per score bracket
- Badge system: "Grammar Master", "FIDE Ready", "7-day streak", etc.

### Session Replay
- Let users review past sessions with full error list
- Allow re-attempting any past exercise
- Show improvement delta vs first attempt

---

## Sprint 3

### A/B Prompt Testing
- Implement experiment flag to route 50% of evaluations to `prompt_v2`
- Track split in MLflow with an `ab_group` tag
- Auto-select the winning prompt after N=100 samples per group

### Listening Comprehension
- Generate audio for exercise prompts using TTS (e.g., `edge-tts`)
- Build a listening exercise type where the user hears a dialogue and answers

### Knowledge Graph (Advanced)
- Store topic relationships in a graph DB or with adjacency list in PostgreSQL
- Build a recommendation engine that traverses the graph
- Visualize the "path to B2" for each user

### Multi-user Analytics
- Admin dashboard showing aggregate error frequency across all users
- Heatmap of most common mistakes per exam × level combination
- Feeds into automated prompt improvement suggestions

---

## Infrastructure & DevOps

- [ ] Add Redis for API rate limiting and session caching
- [ ] Move MLflow artifact storage to S3 (MinIO in docker-compose)
- [ ] Set up a staging environment with CI/CD auto-deploy
- [ ] Add Sentry for error monitoring (frontend + backend)
- [ ] Add OpenTelemetry tracing for end-to-end latency visibility
- [ ] PostgreSQL read replica for analytics queries

---

## Quality & Testing

- [ ] Add `pytest-httpx` mock for Claude API in exercise generation tests
- [ ] Add E2E tests with Playwright for the exercise → evaluation → feedback flow
- [ ] Add load tests (k6) to measure throughput under concurrent evaluations
- [ ] Property-based testing for the weakness severity computation

---

## Prompt Improvement Roadmap

| Version | Focus |
|---------|-------|
| v1 (current) | Baseline — general evaluation, 6 error types, 5 next-step types |
| v2 (planned) | Add CEFR calibration examples as few-shot shots in the prompt |
| v3 (planned) | Add error pattern deduplication (avoid reporting same error twice) |
| v4 (planned) | Personalized corrections referencing the user's known weaknesses |
