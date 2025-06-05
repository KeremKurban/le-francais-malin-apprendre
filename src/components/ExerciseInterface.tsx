
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ExerciseHeader from './exercises/ExerciseHeader';
import ExerciseContent from './exercises/ExerciseContent';
import ExerciseActions from './exercises/ExerciseActions';
import { exerciseData } from '@/data/exerciseData';
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
  onComplete: (score: number, topic: Topic, mistakes?: Array<{question: string, userAnswer: string, correctAnswer: string}>) => void;
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
  const [mistakes, setMistakes] = useState<Array<{question: string, userAnswer: string, correctAnswer: string}>>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
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
      setAchievements([]);
      
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

    if (exercise.type === 'multiple_choice') {
      userAnswer = selectedAnswers.sort().join(',');
      correct = userAnswer === exercise.answer;
      
      // Create feedback for each choice
      const correctAnswers = exercise.answer.split(',');
      const feedback: {[key: string]: boolean} = {};
      exercise.choices?.forEach(choice => {
        if (selectedAnswers.includes(choice)) {
          feedback[choice] = correctAnswers.includes(choice);
        }
      });
      setAnswerFeedback(feedback);
    } else if (exercise.type === 'error_correction') {
      userAnswer = selectedWords.sort((a, b) => a - b).join(',');
      correct = userAnswer === exercise.answer;
    } else {
      userAnswer = selectedAnswers.join(',');
      correct = userAnswer === exercise.answer;
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
      // Log the mistake
      const newMistake = {
        question: exercise.prompt,
        userAnswer: userAnswer,
        correctAnswer: exercise.answer
      };
      setMistakes(prev => [...prev, newMistake]);
      
      // Create learning insight for adaptive learning
      if (topic) {
        try {
          await SupabaseUserManager.createLearningInsight(
            topic.id,
            `Difficulty with ${exercise.type} exercises`,
            1,
            [exercise.type]
          );
        } catch (error) {
          console.error('Error creating learning insight:', error);
        }
      }
      
      toast({
        title: "Pas tout à fait...",
        description: "Consultez l'explication pour mieux comprendre.",
        variant: "destructive",
      });
    }
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
        
        // Check for achievements
        try {
          const newAchievements = await SupabaseUserManager.checkAndAwardAchievements(finalScore, topic.id);
          if (newAchievements.length > 0) {
            setAchievements(newAchievements);
            toast({
              title: "Félicitations !",
              description: `Vous avez débloqué ${newAchievements.length} nouveau(x) badge(s) !`,
            });
          }
        } catch (error) {
          console.error('Error checking achievements:', error);
        }
        
        onComplete(finalScore, topic, mistakes);
        toast({
          title: "Exercices terminés !",
          description: `Score final: ${finalScore}%`,
        });
      }
    }
  };

  const canSubmit = () => {
    if (exercise?.type === 'multiple_choice') {
      return selectedAnswers.length > 0;
    } else if (exercise?.type === 'error_correction') {
      return selectedWords.length > 0;
    } else {
      return selectedAnswers.every(answer => answer !== '');
    }
  };

  if (!topic || !exercise) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600">Aucun exercice disponible pour ce sujet.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <ExerciseHeader
        topic={topic}
        currentExercise={currentExercise}
        totalExercises={exercises.length}
        score={score}
        onBack={onBack}
      />

      {/* Exercise Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Book className="w-5 h-5" />
            Exercice {currentExercise + 1} - {exercise.type === 'multiple_choice' ? 'Choix multiples' : exercise.type === 'error_correction' ? 'Correction d\'erreurs' : 'Texte complexe'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ExerciseContent
            exercise={exercise}
            selectedAnswers={selectedAnswers}
            selectedWords={selectedWords}
            showResult={showResult}
            answerFeedback={answerFeedback}
            onAnswerSelect={handleAnswerSelect}
            onMultipleChoiceSelect={handleMultipleChoiceSelect}
            onWordSelect={handleWordSelect}
          />

          <ExerciseActions
            exercise={exercise}
            showHint={showHint}
            showResult={showResult}
            isCorrect={isCorrect}
            canSubmit={canSubmit()}
            isLastExercise={currentExercise >= exercises.length - 1}
            onShowHint={() => setShowHint(true)}
            onSubmit={handleAnswerSubmit}
            onNext={handleNextExercise}
          />
        </CardContent>
      </Card>

      {/* Achievement Notifications */}
      {achievements.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardHeader>
            <CardTitle className="text-xl text-center text-yellow-800">
              🏆 Nouveaux badges débloqués !
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center">
              {achievements.map((achievement, index) => (
                <div key={index} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  {achievement === 'perfect_score' && '✨ Score parfait'}
                  {achievement === 'first_completion' && '🎯 Premier succès'}
                  {achievement === 'week_streak' && '🔥 Série de 7 jours'}
                  {achievement.startsWith('mastery_') && '🎓 Maîtrise du sujet'}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExerciseInterface;
