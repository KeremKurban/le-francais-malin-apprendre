"""
MLflow tracking service.
All AI evaluation calls go through here so every run is logged centrally.
"""
import json
import time
from contextlib import contextmanager
from typing import Any, Dict, Optional

import mlflow

from app.core.config import get_settings

settings = get_settings()


class MLflowService:
    def __init__(self):
        mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
        mlflow.set_experiment(settings.mlflow_experiment_name)

    @contextmanager
    def start_eval_run(
        self,
        run_name: str,
        prompt_version: str,
        model_name: str,
        eval_type: str,
        params: Optional[Dict[str, Any]] = None,
    ):
        """Context manager that wraps an evaluation call with MLflow tracking."""
        with mlflow.start_run(run_name=run_name) as run:
            mlflow.set_tags(
                {
                    "prompt_version": prompt_version,
                    "model": model_name,
                    "eval_type": eval_type,
                }
            )
            if params:
                mlflow.log_params(params)

            start_time = time.perf_counter()
            result_holder: Dict[str, Any] = {}

            yield result_holder, run.info.run_id

            latency_ms = (time.perf_counter() - start_time) * 1000
            mlflow.log_metric("latency_ms", latency_ms)

            if result_holder.get("metrics"):
                mlflow.log_metrics(result_holder["metrics"])

            if result_holder.get("artifacts"):
                for name, content in result_holder["artifacts"].items():
                    mlflow.log_text(json.dumps(content, ensure_ascii=False, indent=2), f"{name}.json")

    def log_evaluation_metrics(
        self,
        run_id: str,
        score: float,
        error_counts: Dict[str, int],
        response_length: int,
    ) -> None:
        with mlflow.start_run(run_id=run_id):
            mlflow.log_metrics(
                {
                    "score": score,
                    "error_count_total": sum(error_counts.values()),
                    "response_length_chars": response_length,
                    **{f"errors_{k}": v for k, v in error_counts.items()},
                }
            )


mlflow_service = MLflowService()
