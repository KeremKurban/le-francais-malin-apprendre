
import { Button } from '@/components/ui/button';
import { Book, Check, Circle } from 'lucide-react';

interface Exercise {
  type: string;
  hint: string;
  explanation: string;
  answer: string;
}

interface ExerciseActionsProps {
  exercise: Exercise;
  showHint: boolean;
  showResult: boolean;
  isCorrect: boolean;
  canSubmit: boolean;
  isLastExercise: boolean;
  onShowHint: () => void;
  onSubmit: () => void;
  onNext: () => void;
}

const ExerciseActions = ({
  exercise,
  showHint,
  showResult,
  isCorrect,
  canSubmit,
  isLastExercise,
  onShowHint,
  onSubmit,
  onNext
}: ExerciseActionsProps) => {
  return (
    <div className="space-y-6">
      {/* Hint */}
      {showHint && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Book className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Indice :</p>
              <p className="text-yellow-700">{exercise.hint}</p>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {showResult && (
        <div className={`border rounded-lg p-4 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start space-x-2">
            {isCorrect ? (
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div>
              <p className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {isCorrect ? 'Parfait !' : 'Pas tout à fait...'}
              </p>
              <p className={`text-sm mt-1 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {exercise.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onShowHint}
          disabled={showHint}
        >
          <Book className="w-4 h-4 mr-2" />
          Indice
        </Button>

        <div className="space-x-3">
          {!showResult ? (
            <Button 
              onClick={onSubmit}
              disabled={!canSubmit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Vérifier
            </Button>
          ) : (
            <Button onClick={onNext} className="bg-green-600 hover:bg-green-700">
              {isLastExercise ? 'Terminer' : 'Suivant'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseActions;
