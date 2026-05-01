"""
MLflow tracking service.
All AI evaluation calls go through here so every run is logged centrally.
MLflow failures are non-fatal — the app continues without tracking.
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
        try:
            mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
            mlflow.set_experiment(settings.mlflow_experiment_name)
        except Exception as exc:
            print(f"[mlflow] init warning (non-fatal): {exc}")

    @contextmanager
    def start_eval_run(
        self,
        run_name: str,
        prompt_version: str,
        model_name: str,
        eval_type: str,
        params: Optional[Dict[str, Any]] = None,
    ):
        """Context manager that wraps an evaluation call with MLflow tracking.
        If MLflow is unavailable the body still executes and a sentinel run_id is returned."""
        result_holder: Dict[str, Any] = {}
        run_id = "no-mlflow-run"
        mlflow_run = None
        start_time = time.perf_counter()

        try:
            mlflow_run = mlflow.start_run(run_name=run_name)
            ctx = mlflow_run.__enter__()
            run_id = ctx.info.run_id
            mlflow.set_tags({"prompt_version": prompt_version, "model": model_name, "eval_type": eval_type})
            if params:
                mlflow.log_params(params)
        except Exception as exc:
            print(f"[mlflow] start_run warning (non-fatal): {exc}")
            mlflow_run = None

        try:
            yield result_holder, run_id
        finally:
            latency_ms = (time.perf_counter() - start_time) * 1000
            if mlflow_run is not None:
                try:
                    mlflow.log_metric("latency_ms", latency_ms)
                    if result_holder.get("metrics"):
                        mlflow.log_metrics(result_holder["metrics"])
                    if result_holder.get("artifacts"):
                        for name, content in result_holder["artifacts"].items():
                            mlflow.log_text(
                                json.dumps(content, ensure_ascii=False, indent=2),
                                f"{name}.json",
                            )
                    mlflow_run.__exit__(None, None, None)
                except Exception as exc:
                    print(f"[mlflow] log warning (non-fatal): {exc}")

    def log_evaluation_metrics(
        self,
        run_id: str,
        score: float,
        error_counts: Dict[str, int],
        response_length: int,
    ) -> None:
        try:
            with mlflow.start_run(run_id=run_id):
                mlflow.log_metrics(
                    {
                        "score": score,
                        "error_count_total": sum(error_counts.values()),
                        "response_length_chars": response_length,
                        **{f"errors_{k}": v for k, v in error_counts.items()},
                    }
                )
        except Exception as exc:
            print(f"[mlflow] log_evaluation_metrics warning (non-fatal): {exc}")


mlflow_service = MLflowService()
