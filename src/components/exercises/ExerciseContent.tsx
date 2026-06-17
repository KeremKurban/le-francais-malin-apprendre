
import { Check, X } from 'lucide-react';
import SentenceScramble from './types/SentenceScramble';
import ErrorCorrection from './types/ErrorCorrection';
import ConjugationDrill from './types/ConjugationDrill';
import ListenAndType from './types/ListenAndType';

interface Exercise {
  type: string;
  prompt: string;
  text?: string;
  choices?: string[];
  words?: string[];
  answer: string;
  hint: string;
  explanation: string;
  blanks?: { position: number; options: string[] }[];
  // New exercise type fields
  sentence?: string;
  incorrectSentence?: string;
  correctSentence?: string;
  verb?: string;
  tense?: string;
  conjugations?: {
    je: string; tu: string; il: string;
    nous: string; vous: string; ils: string;
  };
}

interface ExerciseContentProps {
  exercise: Exercise;
  selectedAnswers: string[];
  selectedWords: number[];
  showResult: boolean;
  answerFeedback: {[key: string]: boolean};
  onAnswerSelect: (index: number, answer: string) => void;
  onMultipleChoiceSelect: (choice: string) => void;
  onWordSelect: (wordIndex: number) => void;
}

const ExerciseContent = ({
  exercise,
  selectedAnswers,
  selectedWords,
  showResult,
  answerFeedback,
  onAnswerSelect,
  onMultipleChoiceSelect,
  onWordSelect
}: ExerciseContentProps) => {
  const renderMultipleChoice = () => (
    <div className="space-y-6">
      <div className="text-lg font-medium text-gray-900 mb-4">
        {exercise.prompt}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {exercise.choices?.map((choice, index) => {
          const isSelected = selectedAnswers.includes(choice);
          const isCorrectChoice = exercise.answer.split(',').includes(choice);
          const showFeedback = showResult && isSelected;

          return (
            <div
              key={index}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? showFeedback
                    ? answerFeedback[choice]
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => !showResult && onMultipleChoiceSelect(choice)}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected
                    ? showFeedback
                      ? answerFeedback[choice]
                        ? 'border-green-500 bg-green-500'
                        : 'border-red-500 bg-red-500'
                      : 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {isSelected && (
                    showFeedback
                      ? answerFeedback[choice]
                        ? <Check className="w-3 h-3 text-white" />
                        : <X className="w-3 h-3 text-white" />
                      : <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className="font-medium">{choice}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show correct answers when result is shown */}
      {showResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="font-medium text-green-800 mb-2">Réponses correctes :</p>
          <p className="text-green-700">{exercise.answer.split(',').join(', ')}</p>
        </div>
      )}
    </div>
  );

  const renderErrorCorrectionLegacy = () => (
    <div className="space-y-6">
      <div className="text-lg font-medium text-gray-900 mb-4">
        {exercise.prompt}
      </div>

      <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
        <div className="text-base leading-relaxed flex flex-wrap gap-2">
          {exercise.words?.map((word, index) => {
            const isSelected = selectedWords.includes(index);
            const isCorrectError = exercise.answer.split(',').includes(index.toString());
            const showFeedback = showResult && isSelected;

            return (
              <span
                key={index}
                className={`px-2 py-1 rounded cursor-pointer transition-all ${
                  isSelected
                    ? showFeedback
                      ? isCorrectError
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                      : 'bg-blue-200 text-blue-800'
                    : 'hover:bg-gray-200'
                }`}
                onClick={() => !showResult && onWordSelect(index)}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>

      {/* Show correct errors when result is shown */}
      {showResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="font-medium text-green-800 mb-2">Mots à corriger :</p>
          <div className="flex flex-wrap gap-2">
            {exercise.answer.split(',').map((errorIndex, idx) => {
              const wordIndex = parseInt(errorIndex);
              return (
                <span key={idx} className="bg-green-200 text-green-800 px-2 py-1 rounded">
                  {exercise.words?.[wordIndex]}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderComplexText = () => {
    if (!exercise.blanks) return null;

    const textParts = exercise.text?.split('____') || [];

    return (
      <div className="space-y-6">
        <div className="text-lg font-medium text-gray-900 mb-4">
          {exercise.prompt}
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
          <div className="text-base leading-relaxed">
            {textParts.map((part, index) => (
              <span key={index}>
                {part}
                {index < exercise.blanks!.length && (
                  <select
                    className={`mx-2 px-3 py-1 border rounded-md bg-white font-medium min-w-32 ${
                      showResult
                        ? selectedAnswers[index] === exercise.answer.split(',')[index]
                          ? 'text-green-700 border-green-500'
                          : 'text-red-700 border-red-500'
                        : 'text-blue-700'
                    }`}
                    value={selectedAnswers[index] || ''}
                    onChange={(e) => onAnswerSelect(index, e.target.value)}
                    disabled={showResult}
                  >
                    <option value="">Choisir...</option>
                    {exercise.blanks![index].options.map((option, optIndex) => (
                      <option key={optIndex} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Show correct answers when result is shown */}
        {showResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-medium text-green-800 mb-2">Réponses correctes :</p>
            <p className="text-green-700">{exercise.answer.split(',').join(', ')}</p>
          </div>
        )}
      </div>
    );
  };

  // ── New exercise type renderers ──────────────────────────────────────────

  const renderSentenceScramble = () => {
    const sentence = exercise.sentence ?? exercise.answer;
    return (
      <div className="space-y-4">
        <div className="text-lg font-medium text-gray-900">{exercise.prompt}</div>
        <SentenceScramble
          sentence={sentence}
          hint={exercise.hint || undefined}
          onComplete={() => {/* handled internally; parent can hook via ExerciseActions */}}
        />
      </div>
    );
  };

  const renderErrorCorrectionNew = () => {
    if (!exercise.incorrectSentence || !exercise.correctSentence) {
      // Fallback to legacy word-click variant
      return renderErrorCorrectionLegacy();
    }
    return (
      <div className="space-y-4">
        <div className="text-lg font-medium text-gray-900">{exercise.prompt}</div>
        <ErrorCorrection
          incorrectSentence={exercise.incorrectSentence}
          correctSentence={exercise.correctSentence}
          explanation={exercise.explanation}
          onComplete={() => {/* handled internally */}}
        />
      </div>
    );
  };

  const renderConjugationDrill = () => {
    if (!exercise.verb || !exercise.tense || !exercise.conjugations) return null;
    return (
      <div className="space-y-4">
        <div className="text-lg font-medium text-gray-900">{exercise.prompt}</div>
        <ConjugationDrill
          verb={exercise.verb}
          tense={exercise.tense}
          conjugations={exercise.conjugations}
          onComplete={() => {/* handled internally */}}
        />
      </div>
    );
  };

  const renderListenAndType = () => {
    const sentence = exercise.sentence ?? exercise.text ?? '';
    return (
      <div className="space-y-4">
        <div className="text-lg font-medium text-gray-900">{exercise.prompt}</div>
        <ListenAndType
          sentence={sentence}
          onComplete={() => {/* handled internally */}}
        />
      </div>
    );
  };

  // ── Routing ──────────────────────────────────────────────────────────────

  if (exercise.type === 'multiple_choice') {
    return renderMultipleChoice();
  } else if (exercise.type === 'error_correction') {
    return renderErrorCorrectionNew();
  } else if (exercise.type === 'complex_text') {
    return renderComplexText();
  } else if (exercise.type === 'sentence_scramble') {
    return renderSentenceScramble();
  } else if (exercise.type === 'conjugation_drill') {
    return renderConjugationDrill();
  } else if (exercise.type === 'listen_and_type') {
    return renderListenAndType();
  }

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium text-gray-900">
        {exercise.prompt}
      </div>

      {exercise.text && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <p className="text-base leading-relaxed">{exercise.text}</p>
        </div>
      )}
    </div>
  );
};

export default ExerciseContent;
