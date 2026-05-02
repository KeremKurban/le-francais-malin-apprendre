"""Unit tests for service-layer helpers that don't need a DB or HTTP client."""
import json
import pytest

from app.services.exercise_service import _extract_json as ex_extract
from app.services.evaluation_service import _extract_json as ev_extract, _fallback_evaluation
from app.services.weakness_service import _compute_severity, _score_to_level


# ── _extract_json ─────────────────────────────────────────────────────────────

class TestExtractJson:
    def test_direct_json(self):
        payload = {"score": 80, "feedback": "Good"}
        assert ex_extract(json.dumps(payload)) == payload

    def test_fenced_json_block(self):
        payload = {"prompt": "Bonjour"}
        text = f"```json\n{json.dumps(payload)}\n```"
        assert ex_extract(text) == payload

    def test_fenced_no_lang(self):
        payload = {"prompt": "Bonjour"}
        text = f"```\n{json.dumps(payload)}\n```"
        assert ex_extract(text) == payload

    def test_json_buried_in_prose(self):
        payload = {"score": 75}
        text = f"Here is my evaluation:\n{json.dumps(payload)}\nHope it helps!"
        assert ex_extract(text) == payload

    def test_raises_on_no_json(self):
        with pytest.raises(ValueError, match="No valid JSON"):
            ex_extract("This has absolutely no JSON content at all.")

    def test_whitespace_stripped(self):
        payload = {"key": "value"}
        assert ex_extract(f"  {json.dumps(payload)}  ") == payload

    def test_evaluation_service_extractor_same_behaviour(self):
        payload = {"score": 90}
        assert ev_extract(json.dumps(payload)) == payload

    def test_truncated_json_salvaged(self):
        # Simulates model hitting max_tokens mid-object (arrays are complete, root braces missing)
        truncated = '{"score": 72, "overall_feedback": "Bien essayé.", "strengths": ["Bonne structure"], "improvements"'
        result = ev_extract(truncated)
        assert result["score"] == 72
        assert result["overall_feedback"] == "Bien essayé."
        assert result["strengths"] == ["Bonne structure"]

    def test_nested_json_in_fence_parsed_correctly(self):
        # Greedy match must capture full nested object, not stop at first }
        payload = {"score": 80, "errors": [{"error_type": "grammar"}]}
        text = f"```json\n{json.dumps(payload)}\n```"
        assert ev_extract(text) == payload


# ── _fallback_evaluation ──────────────────────────────────────────────────────

class TestFallbackEvaluation:
    def test_returns_valid_structure(self):
        result = _fallback_evaluation("Le modèle a répondu en prose.")
        assert "score" in result
        assert "overall_feedback" in result
        assert isinstance(result["errors"], list)
        assert isinstance(result["next_steps"], list)
        assert result["next_steps"][0]["type"] == "retry"

    def test_does_not_expose_raw_text(self):
        long_text = "x" * 1000
        result = _fallback_evaluation(long_text)
        # fallback must never forward raw model output to the user
        assert result["overall_feedback"] != long_text
        assert result["overall_feedback"] != long_text[:800]

    def test_empty_content(self):
        result = _fallback_evaluation("")
        assert result["overall_feedback"] == "Évaluation non disponible."


# ── weakness_service helpers ──────────────────────────────────────────────────

class TestComputeSeverity:
    def test_low(self):
        assert _compute_severity(1) == "low"
        assert _compute_severity(3) == "low"

    def test_medium(self):
        assert _compute_severity(4) == "medium"
        assert _compute_severity(7) == "medium"

    def test_high(self):
        assert _compute_severity(8) == "high"
        assert _compute_severity(100) == "high"


class TestScoreToLevel:
    def test_a1(self):
        assert _score_to_level(0) == "A1"
        assert _score_to_level(54) == "A1"

    def test_a2(self):
        assert _score_to_level(55) == "A2"
        assert _score_to_level(69) == "A2"

    def test_b1(self):
        assert _score_to_level(70) == "B1"
        assert _score_to_level(84) == "B1"

    def test_b2(self):
        assert _score_to_level(85) == "B2"
        assert _score_to_level(100) == "B2"
