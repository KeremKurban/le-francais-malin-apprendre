# User Stories — Le Français Malin

## Priority Legend
- **P0** — MVP blocker (must be in first release)
- **P1** — MVP stretch (nice to have in first release)
- **P2** — Next sprint
- **P3** — Future

---

## Authentication & Onboarding

| ID | Priority | Story |
|----|----------|-------|
| US-001 | P0 | As a new user, I can register with email and password so that my progress is saved. |
| US-002 | P0 | As a returning user, I can log in so that I see my previous sessions and mistakes. |
| US-003 | P0 | As a user, I can choose my target exam (FIDE or DELF) and CEFR level during onboarding. |
| US-004 | P1 | As a user, I can update my exam target and level in my profile settings. |

---

## Exercise & Active Practice

| ID | Priority | Story |
|----|----------|-------|
| US-010 | P0 | As a learner, I can generate a new AI-powered exercise for my chosen exam type and level. |
| US-011 | P0 | As a learner, I can write my response in a text area and submit it for evaluation. |
| US-012 | P0 | As a learner, I receive structured feedback immediately after submission: score, errors, strengths. |
| US-013 | P0 | As a learner, I can see each error highlighted with the original text, correction, and pedagogical explanation. |
| US-014 | P0 | As a learner, I can choose my next step after an error: reformulate, retry, variation, mini role-play, or grammar focus. |
| US-015 | P0 | As a learner, I can generate exercises filtered by topic (from the topic map). |
| US-016 | P1 | As a learner, I can see how many attempts I have made on each exercise. |
| US-017 | P2 | As a learner, I can practice in speaking mode (upload audio or record in browser). |

---

## Topic Map

| ID | Priority | Story |
|----|----------|-------|
| US-020 | P0 | As a learner, I can browse all available FIDE and DELF topics on a visual topic map. |
| US-021 | P0 | As a learner, I can filter DELF topics by CEFR level (A1, A2, B1, B2). |
| US-022 | P0 | As a learner, I can click a topic to generate an exercise specifically for that topic. |
| US-023 | P1 | As a learner, I can see which topics I have practiced recently. |
| US-024 | P2 | As a learner, I can see a dependency graph showing which topics build on others. |

---

## Mock Exam

| ID | Priority | Story |
|----|----------|-------|
| US-030 | P0 | As a learner, I can start a mock exam with 5 exercises and a 30-minute timer. |
| US-031 | P0 | As a learner, I can see a countdown timer during the mock exam. |
| US-032 | P0 | As a learner, I see a summary with per-exercise scores and error count at the end of the exam. |
| US-033 | P1 | As a learner, the mock exam covers all exercise types (writing, grammar, role-play). |

---

## Progress & Memory

| ID | Priority | Story |
|----|----------|-------|
| US-040 | P0 | As a learner, I can see my progress dashboard with total sessions, exercises, and average score. |
| US-041 | P0 | As a learner, I can see a radar chart of my estimated skill levels (grammar, vocabulary, writing, etc.). |
| US-042 | P0 | As a learner, I can see my top weaknesses ranked by error count with severity badges. |
| US-043 | P0 | As a learner, I receive up to 5 personalized practice recommendations based on my weaknesses. |
| US-044 | P1 | As a learner, I can see a line chart of my score evolution over recent exercises. |
| US-045 | P1 | As a learner, I can see my session history with date, exam type, level, and score. |
| US-046 | P2 | As a learner, I can see my streak (consecutive days of practice). |
| US-047 | P2 | As a learner, I can review all past errors with search and filter by error type. |

---

## MLflow / Admin

| ID | Priority | Story |
|----|----------|-------|
| US-050 | P0 | As an admin, every evaluation call is logged to MLflow with prompt version, model, score, and latency. |
| US-051 | P0 | As an admin, I can compare evaluation quality across prompt versions in the MLflow UI. |
| US-052 | P1 | As an admin, I can see error type distribution per exam type and level in MLflow. |
| US-053 | P2 | As an admin, I can A/B test two evaluation prompts and measure score distribution differences. |

---

## MVP Scope (P0 only)

The following 20 stories define the MVP:
US-001, US-002, US-003, US-010, US-011, US-012, US-013, US-014, US-015,
US-020, US-021, US-022, US-030, US-031, US-032, US-040, US-041, US-042,
US-043, US-050, US-051.
