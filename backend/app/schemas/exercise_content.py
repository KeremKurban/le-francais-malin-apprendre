from __future__ import annotations
from typing import Annotated, Literal, Union
from pydantic import BaseModel, Field


class RubricBase(BaseModel):
    grammar: str = ""
    vocabulary: str = ""
    communication: str = ""
    register: str = "neutre"


class BlankItem(BaseModel):
    index: int
    correct_answer: str


class RCQuestion(BaseModel):
    question: str
    correct_answer: str
    question_type: Literal["open", "mcq"] = "open"
    choices: list[str] | None = None


class ErrorItem(BaseModel):
    original: str
    correction: str
    explanation: str


class WritingPromptContent(BaseModel):
    exercise_type: Literal["writing_prompt"]
    instruction: str
    scenario: str = ""
    min_words: int = 80
    max_words: int = 150
    rubric: RubricBase = Field(default_factory=RubricBase)
    difficulty: Literal["easy", "medium", "hard"] = "medium"


class MultipleChoiceContent(BaseModel):
    exercise_type: Literal["multiple_choice"]
    question: str
    options: list[str] = Field(min_length=4, max_length=4)
    correct_index: int = Field(ge=0, le=3)
    explanation: str = ""
    rubric: RubricBase = Field(default_factory=RubricBase)
    difficulty: Literal["easy", "medium", "hard"] = "medium"


class ReadingComprehensionContent(BaseModel):
    exercise_type: Literal["reading_comprehension"]
    passage: str
    passage_source: str = ""
    questions: list[RCQuestion] = Field(min_length=1, max_length=3)
    rubric: RubricBase = Field(default_factory=RubricBase)
    difficulty: Literal["easy", "medium", "hard"] = "medium"


class ErrorCorrectionContent(BaseModel):
    exercise_type: Literal["error_correction"]
    passage: str
    error_count: int
    errors: list[ErrorItem] = Field(default_factory=list)
    instruction: str = "Trouvez et corrigez les erreurs dans ce texte."
    rubric: RubricBase = Field(default_factory=RubricBase)
    difficulty: Literal["easy", "medium", "hard"] = "medium"


class FillBlankContent(BaseModel):
    exercise_type: Literal["fill_blank"]
    template: str
    blanks: list[BlankItem]
    word_bank: list[str] | None = None
    rubric: RubricBase = Field(default_factory=RubricBase)
    difficulty: Literal["easy", "medium", "hard"] = "medium"


class RolePlayContent(BaseModel):
    exercise_type: Literal["role_play"]
    scenario: str
    user_role: str = "l'apprenant"
    interlocutor_role: str = "l'interlocuteur"
    conversation_starter: str
    objectives: list[str] = Field(default_factory=list)
    rubric: RubricBase = Field(default_factory=RubricBase)
    difficulty: Literal["easy", "medium", "hard"] = "medium"


ExerciseContent = Annotated[
    Union[
        WritingPromptContent,
        MultipleChoiceContent,
        ReadingComprehensionContent,
        ErrorCorrectionContent,
        FillBlankContent,
        RolePlayContent,
    ],
    Field(discriminator="exercise_type"),
]
