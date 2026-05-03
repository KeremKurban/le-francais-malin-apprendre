import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  ExerciseContent,
  WritingPromptContent,
  MultipleChoiceContent,
  ReadingComprehensionContent,
  ErrorCorrectionContent,
  FillBlankContent,
  RolePlayContent,
} from '@/types/exercise';

// ── Shared props ──────────────────────────────────────────────────────────────

interface BaseRendererProps {
  onAnswerChange: (answer: string) => void;
  answer: string;
  showResult?: boolean;
}

// ── WritingPromptRenderer ─────────────────────────────────────────────────────

function WritingPromptRenderer({
  content,
  onAnswerChange,
  answer,
}: BaseRendererProps & { content: WritingPromptContent }) {
  return (
    <div className="space-y-4">
      <p className="text-gray-900 font-medium leading-relaxed">{content.instruction}</p>
      {content.scenario && (
        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 leading-relaxed">
          {content.scenario}
        </div>
      )}
      <p className="text-xs text-gray-500">
        Entre {content.min_words} et {content.max_words} mots
      </p>
      <Textarea
        value={answer}
        onChange={e => onAnswerChange(e.target.value)}
        placeholder="Écrivez votre réponse ici…"
        className="min-h-[140px] resize-none text-base"
      />
      <p className="text-xs text-gray-400 text-right">
        {answer.trim() ? answer.trim().split(/\s+/).length : 0} mots
      </p>
    </div>
  );
}

// ── MultipleChoiceRenderer ────────────────────────────────────────────────────

function MultipleChoiceRenderer({
  content,
  onAnswerChange,
  answer,
  showResult,
}: BaseRendererProps & { content: MultipleChoiceContent }) {
  const selectedIndex = answer !== '' ? parseInt(answer, 10) : -1;

  const handleSelect = (idx: number) => {
    if (!showResult) onAnswerChange(String(idx));
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-900 font-medium leading-relaxed">{content.question}</p>
      <div className="space-y-3">
        {content.options.map((option, idx) => {
          let cls = 'w-full text-left px-4 py-3 rounded-lg border-2 transition-colors font-normal';
          if (showResult) {
            if (idx === content.correct_index) cls += ' border-green-500 bg-green-50 text-green-800';
            else if (idx === selectedIndex) cls += ' border-red-400 bg-red-50 text-red-700';
            else cls += ' border-gray-200 bg-white text-gray-700';
          } else if (idx === selectedIndex) {
            cls += ' border-blue-500 bg-blue-50 text-blue-800';
          } else {
            cls += ' border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50';
          }
          return (
            <button key={idx} className={cls} onClick={() => handleSelect(idx)}>
              <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
              {option}
            </button>
          );
        })}
      </div>
      {showResult && content.explanation && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          {content.explanation}
        </div>
      )}
    </div>
  );
}

// ── ReadingComprehensionRenderer ──────────────────────────────────────────────

function ReadingComprehensionRenderer({
  content,
  onAnswerChange,
  answer,
}: BaseRendererProps & { content: ReadingComprehensionContent }) {
  // answers are stored as JSON array of strings
  const answers: string[] = (() => {
    try { return JSON.parse(answer) as string[]; } catch { return content.questions.map(() => ''); }
  })();

  const updateAnswer = (idx: number, val: string) => {
    const updated = [...answers];
    updated[idx] = val;
    onAnswerChange(JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
        {content.passage}
      </div>
      {content.passage_source && (
        <p className="text-xs text-gray-400 italic">Source : {content.passage_source}</p>
      )}
      <div className="space-y-4">
        {content.questions.map((q, idx) => (
          <div key={idx} className="space-y-2">
            <p className="text-sm font-medium text-gray-800">{idx + 1}. {q.question}</p>
            {q.question_type === 'mcq' && q.choices ? (
              <div className="space-y-2">
                {q.choices.map((choice, ci) => (
                  <button
                    key={ci}
                    className={`w-full text-left px-3 py-2 rounded border text-sm transition-colors ${answers[idx] === choice ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                    onClick={() => updateAnswer(idx, choice)}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            ) : (
              <Textarea
                value={answers[idx] ?? ''}
                onChange={e => updateAnswer(idx, e.target.value)}
                placeholder="Votre réponse…"
                className="min-h-[80px] resize-none text-sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ErrorCorrectionRenderer ───────────────────────────────────────────────────

function ErrorCorrectionRenderer({
  content,
  onAnswerChange,
  answer,
}: BaseRendererProps & { content: ErrorCorrectionContent }) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">{content.instruction}</p>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-gray-900 leading-relaxed whitespace-pre-wrap">
        {content.passage}
      </div>
      <p className="text-xs text-gray-500">
        Ce texte contient {content.error_count} erreur{content.error_count > 1 ? 's' : ''} à corriger.
      </p>
      <Textarea
        value={answer}
        onChange={e => onAnswerChange(e.target.value)}
        placeholder="Réécrivez le texte corrigé ici…"
        className="min-h-[120px] resize-none text-sm"
      />
    </div>
  );
}

// ── FillBlankRenderer ─────────────────────────────────────────────────────────

function FillBlankRenderer({
  content,
  onAnswerChange,
  answer,
}: BaseRendererProps & { content: FillBlankContent }) {
  // answers stored as JSON array
  const answers: string[] = (() => {
    try { return JSON.parse(answer) as string[]; } catch { return content.blanks.map(() => ''); }
  })();

  const updateBlank = (idx: number, val: string) => {
    const updated = [...answers];
    updated[idx] = val;
    onAnswerChange(JSON.stringify(updated));
  };

  // Split template on ___ and interleave with inputs
  const parts = content.template.split('___');

  return (
    <div className="space-y-4">
      <div className="leading-loose text-gray-900">
        {parts.map((part, idx) => (
          <span key={idx}>
            {part}
            {idx < parts.length - 1 && (
              <input
                type="text"
                value={answers[idx] ?? ''}
                onChange={e => updateBlank(idx, e.target.value)}
                className="inline-block border-b-2 border-blue-400 bg-transparent text-center text-blue-800 font-medium mx-1 focus:outline-none focus:border-blue-600"
                style={{ width: '120px' }}
                placeholder="___"
              />
            )}
          </span>
        ))}
      </div>
      {content.word_bank && content.word_bank.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">Banque de mots :</p>
          <div className="flex flex-wrap gap-2">
            {content.word_bank.map((word, idx) => (
              <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── RolePlayRenderer ──────────────────────────────────────────────────────────

function RolePlayRenderer({
  content,
  onAnswerChange,
  answer,
}: BaseRendererProps & { content: RolePlayContent }) {
  return (
    <div className="space-y-4">
      <div className="bg-purple-50 rounded-lg p-4 text-sm text-purple-800 leading-relaxed">
        <p className="font-semibold mb-1">Scénario</p>
        <p>{content.scenario}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="font-medium text-blue-700">Votre rôle</p>
          <p className="text-blue-900">{content.user_role}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <p className="font-medium text-green-700">Interlocuteur</p>
          <p className="text-green-900">{content.interlocutor_role}</p>
        </div>
      </div>
      {content.objectives.length > 0 && (
        <div className="text-sm text-gray-600">
          <p className="font-medium mb-1">Objectifs :</p>
          <ul className="list-disc list-inside space-y-1">
            {content.objectives.map((obj, idx) => (
              <li key={idx}>{obj}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-800 border-l-4 border-green-400">
        <p className="font-medium text-gray-500 text-xs mb-1">{content.interlocutor_role} dit :</p>
        <p className="italic">"{content.conversation_starter}"</p>
      </div>
      <Textarea
        value={answer}
        onChange={e => onAnswerChange(e.target.value)}
        placeholder="Votre réplique…"
        className="min-h-[100px] resize-none text-base"
      />
    </div>
  );
}

// ── Fallback renderer ─────────────────────────────────────────────────────────

function FallbackRenderer({
  content,
  onAnswerChange,
  answer,
}: BaseRendererProps & { content: ExerciseContent }) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
        <pre className="whitespace-pre-wrap text-xs overflow-auto">{JSON.stringify(content, null, 2)}</pre>
      </div>
      <Textarea
        value={answer}
        onChange={e => onAnswerChange(e.target.value)}
        placeholder="Votre réponse…"
        className="min-h-[120px] resize-none"
      />
    </div>
  );
}

// ── ExerciseRenderer (dispatcher) ─────────────────────────────────────────────

export interface ExerciseRendererProps {
  content: ExerciseContent;
  onAnswerChange: (answer: string) => void;
  answer: string;
  showResult?: boolean;
}

export default function ExerciseRenderer({ content, onAnswerChange, answer, showResult }: ExerciseRendererProps) {
  switch (content.exercise_type) {
    case 'writing_prompt':
      return (
        <WritingPromptRenderer
          content={content as WritingPromptContent}
          onAnswerChange={onAnswerChange}
          answer={answer}
          showResult={showResult}
        />
      );
    case 'multiple_choice':
      return (
        <MultipleChoiceRenderer
          content={content as MultipleChoiceContent}
          onAnswerChange={onAnswerChange}
          answer={answer}
          showResult={showResult}
        />
      );
    case 'reading_comprehension':
      return (
        <ReadingComprehensionRenderer
          content={content as ReadingComprehensionContent}
          onAnswerChange={onAnswerChange}
          answer={answer}
          showResult={showResult}
        />
      );
    case 'error_correction':
      return (
        <ErrorCorrectionRenderer
          content={content as ErrorCorrectionContent}
          onAnswerChange={onAnswerChange}
          answer={answer}
          showResult={showResult}
        />
      );
    case 'fill_blank':
      return (
        <FillBlankRenderer
          content={content as FillBlankContent}
          onAnswerChange={onAnswerChange}
          answer={answer}
          showResult={showResult}
        />
      );
    case 'role_play':
      return (
        <RolePlayRenderer
          content={content as RolePlayContent}
          onAnswerChange={onAnswerChange}
          answer={answer}
          showResult={showResult}
        />
      );
    default:
      return (
        <FallbackRenderer
          content={content}
          onAnswerChange={onAnswerChange}
          answer={answer}
          showResult={showResult}
        />
      );
  }
}
