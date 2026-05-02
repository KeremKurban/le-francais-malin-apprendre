"""
Utility script to compare evaluation quality across prompt versions in MLflow.

Usage:
    python mlflow/experiments/compare_prompts.py --v1 v1 --v2 v2
"""
import argparse
import mlflow
import pandas as pd


def compare_prompt_versions(v1: str, v2: str, tracking_uri: str = "http://localhost:5001"):
    mlflow.set_tracking_uri(tracking_uri)

    runs_v1 = mlflow.search_runs(
        experiment_names=["francais-malin-evaluations"],
        filter_string=f"tags.prompt_version = '{v1}'",
    )
    runs_v2 = mlflow.search_runs(
        experiment_names=["francais-malin-evaluations"],
        filter_string=f"tags.prompt_version = '{v2}'",
    )

    if runs_v1.empty and runs_v2.empty:
        print("No runs found for either version.")
        return

    metrics = ["metrics.score", "metrics.error_count", "metrics.latency_ms"]

    print(f"\n{'='*60}")
    print(f"Prompt version comparison: {v1} vs {v2}")
    print(f"{'='*60}")

    for metric in metrics:
        if metric in runs_v1.columns and metric in runs_v2.columns:
            m1 = runs_v1[metric].dropna()
            m2 = runs_v2[metric].dropna()
            print(f"\n{metric.replace('metrics.', '')}:")
            print(f"  {v1}: n={len(m1)}, mean={m1.mean():.2f}, std={m1.std():.2f}, p50={m1.median():.2f}")
            print(f"  {v2}: n={len(m2)}, mean={m2.mean():.2f}, std={m2.std():.2f}, p50={m2.median():.2f}")

    print(f"\n{'='*60}")
    print("Recommendation: prefer the version with higher mean score")
    print("and lower std (more consistent evaluations).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--v1", default="v1")
    parser.add_argument("--v2", default="v2")
    parser.add_argument("--uri", default="http://localhost:5001")
    args = parser.parse_args()
    compare_prompt_versions(args.v1, args.v2, args.uri)
