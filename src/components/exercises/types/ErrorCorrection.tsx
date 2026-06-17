import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X, RotateCcw } from 'lucide-react';

export interface ErrorCorrectionProps {
  incorrectSentence: string;
  correctSentence: string;
  explanation: string;
  onComplete: (correct: boolean) => void;
}

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

type AttemptState = 'idle' | 'correct' | 'wrong';

export default function ErrorCorrection({
  incorrectSentence,
  correctSentence,
  explanation,
  onComplete,
}: ErrorCorrectionProps) {
  const [userInput, setUserInput] = useState('');
  const [attemptState, setAttemptState] = useState<AttemptState>('idle');
  const [attemptsLeft, setAttemptsLeft] = useState(2);

  const handleCheck = () => {
    const correct = normalize(userInput) === normalize(correctSentence);
    if (correct) {
      setAttemptState('correct');
      onComplete(true);
    } else {
      const remaining = attemptsLeft - 1;
      setAttemptsLeft(remaining);
      if (remaining <= 0) {
        setAttemptState('wrong');
        onComplete(false);
      } else {
        setAttemptState('wrong');
        // allow retry — state resets below via handleReset
      }
    }
  };

  const handleReset = () => {
    setUserInput('');
    setAttemptState('idle');
  };

  const isDone = attemptState === 'correct' || attemptsLeft <= 0;

  return (
    <div className="space-y-5">
      {/* Incorrect sentence display */}
      <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-1">
          Phrase incorrecte
        </p>
        <p className="text-base font-medium text-gray-900">{incorrectSentence}</p>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <Label htmlFor="error-correction-input" className="text-sm font-medium text-gray-700">
          Tapez la phrase corrigée :
        </Label>
        <Input
          id="error-correction-input"
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && userInput.trim() && !isDone) handleCheck();
          }}
          placeholder="Écrivez la phrase corrigée…"
          disabled={isDone}
          className={`text-base ${
            attemptState === 'correct'
              ? 'border-green-500 focus-visible:ring-green-500'
              : attemptState === 'wrong'
              ? 'border-red-400 focus-visible:ring-red-400'
              : ''
          }`}
        />
        {attemptState === 'wrong' && !isDone && (
          <p className="text-xs text-red-600">
            Incorrect. Il vous reste{' '}
            <strong>{attemptsLeft} tentative{attemptsLeft > 1 ? 's' : ''}</strong>.
          </p>
        )}
      </div>

      {/* Result feedback */}
      {isDone && (
        <div
          className={`flex items-start gap-3 rounded-lg p-4 border ${
            attemptState === 'correct'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {attemptState === 'correct' ? (
            <Check className="w-5 h-5 mt-0.5 shrink-0" />
          ) : (
            <X className="w-5 h-5 mt-0.5 shrink-0" />
          )}
          <div className="space-y-1">
            <p className="font-semibold">
              {attemptState === 'correct' ? 'Excellent !' : 'Pas tout à fait…'}
            </p>
            {attemptState !== 'correct' && (
              <p className="text-sm">
                Réponse correcte :{' '}
                <span className="font-medium">{correctSentence}</span>
              </p>
            )}
            <p className="text-sm mt-1">
              <span className="font-semibold">Explication :</span> {explanation}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        {attemptState === 'wrong' && !isDone ? (
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Réessayer
          </Button>
        ) : (
          <div />
        )}
        {!isDone && (
          <Button
            onClick={handleCheck}
            disabled={!userInput.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Vérifier
          </Button>
        )}
      </div>
    </div>
  );
}
