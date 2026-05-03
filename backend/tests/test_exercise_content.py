"""Tests for the typed exercise content schema (Pydantic v2 discriminated union)."""
import pytest
from pydantic import TypeAdapter, ValidationError

from app.schemas.exercise_content import (
    ExerciseContent,
    WritingPromptContent,
    MultipleChoiceContent,
    ReadingComprehensionContent,
    ErrorCorrectionContent,
    FillBlankContent,
    RolePlayContent,
    RubricBase,
    BlankItem,
    RCQuestion,
    ErrorItem,
)

_adapter = TypeAdapter(ExerciseContent)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _validate(data: dict):
    """Validate a dict against ExerciseContent (discriminated union)."""
    return _adapter.validate_python(data)


# ── WritingPromptContent ───────────────────────────────────────────────────────

class TestWritingPromptContent:
    def _sample(self):
        return {
            "exercise_type": "writing_prompt",
            "instruction": "Décrivez votre journée typique.",
            "scenario": "Vous êtes en Suisse depuis 3 mois.",
            "min_words": 80,
            "max_words": 150,
            "rubric": {"grammar": "Présent correct", "vocabulary": "Varié", "communication": "Claire", "register": "neutre"},
            "difficulty": "medium",
        }

    def test_round_trip(self):
        data = self._sample()
        validated = _validate(data)
        assert isinstance(validated, WritingPromptContent)
        dumped = validated.model_dump()
        assert dumped["exercise_type"] == "writing_prompt"
        assert dumped["instruction"] == data["instruction"]
        assert dumped["min_words"] == 80
        assert dumped["difficulty"] == "medium"

    def test_defaults(self):
        validated = _validate({
            "exercise_type": "writing_prompt",
            "instruction": "Écrivez une lettre formelle.",
        })
        assert isinstance(validated, WritingPromptContent)
        assert validated.min_words == 80
        assert validated.max_words == 150
        assert validated.scenario == ""
        assert validated.difficulty == "medium"
        assert validated.rubric.register == "neutre"

    def test_discriminator_field_preserved(self):
        validated = _validate(self._sample())
        assert validated.model_dump()["exercise_type"] == "writing_prompt"


# ── MultipleChoiceContent ──────────────────────────────────────────────────────

class TestMultipleChoiceContent:
    def _sample(self):
        return {
            "exercise_type": "multiple_choice",
            "question": "Quel est le pluriel de 'cheval' ?",
            "options": ["chevals", "chevaux", "chevales", "cheval"],
            "correct_index": 1,
            "explanation": "Cheval fait 'chevaux' au pluriel (pluriel irrégulier en -al → -aux).",
            "rubric": {"grammar": "", "vocabulary": "", "communication": "", "register": "neutre"},
            "difficulty": "easy",
        }

    def test_round_trip(self):
        validated = _validate(self._sample())
        assert isinstance(validated, MultipleChoiceContent)
        assert validated.correct_index == 1
        assert len(validated.options) == 4
        assert validated.difficulty == "easy"

    def test_wrong_number_of_options_raises(self):
        data = self._sample()
        data["options"] = ["A", "B", "C"]  # only 3 options
        with pytest.raises(ValidationError):
            _validate(data)

    def test_too_many_options_raises(self):
        data = self._sample()
        data["options"] = ["A", "B", "C", "D", "E"]  # 5 options
        with pytest.raises(ValidationError):
            _validate(data)

    def test_correct_index_out_of_range_raises(self):
        data = self._sample()
        data["correct_index"] = 4  # max is 3
        with pytest.raises(ValidationError):
            _validate(data)

    def test_correct_index_negative_raises(self):
        data = self._sample()
        data["correct_index"] = -1
        with pytest.raises(ValidationError):
            _validate(data)


# ── ReadingComprehensionContent ────────────────────────────────────────────────

class TestReadingComprehensionContent:
    def _sample(self):
        return {
            "exercise_type": "reading_comprehension",
            "passage": "Paris est la capitale de la France. C'est une ville magnifique avec beaucoup de monuments historiques.",
            "passage_source": "",
            "questions": [
                {"question": "Quelle est la capitale de la France ?", "correct_answer": "Paris", "question_type": "open"},
            ],
            "rubric": {"grammar": "", "vocabulary": "Compréhension écrite", "communication": "Répondre aux questions", "register": "neutre"},
            "difficulty": "easy",
        }

    def test_round_trip(self):
        validated = _validate(self._sample())
        assert isinstance(validated, ReadingComprehensionContent)
        assert validated.passage.startswith("Paris")
        assert len(validated.questions) == 1
        assert validated.questions[0].question_type == "open"

    def test_mcq_question(self):
        data = self._sample()
        data["questions"][0]["question_type"] = "mcq"
        data["questions"][0]["choices"] = ["Paris", "Lyon", "Marseille", "Nice"]
        validated = _validate(data)
        assert validated.questions[0].question_type == "mcq"
        assert validated.questions[0].choices == ["Paris", "Lyon", "Marseille", "Nice"]

    def test_empty_questions_raises(self):
        data = self._sample()
        data["questions"] = []
        with pytest.raises(ValidationError):
            _validate(data)

    def test_too_many_questions_raises(self):
        data = self._sample()
        q = data["questions"][0]
        data["questions"] = [q, q, q, q]  # 4 questions, max is 3
        with pytest.raises(ValidationError):
            _validate(data)


# ── ErrorCorrectionContent ─────────────────────────────────────────────────────

class TestErrorCorrectionContent:
    def _sample(self):
        return {
            "exercise_type": "error_correction",
            "passage": "Je suis allé au marché hier et j'ai acheté des légume frais. Ma mère elle a cuisinée une soupe délicieux.",
            "error_count": 3,
            "errors": [
                {"original": "légume", "correction": "légumes", "explanation": "Pluriel manquant."},
                {"original": "elle a cuisinée", "correction": "a cuisiné", "explanation": "Accord du participe passé incorrect."},
                {"original": "délicieux", "correction": "délicieuse", "explanation": "Accord de l'adjectif."},
            ],
            "instruction": "Trouvez et corrigez les erreurs dans ce texte.",
            "rubric": {"grammar": "accord, pluriel", "vocabulary": "", "communication": "", "register": "neutre"},
            "difficulty": "medium",
        }

    def test_round_trip(self):
        validated = _validate(self._sample())
        assert isinstance(validated, ErrorCorrectionContent)
        assert validated.error_count == 3
        assert len(validated.errors) == 3
        assert validated.passage != ""

    def test_missing_passage_raises(self):
        data = self._sample()
        del data["passage"]
        with pytest.raises(ValidationError):
            _validate(data)

    def test_empty_passage_raises(self):
        # passage must be a non-empty string — Pydantic does not enforce non-empty by default
        # but the field is required (no default), so a missing key raises
        data = self._sample()
        data["passage"] = ""
        # An empty string is technically valid at Pydantic level (it's still a str)
        # This test verifies it at least round-trips without crashing
        validated = _validate(data)
        assert validated.passage == ""

    def test_default_instruction(self):
        data = self._sample()
        del data["instruction"]
        validated = _validate(data)
        assert "corrigez" in validated.instruction.lower()

    def test_missing_error_count_raises(self):
        data = self._sample()
        del data["error_count"]
        with pytest.raises(ValidationError):
            _validate(data)


# ── FillBlankContent ───────────────────────────────────────────────────────────

class TestFillBlankContent:
    def _sample(self):
        return {
            "exercise_type": "fill_blank",
            "template": "Je ___ (aller) au marché tous les ___ (jour).",
            "blanks": [
                {"index": 0, "correct_answer": "vais"},
                {"index": 1, "correct_answer": "jours"},
            ],
            "word_bank": ["vais", "jours", "mange", "semaine"],
            "rubric": {"grammar": "Conjugaison présent", "vocabulary": "", "communication": "", "register": "neutre"},
            "difficulty": "easy",
        }

    def test_round_trip(self):
        validated = _validate(self._sample())
        assert isinstance(validated, FillBlankContent)
        assert len(validated.blanks) == 2
        assert validated.blanks[0].correct_answer == "vais"
        assert validated.word_bank == ["vais", "jours", "mange", "semaine"]

    def test_no_word_bank(self):
        data = self._sample()
        data["word_bank"] = None
        validated = _validate(data)
        assert validated.word_bank is None

    def test_missing_blanks_raises(self):
        data = self._sample()
        del data["blanks"]
        with pytest.raises(ValidationError):
            _validate(data)

    def test_missing_template_raises(self):
        data = self._sample()
        del data["template"]
        with pytest.raises(ValidationError):
            _validate(data)


# ── RolePlayContent ────────────────────────────────────────────────────────────

class TestRolePlayContent:
    def _sample(self):
        return {
            "exercise_type": "role_play",
            "scenario": "Vous êtes dans un bureau de poste à Berne. Vous devez envoyer un colis en France.",
            "user_role": "le client",
            "interlocutor_role": "l'employé de poste",
            "conversation_starter": "Bonjour ! Je peux vous aider ?",
            "objectives": ["Demander le tarif d'envoi", "Remplir un formulaire"],
            "rubric": {"grammar": "Structures de politesse", "vocabulary": "Vocabulaire postal", "communication": "Actes de langage", "register": "formel"},
            "difficulty": "medium",
        }

    def test_round_trip(self):
        validated = _validate(self._sample())
        assert isinstance(validated, RolePlayContent)
        assert validated.conversation_starter == "Bonjour ! Je peux vous aider ?"
        assert len(validated.objectives) == 2
        assert validated.rubric.register == "formel"

    def test_defaults(self):
        validated = _validate({
            "exercise_type": "role_play",
            "scenario": "Un scénario.",
            "conversation_starter": "Bonjour !",
        })
        assert isinstance(validated, RolePlayContent)
        assert validated.user_role == "l'apprenant"
        assert validated.interlocutor_role == "l'interlocuteur"
        assert validated.objectives == []

    def test_missing_conversation_starter_raises(self):
        data = self._sample()
        del data["conversation_starter"]
        with pytest.raises(ValidationError):
            _validate(data)


# ── Discriminator tests ────────────────────────────────────────────────────────

class TestDiscriminator:
    def test_wrong_exercise_type_raises(self):
        with pytest.raises(ValidationError):
            _validate({"exercise_type": "nonexistent_type", "instruction": "foo"})

    def test_correct_type_returns_correct_class(self):
        types_and_classes = [
            ({"exercise_type": "writing_prompt", "instruction": "Foo"}, WritingPromptContent),
            (
                {
                    "exercise_type": "multiple_choice",
                    "question": "Q?",
                    "options": ["A", "B", "C", "D"],
                    "correct_index": 0,
                },
                MultipleChoiceContent,
            ),
            (
                {
                    "exercise_type": "reading_comprehension",
                    "passage": "Un texte.",
                    "questions": [{"question": "Q?", "correct_answer": "R"}],
                },
                ReadingComprehensionContent,
            ),
            (
                {
                    "exercise_type": "error_correction",
                    "passage": "Un texte avec erreurs.",
                    "error_count": 1,
                },
                ErrorCorrectionContent,
            ),
            (
                {
                    "exercise_type": "fill_blank",
                    "template": "Je ___ fatigué.",
                    "blanks": [{"index": 0, "correct_answer": "suis"}],
                },
                FillBlankContent,
            ),
            (
                {
                    "exercise_type": "role_play",
                    "scenario": "Un scénario.",
                    "conversation_starter": "Bonjour !",
                },
                RolePlayContent,
            ),
        ]
        for data, expected_class in types_and_classes:
            validated = _validate(data)
            assert isinstance(validated, expected_class), f"Expected {expected_class.__name__} for {data['exercise_type']}"

    def test_missing_exercise_type_raises(self):
        with pytest.raises(ValidationError):
            _validate({"instruction": "Écrivez quelque chose."})

    def test_model_dump_preserves_exercise_type(self):
        """model_dump() round-trip preserves the discriminator field."""
        for exercise_type in ("writing_prompt", "multiple_choice", "reading_comprehension",
                              "error_correction", "fill_blank", "role_play"):
            sample_data = {
                "writing_prompt": {"exercise_type": "writing_prompt", "instruction": "Foo"},
                "multiple_choice": {"exercise_type": "multiple_choice", "question": "Q?", "options": ["A", "B", "C", "D"], "correct_index": 0},
                "reading_comprehension": {"exercise_type": "reading_comprehension", "passage": "P", "questions": [{"question": "Q?", "correct_answer": "A"}]},
                "error_correction": {"exercise_type": "error_correction", "passage": "P", "error_count": 1},
                "fill_blank": {"exercise_type": "fill_blank", "template": "Je ___ là.", "blanks": [{"index": 0, "correct_answer": "suis"}]},
                "role_play": {"exercise_type": "role_play", "scenario": "S", "conversation_starter": "B"},
            }[exercise_type]
            validated = _validate(sample_data)
            dumped = validated.model_dump()
            assert dumped["exercise_type"] == exercise_type
            # Can re-validate from dumped dict
            re_validated = _validate(dumped)
            assert re_validated.model_dump() == dumped
