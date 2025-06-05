import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ExerciseHeader from './exercises/ExerciseHeader';
import ExerciseContent from './exercises/ExerciseContent';
import ExerciseActions from './exercises/ExerciseActions';
import { exerciseData } from '@/data/exerciseData';
import { UserManager } from '@/utils/UserManager';
import { SupabaseUserManager } from '@/utils/SupabaseUserManager';

interface Topic {
  id: string;
  title: string;
  description: string;
  example: string;
  difficulty: string;
  exercises: number;
  color: string;
}

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
}

interface ExerciseInterfaceProps {
  topic: Topic | null;
  onComplete: (score: number, topic: Topic) => void;
  onBack: () => void;
}

const ExerciseInterface = ({ topic, onComplete, onBack }: ExerciseInterfaceProps) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [answerFeedback, setAnswerFeedback] = useState<{[key: string]: boolean}>({});
  const [mistakes, setMistakes] = useState<Array<{question: string, userAnswer: string, correctAnswer: string, details?: any}>>([]);
  const [canSubmit, setCanSubmit] = useState(false);
  const [finished, setFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Array<{question: string, userAnswer: string, correctAnswer: string, isCorrect: boolean, type: string, details?: any}>>([]);
  const { toast } = useToast();

  const exercises = topic ? (exerciseData[topic.id] || []) : [];
  const exercise = exercises[currentExercise];

  // Reset all state when topic changes
  useEffect(() => {
    if (topic) {
      console.log('Topic changed, resetting state:', topic.id);
      setCurrentExercise(0);
      setScore(0);
      setMistakes([]);
      setShowResult(false);
      setShowHint(false);
      setIsCorrect(false);
      setSelectedAnswers([]);
      setSelectedWords([]);
      setAnswerFeedback({});
      
      if (exercises.length === 0) {
        console.error('No exercises found for topic:', topic.id);
        toast({
          title: "Erreur",
          description: "Aucun exercice disponible pour ce sujet.",
          variant: "destructive"
        });
        onBack();
      }
    }
  }, [topic, exercises.length]);

  // Reset answer state when exercise changes
  useEffect(() => {
    if (exercise) {
      if (exercise.type === 'multiple_choice') {
        setSelectedAnswers([]);
      } else if (exercise.type === 'error_correction') {
        setSelectedWords([]);
      } else {
        const blanksCount = exercise.blanks?.length || 0;
        setSelectedAnswers(new Array(blanksCount).fill(''));
      }
      setAnswerFeedback({});
    }
  }, [currentExercise, exercise]);

  // Update canSubmit whenever answer state changes
  useEffect(() => {
    if (!exercise) {
      setCanSubmit(false);
      return;
    }
    if (showResult) {
      setCanSubmit(false);
      return;
    }
    if (exercise.type === 'multiple_choice') {
      setCanSubmit(selectedAnswers.length > 0);
    } else if (exercise.type === 'error_correction') {
      setCanSubmit(selectedWords.length > 0);
    } else if (exercise.blanks) {
      setCanSubmit(selectedAnswers.length === exercise.blanks.length && selectedAnswers.every(a => a && a !== ''));
    } else {
      setCanSubmit(false);
    }
  }, [exercise, selectedAnswers, selectedWords, showResult]);

  const handleAnswerSelect = (index: number, answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[index] = answer;
    setSelectedAnswers(newAnswers);
  };

  const handleMultipleChoiceSelect = (choice: string) => {
    setSelectedAnswers(prev => 
      prev.includes(choice) 
        ? prev.filter(a => a !== choice)
        : [...prev, choice]
    );
  };

  const handleWordSelect = (wordIndex: number) => {
    setSelectedWords(prev => 
      prev.includes(wordIndex)
        ? prev.filter(i => i !== wordIndex)
        : [...prev, wordIndex]
    );
  };

  const handleAnswerSubmit = async () => {
    if (!exercise) return;
    let userAnswer = '';
    let correct = false;
    let mistakeDetails: any[] = [];

    if (exercise.type === 'multiple_choice') {
      userAnswer = selectedAnswers.sort().join(',');
      correct = userAnswer === exercise.answer;
      // Create feedback for each choice
      const correctAnswers = exercise.answer.split(',');
      const feedback: {[key: string]: boolean} = {};
      exercise.choices?.forEach(choice => {
        if (selectedAnswers.includes(choice)) {
          feedback[choice] = correctAnswers.includes(choice);
          if (!correctAnswers.includes(choice)) {
            mistakeDetails.push({ user: choice, correct: null, isCorrect: false, message: `"${choice}" should not be selected` });
          }
        } else if (correctAnswers.includes(choice)) {
          mistakeDetails.push({ user: null, correct: choice, isCorrect: false, message: `"${choice}" was missed` });
        }
      });
      setAnswerFeedback(feedback);
    } else if (exercise.type === 'error_correction') {
      userAnswer = selectedWords.sort((a, b) => a - b).join(',');
      correct = userAnswer === exercise.answer;
      // Optionally, add more granular mistake details for error_correction
    } else {
      userAnswer = selectedAnswers.join(',');
      correct = userAnswer === exercise.answer;
      // For fill-in-the-blank, log per-blank details as JSON
      if (exercise.blanks) {
        exercise.blanks.forEach((blank, idx) => {
          const userVal = selectedAnswers[idx] || '';
          const correctVal = (exercise.answer.split(',')[idx] || '');
          const isCorrect = userVal === correctVal;
          mistakeDetails.push({ user: userVal, correct: correctVal, isCorrect });
        });
      }
    }
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      setScore(score + 25);
      toast({
        title: "Excellent !",
        description: "Votre réponse est parfaite !",
      });
    } else {
      // Log the mistake immediately to Supabase with details as JSON
      const mistakeObj = {
        question: exercise.prompt,
        userAnswer: userAnswer,
        correctAnswer: exercise.answer,
        type: exercise.type || 'grammar',
        details: mistakeDetails
      };
      setMistakes(prev => [...prev, mistakeObj]);
      try {
        await SupabaseUserManager.updateUserProgress(
          topic?.id || '',
          score,
          [{ ...mistakeObj }]
        );
      } catch (e) {
        console.error('Failed to log mistake to Supabase', e);
      }
      toast({
        title: "Pas tout à fait...",
        description: mistakeDetails.length > 0 ? 'Regardez les erreurs en rouge ci-dessous.' : "Consultez l'explication pour mieux comprendre.",
        variant: "destructive",
      });
    }
    setUserAnswers(prev => [...prev, {
      question: exercise.prompt,
      userAnswer: userAnswer,
      correctAnswer: exercise.answer,
      isCorrect: correct,
      type: exercise.type || 'grammar',
      details: mistakeDetails
    }]);
  };

  const handleNextExercise = async () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setSelectedAnswers([]);
      setSelectedWords([]);
      setShowResult(false);
      setShowHint(false);
      setAnswerFeedback({});
    } else {
      if (topic) {
        const finalScore = Math.round((score / (exercises.length * 25)) * 100);
        // Send all answers (not just mistakes) to Supabase
        try {
          await SupabaseUserManager.updateUserProgress(topic.id, finalScore, userAnswers);
        } catch (e) {
          console.error('Failed to update user progress', e);
        }
        setFinished(true);
        onComplete(finalScore, topic);
        toast({
          title: "Exercices terminés !",
          description: `Score final: ${finalScore}%`,
        });
        // Use location.replace to ensure redirect always works
        setTimeout(() => {
          window.location.replace("/grammaire");
        }, 1200);
      }
    }
  };

  if (!topic) {
    return null;
  }
  if (finished) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            {topic.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4 text-green-700">Exercices terminés !</h2>
            <p className="text-lg">Merci d'avoir complété ce module.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          {topic.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Only show ExerciseHeader and ExerciseActions if not finished */}
        {!(showResult && currentExercise === exercises.length - 1) && (
          <ExerciseHeader 
            topic={topic} 
            currentExercise={currentExercise} 
            totalExercises={exercises.length} 
            score={score}
            onBack={onBack} 
          />
        )}
        <div className="my-4">
          {showResult ? (
            <div className="text-center">
              <h2 className={`text-xl font-semibold mb-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}
              >
                {isCorrect ? 'Correct !' : 'Incorrect'}
              </h2>
              <p className="text-gray-700 mb-4">
                {isCorrect ? 'Bien joué !' : 'Réessayez ou consultez l\'explication.'}
              </p>
              {/* Show feedback for each answer if available */}
              {exercise && (exercise.type === 'multiple_choice' || exercise.type === 'error_correction' || exercise.blanks) && (
                <div className="mb-4">
                  {exercise.type === 'multiple_choice' && exercise.choices && exercise.choices.map((choice, idx) => (
                    <div key={choice} className={`py-1 px-2 rounded mb-1 text-left ${answerFeedback[choice] === true ? 'bg-green-100 text-green-700' : answerFeedback[choice] === false ? 'bg-red-100 text-red-700' : ''}`}
                    >
                      {choice}
                      {selectedAnswers.includes(choice) && (
                        <span className="ml-2 font-bold">{answerFeedback[choice] === true ? '✔️' : answerFeedback[choice] === false ? '❌' : ''}</span>
                      )}
                    </div>
                  ))}
                  {exercise.type === 'error_correction' && exercise.words && exercise.words.map((word, idx) => (
                    <span key={idx} className={`inline-block mx-1 px-2 py-1 rounded ${selectedWords.includes(idx) ? (exercise.answer.split(',').includes(idx.toString()) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700') : ''}`}>{word}</span>
                  ))}
                  {exercise.blanks && exercise.blanks.map((blank, idx) => {
                    const userVal = selectedAnswers[idx] || '';
                    const correctVal = (exercise.answer.split(',')[idx] || '');
                    const isCorrect = userVal === correctVal;
                    return (
                      <div key={idx} className={`py-1 px-2 rounded mb-1 text-left ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        <span className="font-semibold">Votre réponse :</span> {userVal} {isCorrect ? '✔️' : '❌'}
                        {!isCorrect && <span className="ml-2">(Bonne réponse : {correctVal})</span>}
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Only show the Terminer button on the last exercise, remove Exercice Suivant here */}
              {currentExercise === exercises.length - 1 && !finished && (
                <button
                  onClick={async () => {
                    await handleNextExercise();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  Terminer
                </button>
              )}
            </div>
          ) : (
            <ExerciseContent 
              exercise={exercise} 
              selectedAnswers={selectedAnswers} 
              selectedWords={selectedWords} 
              answerFeedback={answerFeedback}
              onAnswerSelect={handleAnswerSelect} 
              onMultipleChoiceSelect={handleMultipleChoiceSelect}
              onWordSelect={handleWordSelect}
              showResult={showResult}
            />
          )}
        </div>
        {/* Only show ExerciseActions if not finished */}
        {!(showResult && currentExercise === exercises.length - 1) && (
          <ExerciseActions 
            exercise={exercise} 
            onSubmit={handleAnswerSubmit} 
            onNext={handleNextExercise} 
            showResult={showResult}
            isCorrect={isCorrect}
            canSubmit={canSubmit}
            isLastExercise={currentExercise === exercises.length - 1}
            showHint={showHint}
            onShowHint={() => setShowHint(true)}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ExerciseInterface;
