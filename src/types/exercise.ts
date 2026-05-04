export interface RubricBase {
  grammar: string;
  vocabulary: string;
  communication: string;
  register: string;
}

export interface BlankItem { index: number; correct_answer: string; }
export interface RCQuestion { question: string; correct_answer: string; question_type: 'open' | 'mcq'; choices?: string[]; }
export interface ErrorItem { original: string; correction: string; explanation: string; }

export interface WritingPromptContent { exercise_type: 'writing_prompt'; instruction: string; scenario: string; min_words: number; max_words: number; rubric: RubricBase; difficulty: 'easy' | 'medium' | 'hard'; }
export interface MultipleChoiceContent { exercise_type: 'multiple_choice'; question: string; options: [string, string, string, string]; correct_index: number; explanation: string; rubric: RubricBase; difficulty: 'easy' | 'medium' | 'hard'; }
export interface ReadingComprehensionContent { exercise_type: 'reading_comprehension'; passage: string; passage_source: string; questions: RCQuestion[]; rubric: RubricBase; difficulty: 'easy' | 'medium' | 'hard'; }
export interface ErrorCorrectionContent { exercise_type: 'error_correction'; passage: string; error_count: number; errors: ErrorItem[]; instruction: string; rubric: RubricBase; difficulty: 'easy' | 'medium' | 'hard'; }
export interface FillBlankContent { exercise_type: 'fill_blank'; template: string; blanks: BlankItem[]; word_bank: string[] | null; rubric: RubricBase; difficulty: 'easy' | 'medium' | 'hard'; }
export interface RolePlayContent { exercise_type: 'role_play'; scenario: string; user_role: string; interlocutor_role: string; conversation_starter: string; objectives: string[]; rubric: RubricBase; difficulty: 'easy' | 'medium' | 'hard'; }

export type ExerciseContent = WritingPromptContent | MultipleChoiceContent | ReadingComprehensionContent | ErrorCorrectionContent | FillBlankContent | RolePlayContent;
