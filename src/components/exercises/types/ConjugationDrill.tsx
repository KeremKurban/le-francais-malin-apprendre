import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X } from 'lucide-react';

export interface ConjugationDrillProps {
  verb: string;
  tense: string;
  conjugations: {
    je: string;
    tu: string;
    il: string;
    nous: string;
    vous: string;
    ils: string;
  };
  onComplete: (score: number) => void;
}

type Pronoun = 'je' | 'tu' | 'il' | 'nous' | 'vous' | 'ils';

const PRONOUNS: { key: Pronoun; label: string }[] = [
  { key: 'je', label: 'je / j\'' },
  { key: 'tu', label: 'tu' },
  { key: 'il', label: 'il / elle / on' },
  { key: 'nous', label: 'nous' },
  { key: 'vous', label: 'vous' },
  { key: 'ils', label: 'ils / elles' },
];

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

type FeedbackMap = Partial<Record<Pronoun, boolean>>;

export default function ConjugationDrill({
  verb,
  tense,
  conjugations,
  onComplete,
}: ConjugationDrillProps) {
  const [inputs, setInputs] = useState<Record<Pronoun, string>>({
    je: '', tu: '', il: '', nous: '', vous: '', ils: '',
  });
  const [feedback, setFeedback] = useState<FeedbackMap>({});
  const [checked, setChecked] = useState(false);
  const inputRefs = useRef<Partial<Record<Pronoun, HTMLInputElement>>>({});

  const handleChange = (pronoun: Pronoun, value: string) => {
    if (checked) return;
    setInputs(prev => ({ ...prev, [pronoun]: value }));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentIndex: number
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextPronoun = PRONOUNS[currentIndex + 1];
      if (nextPronoun) {
        inputRefs.current[nextPronoun.key]?.focus();
      } else {
        handleCheckAll();
      }
    }
  };

  const handleCheckAll = () => {
    if (checked) return;
    const newFeedback: FeedbackMap = {};
    let score = 0;
    for (const { key } of PRONOUNS) {
      const correct = normalize(inputs[key]) === normalize(conjugations[key]);
      newFeedback[key] = correct;
      if (correct) score++;
    }
    setFeedback(newFeedback);
    setChecked(true);
    onComplete(score);
  };

  const score = checked
    ? Object.values(feedback).filter(Boolean).length
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-bold text-lg">
          {verb}
        </div>
        <div className="text-gray-500 text-sm">—</div>
        <div className="text-gray-700 font-medium capitalize">{tense}</div>
      </div>

      {/* Score badge */}
      {checked && (
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${
            score === 6
              ? 'bg-green-100 border-green-300 text-green-800'
              : score >= 4
              ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
              : 'bg-red-100 border-red-300 text-red-800'
          }`}
        >
          {score === 6 ? (
            <Check className="w-4 h-4" />
          ) : (
            <span className="w-4 h-4 text-center leading-4">✦</span>
          )}
          {score} / 6 correct{score > 1 ? 's' : ''}
        </div>
      )}

      {/* Conjugation table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-2.5 font-semibold text-gray-600 w-36">
                Pronom
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">
                Conjugaison
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {PRONOUNS.map(({ key, label }, index) => {
              const isCorrect = feedback[key];
              const isCheckedAndWrong = checked && isCorrect === false;
              const isCheckedAndRight = checked && isCorrect === true;
              return (
                <tr
                  key={key}
                  className={
                    isCheckedAndRight
                      ? 'bg-green-50'
                      : isCheckedAndWrong
                      ? 'bg-red-50'
                      : index % 2 === 0
                      ? 'bg-white'
                      : 'bg-gray-50/50'
                  }
                >
                  <td className="px-4 py-2.5 font-medium text-gray-700">{label}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-col gap-1">
                      <Input
                        ref={el => {
                          if (el) inputRefs.current[key] = el;
                        }}
                        value={inputs[key]}
                        onChange={e => handleChange(key, e.target.value)}
                        onKeyDown={e => handleKeyDown(e, index)}
                        disabled={checked}
                        placeholder={`${key === 'je' ? "j'" : key}…`}
                        className={`h-8 text-sm ${
                          isCheckedAndRight
                            ? 'border-green-500 text-green-700 bg-green-50'
                            : isCheckedAndWrong
                            ? 'border-red-400 text-red-700 bg-red-50'
                            : ''
                        }`}
                      />
                      {isCheckedAndWrong && (
                        <span className="text-xs text-red-600 font-medium">
                          → {conjugations[key]}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {isCheckedAndRight && (
                      <Check className="w-4 h-4 text-green-600 mx-auto" />
                    )}
                    {isCheckedAndWrong && (
                      <X className="w-4 h-4 text-red-500 mx-auto" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Check button */}
      {!checked && (
        <div className="flex justify-end">
          <Button
            onClick={handleCheckAll}
            disabled={PRONOUNS.every(({ key }) => !inputs[key].trim())}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Vérifier tout
          </Button>
        </div>
      )}
    </div>
  );
}
