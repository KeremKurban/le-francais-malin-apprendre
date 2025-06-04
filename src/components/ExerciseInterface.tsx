
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Check, X, RotateCcw } from 'lucide-react';

interface Topic {
  id: string;
  title: string;
  description: string;
  example: string;
  difficulty: string;
  exercises: number;
  color: string;
}

interface ExerciseInterfaceProps {
  topic: Topic | null;
  onComplete: (score: number, topic: Topic, mistakes?: Array<{question: string, userAnswer: string, correctAnswer: string}>) => void;
  onBack: () => void;
}

interface Exercise {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const ExerciseInterface = ({ topic, onComplete, onBack }: ExerciseInterfaceProps) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState<Array<{question: string, userAnswer: string, correctAnswer: string}>>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    if (topic) {
      generateExercises();
    }
  }, [topic]);

  const generateExercises = () => {
    // Generate sample exercises based on topic
    const sampleExercises: Exercise[] = [
      {
        id: '1',
        question: `Choisissez la bonne réponse pour: "__ livre est sur la table"`,
        options: ['Le', 'La', 'Les', 'L\''],
        correctAnswer: 'Le',
        explanation: 'On utilise "le" devant un nom masculin singulier.'
      },
      {
        id: '2',
        question: `Complétez: "__ enfants jouent dans le parc"`,
        options: ['Le', 'La', 'Les', 'L\''],
        correctAnswer: 'Les',
        explanation: 'On utilise "les" devant un nom pluriel.'
      },
      {
        id: '3',
        question: `Choisissez: "__ eau est froide"`,
        options: ['Le', 'La', 'Les', 'L\''],
        correctAnswer: 'L\'',
        explanation: 'On utilise "l\'" devant un nom commençant par une voyelle.'
      },
      {
        id: '4',
        question: `Complétez: "__ maison est grande"`,
        options: ['Le', 'La', 'Les', 'L\''],
        correctAnswer: 'La',
        explanation: 'On utilise "la" devant un nom féminin singulier.'
      },
      {
        id: '5',
        question: `Choisissez: "__ voitures sont rapides"`,
        options: ['Le', 'La', 'Les', 'L\''],
        correctAnswer: 'Les',
        explanation: 'On utilise "les" devant un nom pluriel.'
      }
    ];
    setExercises(sampleExercises);
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;

    const exercise = exercises[currentExercise];
    const isCorrect = selectedAnswer === exercise.correctAnswer;
    
    if (isCorrect) {
      setScore(score + 1);
    } else {
      setMistakes([...mistakes, {
        question: exercise.question,
        userAnswer: selectedAnswer,
        correctAnswer: exercise.correctAnswer
      }]);
    }

    setShowResult(true);
  };

  const handleNextExercise = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setSelectedAnswer('');
      setShowResult(false);
    } else {
      // Exercise completed
      const finalScore = Math.round((score / exercises.length) * 100);
      onComplete(finalScore, topic!, mistakes);
    }
  };

  const resetExercise = () => {
    setCurrentExercise(0);
    setSelectedAnswer('');
    setShowResult(false);
    setScore(0);
    setMistakes([]);
  };

  if (!topic || exercises.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Chargement des exercices...</p>
      </div>
    );
  }

  const exercise = exercises[currentExercise];
  const progress = ((currentExercise + 1) / exercises.length) * 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </Button>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">{topic.title}</h2>
          <p className="text-gray-600">
            Exercice {currentExercise + 1} sur {exercises.length}
          </p>
        </div>
        <Button variant="ghost" onClick={resetExercise} className="flex items-center space-x-2">
          <RotateCcw className="w-4 h-4" />
          <span>Recommencer</span>
        </Button>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progression</span>
          <span className="text-gray-900">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Exercise Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">
            {exercise.question}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {exercise.options.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswer === option ? 'default' : 'outline'}
                className={`p-4 h-auto text-left justify-start ${
                  showResult && option === exercise.correctAnswer
                    ? 'bg-green-100 border-green-500 text-green-800'
                    : showResult && selectedAnswer === option && option !== exercise.correctAnswer
                    ? 'bg-red-100 border-red-500 text-red-800'
                    : ''
                }`}
                onClick={() => !showResult && handleAnswerSelect(option)}
                disabled={showResult}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span>{option}</span>
                  {showResult && option === exercise.correctAnswer && (
                    <Check className="w-5 h-5 ml-auto" />
                  )}
                  {showResult && selectedAnswer === option && option !== exercise.correctAnswer && (
                    <X className="w-5 h-5 ml-auto" />
                  )}
                </div>
              </Button>
            ))}
          </div>

          {/* Explanation */}
          {showResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Explication :</h4>
              <p className="text-blue-800">{exercise.explanation}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div className="text-sm text-gray-600">
              Score actuel: {score}/{currentExercise + (showResult ? 1 : 0)}
            </div>
            
            {!showResult ? (
              <Button 
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className="bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700"
              >
                Valider
              </Button>
            ) : (
              <Button 
                onClick={handleNextExercise}
                className="bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700"
              >
                {currentExercise < exercises.length - 1 ? 'Exercice suivant' : 'Terminer'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExerciseInterface;
