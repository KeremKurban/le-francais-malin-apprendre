# Evaluation Strategy — Le Français Malin

## Overview

Every user response is evaluated by Claude using a versioned prompt that returns a structured JSON object. The entire call is wrapped in an MLflow run for full reproducibility.

---

## Evaluation Dimensions

| Dimension | Description | Weight |
|-----------|-------------|--------|
| Grammar | Verb conjugation, tense agreement, gender/number agreement | 30% |
| Vocabulary | Word choice, register appropriateness, collocations | 25% |
| Communication | Message clarity, completeness, relevance to prompt | 25% |
| Spelling/Syntax | Spelling, punctuation, sentence structure | 20% |

The overall score (0–100) is computed by Claude based on all dimensions, calibrated to the target CEFR level.

---

## Score Interpretation

| Score | Meaning | Action |
|-------|---------|--------|
| 90–100 | Excellent for level | Propose harder variation |
| 70–89 | Good, minor errors | Propose reformulation or grammar focus |
| 50–69 | Acceptable, notable gaps | Propose retry + explanation |
| < 50 | Insufficient | Propose simpler variation + grammar focus |

---

## Error Taxonomy

| Type | Examples |
|------|---------|
| `grammar` | Wrong article, wrong preposition, incorrect agreement |
| `vocabulary` | Wrong word, false friend, register mismatch |
| `spelling` | Accent errors, double letters |
| `syntax` | Word order, missing clause elements |
| `register` | Too formal / too informal for context |
| `conjugation` | Wrong tense, wrong person, irregular form |

Severity levels: `minor` (stylistic), `moderate` (noticeable error), `major` (meaning impaired).

---

## Next-Step Logic

After each evaluation, Claude proposes 2–3 active next steps:

| Type | When proposed | User action |
|------|--------------|-------------|
| `reformulate` | Score 50–80 with fixable errors | User rewrites the same sentence |
| `retry` | Score < 60, multiple major errors | User retries the same prompt |
| `variation` | Score ≥ 70 | Same topic, different scenario |
| `mini_role_play` | Register or communication errors | Simulated dialogue |
| `grammar_focus` | Grammar/conjugation errors dominate | Targeted grammar drill |

---

## MLflow Experiment Schema

**Experiment name:** `francais-malin-evaluations`

### Tags (per run)
- `prompt_version`: e.g. `v1`
- `model`: e.g. `claude-sonnet-4-6`
- `eval_type`: `response_evaluation`

### Parameters (per run)
- `exam_type`: FIDE | DELF
- `level`: A1 | A2 | B1 | B2
- `exercise_type`: writing_prompt | role_play | etc.
- `attempt_number`: 1, 2, 3…

### Metrics (per run)
- `score`: 0–100
- `error_count`: total errors found
- `strengths_count`: number of strengths identified
- `latency_ms`: end-to-end API call time

### Artifacts (per run)
- `evaluation.json`: full Claude JSON response
- `request_params.json`: the input parameters

---

## Prompt Versioning Process

1. Create new prompt in `backend/app/prompts/`
2. Increment `PROMPT_VERSION` constant (e.g. `"v2"`)
3. Deploy and run evaluations
4. In MLflow UI: compare `score` distribution between `v1` and `v2` runs
5. If `v2` shows higher mean score and lower error variance, merge it
6. Old prompt versions remain in the file with a docstring comment

---

## FIDE-Specific Evaluation

For FIDE exercises, the evaluator is instructed to:
- Penalize register mismatches (too formal for informal situations and vice versa)
- Flag vocabulary inappropriate for Swiss administrative or professional contexts
- Award points for culturally appropriate formulations (e.g., using "vous" with officials)

## DELF-Specific Evaluation

For DELF exercises, calibration is level-strict:
- A1: Errors in basic vocabulary are `major`; complex grammar is not penalized
- B2: Register errors and argumentation structure are penalized more heavily
