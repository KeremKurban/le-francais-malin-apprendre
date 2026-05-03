// Typed fixture objects matching the Exercise and EvaluationResponse shapes from backendClient.ts

export const WRITING_PROMPT_EXERCISE = {
  id: 'exercise-writing-1',
  topic_id: 'topic-delf-1',
  level: 'B1',
  exam_type: 'DELF',
  exercise_type: 'writing_prompt',
  mode: 'writing',
  prompt: 'Décrivez votre routine matinale en 5 phrases.',
  context: 'Vie quotidienne en Suisse',
  rubric: { grammar: 'Présent correct', vocabulary: 'Varié' },
  prompt_version: 'test-v1',
  difficulty: 'medium',
  content: {
    exercise_type: 'writing_prompt',
    instruction: 'Décrivez votre routine matinale en 5 phrases.',
    scenario: 'Vie quotidienne en Suisse',
    min_words: 40,
    max_words: 100,
    rubric: { grammar: 'Présent correct', vocabulary: 'Varié', communication: 'Clair', register: 'informel' },
    difficulty: 'medium',
  },
};

export const ERROR_CORRECTION_EXERCISE = {
  id: 'exercise-error-1',
  topic_id: 'topic-delf-1',
  level: 'B1',
  exam_type: 'DELF',
  exercise_type: 'error_correction',
  mode: 'writing',
  prompt: 'Trouvez et corrigez les erreurs dans ce texte.',
  context: 'Grammaire',
  rubric: { grammar: 'Accord correct' },
  prompt_version: 'test-v1',
  difficulty: 'medium',
  content: {
    exercise_type: 'error_correction',
    passage: 'Hier, je suis allé au marché avec ma amie Sophie. Elle a acheté des légumes frais et moi j\'ai pris du pain et du fromages.',
    error_count: 3,
    instruction: 'Trouvez et corrigez les erreurs dans ce texte.',
    errors: [
      { original: 'ma amie', correction: 'mon amie', explanation: 'amie commence par une voyelle' },
      { original: 'fromages', correction: 'fromage', explanation: 'indéfini singulier après du' },
    ],
    rubric: { grammar: 'Accord correct', vocabulary: '', communication: '', register: 'neutre' },
    difficulty: 'medium',
  },
};

export const MULTIPLE_CHOICE_EXERCISE = {
  id: 'exercise-mcq-1',
  topic_id: 'topic-delf-1',
  level: 'A2',
  exam_type: 'DELF',
  exercise_type: 'multiple_choice',
  mode: 'writing',
  prompt: 'Quelle phrase est correcte ?',
  context: 'Grammaire',
  rubric: {},
  prompt_version: 'test-v1',
  difficulty: 'easy',
  content: {
    exercise_type: 'multiple_choice',
    question: 'Quelle phrase est grammaticalement correcte ?',
    options: [
      'Je suis allé au marché hier.',
      'Je sommes allé au marché hier.',
      'Je suis aller au marché hier.',
      'Je suis allé à le marché hier.',
    ],
    correct_index: 0,
    explanation: 'La première option utilise correctement le passé composé.',
    rubric: { grammar: 'Passé composé', vocabulary: '', communication: '', register: 'neutre' },
    difficulty: 'easy',
  },
};

export const FILL_BLANK_EXERCISE = {
  id: 'exercise-fill-1',
  topic_id: 'topic-delf-1',
  level: 'A2',
  exam_type: 'DELF',
  exercise_type: 'fill_blank',
  mode: 'writing',
  prompt: 'Complétez les blancs avec la forme correcte.',
  context: 'Conjugaison',
  rubric: {},
  prompt_version: 'test-v1',
  difficulty: 'easy',
  content: {
    exercise_type: 'fill_blank',
    template: 'Je ___ au marché hier. Elle ___ des légumes.',
    blanks: [
      { index: 0, correct_answer: 'suis allé' },
      { index: 1, correct_answer: 'a acheté' },
    ],
    word_bank: ['suis allé', 'a acheté', 'vais', 'achète'],
    rubric: { grammar: 'Passé composé', vocabulary: '', communication: '', register: 'neutre' },
    difficulty: 'easy',
  },
};

export const EVALUATION_RESPONSE = {
  evaluation: {
    response_id: 'eval-fixture-1',
    score: 72,
    overall_feedback: 'Bonne tentative avec quelques erreurs.',
    strengths: ['Structure claire', 'Vocabulaire adapté'],
    improvements: ['Accord des participes', 'Usage du subjonctif'],
    errors: [
      {
        error_type: 'grammar',
        severity: 'moderate',
        original_text: 'je suis allé',
        correction: 'je suis allée',
        explanation: 'Accord avec le sujet féminin.',
      },
    ],
    next_steps: [
      { type: 'retry', description: 'Réessayez avec les corrections.', exercise_hint: null },
    ],
    mlflow_run_id: null,
  },
  weaknesses_updated: false,
  skill_levels_updated: true,
};

export const EVALUATION_WITH_MARKDOWN = {
  ...EVALUATION_RESPONSE,
  evaluation: {
    ...EVALUATION_RESPONSE.evaluation,
    overall_feedback: '**Excellent travail.** Vous avez utilisé le **passé composé** correctement.',
  },
};
