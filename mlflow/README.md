# MLflow — Experiment Tracking

## Overview

MLflow is used to track every AI evaluation call, making it easy to:
- Compare evaluation quality across prompt versions
- Monitor score distribution per exam type and level
- Measure API latency percentiles
- Audit which model version was used for which evaluation

## Accessing the UI

```
http://localhost:5001
```

(Runs in the `mlflow` docker-compose service on port 5001, mapped from internal port 5000)

## Experiment Structure

**Experiment name:** `francais-malin-evaluations` (configurable via `MLFLOW_EXPERIMENT_NAME`)

Each evaluation call = 1 MLflow run.

### Viewing runs

1. Open http://localhost:5001
2. Click on `francais-malin-evaluations`
3. Filter by tag: `prompt_version = v1` to see only v1 runs
4. Sort by `score` to find the best and worst evaluations
5. Click a run to see the full `evaluation.json` artifact

### Comparing prompt versions

```
1. Run experiments with v1 prompt
2. Update PROMPT_VERSION in evaluation_prompts.py to "v2"
3. Run more experiments
4. In MLflow UI: "Compare" tab → select all runs → plot score by prompt_version
```

## Storage

- **Dev:** SQLite file at `/mlflow/mlflow.db` (inside the container, persisted as a Docker volume)
- **Prod:** Replace with PostgreSQL backend + S3 artifact store in docker-compose

```yaml
# Production MLflow config
command: >
  mlflow server
  --backend-store-uri postgresql://user:pass@db:5432/mlflow
  --default-artifact-root s3://your-bucket/mlflow
  --host 0.0.0.0
```

## Programmatic Access

From any Python script:

```python
import mlflow

mlflow.set_tracking_uri("http://localhost:5001")
mlflow.set_experiment("francais-malin-evaluations")

runs = mlflow.search_runs(
    experiment_names=["francais-malin-evaluations"],
    filter_string="tags.prompt_version = 'v1'",
    order_by=["metrics.score DESC"],
)
print(runs[["tags.exam_type", "tags.level", "metrics.score", "metrics.latency_ms"]])
```
