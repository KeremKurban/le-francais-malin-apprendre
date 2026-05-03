import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Volume2, Check, X } from 'lucide-react';

export interface ListenAndTypeProps {
  sentence: string;
  onComplete: (correct: boolean, userInput: string) => void;
}

const MAX_PLAYS = 3;

function normalizeDictation(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:«»"'()\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

type ResultState = 'idle' | 'correct' | 'wrong';

export default function ListenAndType({ sentence, onComplete }: ListenAndTypeProps) {
  const [playsRemaining, setPlaysRemaining] = useState(MAX_PLAYS);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<ResultState>('idle');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const handlePlay = () => {
    if (playsRemaining <= 0 || isSpeaking) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = 'fr-FR';
    utterance.rate = isSlowMode ? 0.7 : 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    setPlaysRemaining(prev => prev - 1);
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = () => {
    const correct =
      normalizeDictation(userInput) === normalizeDictation(sentence);
    setResult(correct ? 'correct' : 'wrong');
    onComplete(correct, userInput);
  };

  const isDone = result !== 'idle';

  return (
    <div className="space-y-5">
      {/* Listen controls */}
      <div className="flex flex-col items-center gap-4 py-6 bg-blue-50 rounded-xl border border-blue-100">
        <div className="relative">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isSpeaking
                ? 'bg-blue-500 shadow-lg shadow-blue-200 animate-pulse'
                : playsRemaining > 0
                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
            onClick={!isSpeaking && playsRemaining > 0 ? handlePlay : undefined}
            role="button"
            aria-label="Écouter la phrase"
          >
            <Volume2 className="w-9 h-9 text-white" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-blue-800">
            {isSpeaking
              ? 'Lecture en cours…'
              : playsRemaining > 0
              ? 'Cliquez pour écouter'
              : 'Nombre de lectures épuisé'}
          </p>
          <p className="text-xs text-blue-600">
            Lectures restantes :{' '}
            <strong>{playsRemaining}</strong>
          </p>
        </div>

        {/* Speed toggle */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setIsSlowMode(false)}
            className={`px-3 py-1 rounded-full border text-xs font-medium transition-all ${
              !isSlowMode
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            Normale
          </button>
          <button
            onClick={() => setIsSlowMode(true)}
            className={`px-3 py-1 rounded-full border text-xs font-medium transition-all ${
              isSlowMode
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            Lente
          </button>
        </div>
      </div>

      {/* Text input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Écrivez ce que vous entendez :
        </label>
        <Textarea
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          placeholder="Tapez la phrase entendue…"
          disabled={isDone}
          className="resize-none min-h-[80px] text-base"
        />
      </div>

      {/* Result feedback */}
      {isDone && (
        <div
          className={`rounded-lg p-4 border space-y-2 ${
            result === 'correct'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {result === 'correct' ? (
              <>
                <Check className="w-5 h-5" />
                Bravo, c'est exact !
              </>
            ) : (
              <>
                <X className="w-5 h-5" />
                Pas tout à fait…
              </>
            )}
          </div>
          {result === 'wrong' && (
            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium">Phrase correcte :</span>{' '}
                <span className="font-mono">{sentence}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Submit button */}
      {!isDone && (
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!userInput.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Soumettre
          </Button>
        </div>
      )}
    </div>
  );
}
