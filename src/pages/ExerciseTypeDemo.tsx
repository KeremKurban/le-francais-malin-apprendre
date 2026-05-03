/**
 * ExerciseTypeDemo — standalone preview page for the 4 new exercise types.
 * No route registration needed; import it locally and render to test.
 *
 * Usage (temporary, add to App.tsx or any dev route):
 *   import ExerciseTypeDemo from '@/pages/ExerciseTypeDemo';
 *   <Route path="/demo/exercises" element={<ExerciseTypeDemo />} />
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SentenceScramble from '@/components/exercises/types/SentenceScramble';
import ErrorCorrection from '@/components/exercises/types/ErrorCorrection';
import ConjugationDrill from '@/components/exercises/types/ConjugationDrill';
import ListenAndType from '@/components/exercises/types/ListenAndType';

// ── Sample data ─────────────────────────────────────────────────────────────

const SCRAMBLE_SENTENCE = 'Je vais au marché chaque matin';

const ERROR_CORRECTION = {
  incorrectSentence: 'Elle a mangé un pomme.',
  correctSentence: 'Elle a mangé une pomme.',
  explanation: "'Pomme' is feminine — use the feminine article 'une', not 'un'.",
};

const CONJUGATION = {
  verb: 'avoir',
  tense: 'présent',
  conjugations: {
    je: 'ai',
    tu: 'as',
    il: 'a',
    nous: 'avons',
    vous: 'avez',
    ils: 'ont',
  },
};

const DICTATION_SENTENCE = 'Le chat dort sur le canapé.';

// ── Result display helpers ───────────────────────────────────────────────────

interface ResultBadgeProps {
  label: string;
}

function ResultBadge({ label }: ResultBadgeProps) {
  return (
    <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-mono text-xs">
      {label}
    </Badge>
  );
}

// ── Demo page ────────────────────────────────────────────────────────────────

export default function ExerciseTypeDemo() {
  const [scrambleResult, setScrambleResult] = useState<string | null>(null);
  const [errorResult, setErrorResult] = useState<boolean | null>(null);
  const [conjugationScore, setConjugationScore] = useState<number | null>(null);
  const [dictationResult, setDictationResult] = useState<{ correct: boolean; input: string } | null>(null);

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8 px-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">
          Exercise Types — Demo
        </h1>
        <p className="text-gray-500 text-sm">
          Preview of all 4 new interactive exercise components.
        </p>
      </div>

      {/* 1. Sentence Scramble */}
      <Card className="shadow-sm border-blue-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800">
              1 · Sentence Scramble
            </CardTitle>
            {scrambleResult !== null && (
              <ResultBadge label={`onComplete → "${scrambleResult}"`} />
            )}
          </div>
          <p className="text-xs text-gray-500">
            Rearrange shuffled word tiles to form the correct sentence.
          </p>
        </CardHeader>
        <CardContent>
          <SentenceScramble
            sentence={SCRAMBLE_SENTENCE}
            hint="I go to the market every morning"
            onComplete={(correct, userAnswer) =>
              setScrambleResult(`correct=${correct} | answer="${userAnswer}"`)
            }
          />
        </CardContent>
      </Card>

      {/* 2. Error Correction */}
      <Card className="shadow-sm border-amber-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800">
              2 · Error Correction
            </CardTitle>
            {errorResult !== null && (
              <ResultBadge label={`correct=${errorResult}`} />
            )}
          </div>
          <p className="text-xs text-gray-500">
            Spot and correct the grammatical mistake in the sentence.
          </p>
        </CardHeader>
        <CardContent>
          <ErrorCorrection
            incorrectSentence={ERROR_CORRECTION.incorrectSentence}
            correctSentence={ERROR_CORRECTION.correctSentence}
            explanation={ERROR_CORRECTION.explanation}
            onComplete={correct => setErrorResult(correct)}
          />
        </CardContent>
      </Card>

      {/* 3. Conjugation Drill */}
      <Card className="shadow-sm border-purple-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800">
              3 · Conjugation Drill
            </CardTitle>
            {conjugationScore !== null && (
              <ResultBadge label={`score=${conjugationScore}/6`} />
            )}
          </div>
          <p className="text-xs text-gray-500">
            Fill in the full conjugation table for the given verb and tense.
          </p>
        </CardHeader>
        <CardContent>
          <ConjugationDrill
            verb={CONJUGATION.verb}
            tense={CONJUGATION.tense}
            conjugations={CONJUGATION.conjugations}
            onComplete={score => setConjugationScore(score)}
          />
        </CardContent>
      </Card>

      {/* 4. Listen and Type */}
      <Card className="shadow-sm border-green-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800">
              4 · Listen &amp; Type
            </CardTitle>
            {dictationResult !== null && (
              <ResultBadge
                label={`correct=${dictationResult.correct} | "${dictationResult.input}"`}
              />
            )}
          </div>
          <p className="text-xs text-gray-500">
            Listen to the spoken French sentence and type what you hear.
          </p>
        </CardHeader>
        <CardContent>
          <ListenAndType
            sentence={DICTATION_SENTENCE}
            onComplete={(correct, userInput) =>
              setDictationResult({ correct, input: userInput })
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
