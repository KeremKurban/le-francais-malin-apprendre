
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft } from 'lucide-react';

interface Topic {
  id: string;
  title: string;
  description: string;
  example: string;
  difficulty: string;
  exercises: number;
  color: string;
}

interface ExerciseHeaderProps {
  topic: Topic;
  currentExercise: number;
  totalExercises: number;
  score: number;
  onBack: () => void;
}

const ExerciseHeader = ({ topic, currentExercise, totalExercises, score, onBack }: ExerciseHeaderProps) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">{topic.title}</h2>
          <Badge className="mt-2">{topic.difficulty}</Badge>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-600">Score</div>
          <div className="text-xl font-bold text-blue-600">{score} pts</div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Question {currentExercise + 1} sur {totalExercises}</span>
          <span>{Math.round(((currentExercise + 1) / totalExercises) * 100)}%</span>
        </div>
        <Progress value={((currentExercise + 1) / totalExercises) * 100} />
      </div>
    </div>
  );
};

export default ExerciseHeader;
