import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, RotateCcw } from 'lucide-react';

export interface SentenceScrambleProps {
  sentence: string;
  hint?: string;
  onComplete: (correct: boolean, userAnswer: string) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:«»"'()-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function SentenceScramble({ sentence, hint, onComplete }: SentenceScrambleProps) {
  const words = sentence.split(' ');

  const [pool, setPool] = useState<string[]>(() => shuffleArray(words));
  const [answer, setAnswer] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Re-shuffle when sentence changes
  useEffect(() => {
    setPool(shuffleArray(sentence.split(' ')));
    setAnswer([]);
    setChecked(false);
    setIsCorrect(false);
  }, [sentence]);

  const moveToAnswer = (wordIndex: number) => {
    if (checked) return;
    const word = pool[wordIndex];
    setPool(prev => prev.filter((_, i) => i !== wordIndex));
    setAnswer(prev => [...prev, word]);
  };

  const moveToPool = (wordIndex: number) => {
    if (checked) return;
    const word = answer[wordIndex];
    setAnswer(prev => prev.filter((_, i) => i !== wordIndex));
    setPool(prev => [...prev, word]);
  };

  const handleCheck = () => {
    const userAnswer = answer.join(' ');
    const correct =
      normalizeForComparison(userAnswer) === normalizeForComparison(sentence);
    setIsCorrect(correct);
    setChecked(true);
    onComplete(correct, userAnswer);
  };

  const handleReset = () => {
    setPool(shuffleArray(words));
    setAnswer([]);
    setChecked(false);
    setIsCorrect(false);
  };

  return (
    <div className="space-y-5">
      {hint && (
        <p className="text-sm text-gray-500 italic">
          💡 {hint}
        </p>
      )}

      {/* Answer zone */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Votre réponse
        </p>
        <Card
          className={`min-h-14 border-2 transition-colors ${
            checked
              ? isCorrect
                ? 'border-green-400 bg-green-50'
                : 'border-red-400 bg-red-50'
              : 'border-blue-300 bg-blue-50'
          }`}
        >
          <CardContent className="p-3 flex flex-wrap gap-2 min-h-14 items-center">
            {answer.length === 0 && !checked && (
              <span className="text-gray-400 text-sm italic">
                Cliquez sur les mots ci-dessous pour construire la phrase…
              </span>
            )}
            {answer.map((word, idx) => (
              <button
                key={idx}
                onClick={() => moveToPool(idx)}
                disabled={checked}
                className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-all ${
                  checked
                    ? isCorrect
                      ? 'bg-green-100 border-green-400 text-green-800 cursor-default'
                      : 'bg-red-100 border-red-400 text-red-800 cursor-default'
                    : 'bg-white border-blue-400 text-blue-800 hover:bg-blue-100 cursor-pointer'
                }`}
              >
                {word}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Word pool */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Mots disponibles
        </p>
        <div className="flex flex-wrap gap-2 min-h-10">
          {pool.map((word, idx) => (
            <button
              key={idx}
              onClick={() => moveToAnswer(idx)}
              disabled={checked}
              className="px-3 py-1.5 rounded-md text-sm font-medium border bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-default"
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      {/* Result feedback */}
      {checked && (
        <div
          className={`flex items-start gap-3 rounded-lg p-4 border ${
            isCorrect
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {isCorrect ? (
            <Check className="w-5 h-5 mt-0.5 shrink-0" />
          ) : (
            <X className="w-5 h-5 mt-0.5 shrink-0" />
          )}
          <div>
            <p className="font-semibold">
              {isCorrect ? 'Parfait !' : 'Pas tout à fait…'}
            </p>
            {!isCorrect && (
              <p className="text-sm mt-1">
                Réponse correcte :{' '}
                <span className="font-medium">{sentence}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Recommencer
        </Button>
        {!checked && (
          <Button
            onClick={handleCheck}
            disabled={answer.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Vérifier
          </Button>
        )}
      </div>
    </div>
  );
}
