
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Star, Clock, Trophy } from 'lucide-react';
import { UserProgress } from '@/utils/SupabaseUserManager';

interface Topic {
  id: string;
  title: string;
  description: string;
  example: string;
  difficulty: string;
  exercises: number;
  color: string;
}

interface GrammarTopicsProps {
  onTopicSelect: (topic: Topic) => void;
  userProgress: Record<string, UserProgress>;
}

const topics: Topic[] = [
  {
    id: 'le-la-les',
    title: 'Les articles définis',
    description: 'Maîtrisez l\'usage de le, la, les',
    example: 'Le chat, la maison, les enfants',
    difficulty: 'Débutant',
    exercises: 15,
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'un-une-des',
    title: 'Les articles indéfinis',
    description: 'Apprenez à utiliser un, une, des',
    example: 'Un livre, une table, des fleurs',
    difficulty: 'Débutant',
    exercises: 12,
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'passe-compose',
    title: 'Le passé composé',
    description: 'Formation et usage du passé composé',
    example: 'J\'ai mangé, il est parti',
    difficulty: 'Intermédiaire',
    exercises: 20,
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'futur-simple',
    title: 'Le futur simple',
    description: 'Conjugaison du futur simple',
    example: 'Je parlerai, tu finiras',
    difficulty: 'Intermédiaire',
    exercises: 18,
    color: 'bg-orange-100 text-orange-800'
  },
  {
    id: 'subjonctif',
    title: 'Le subjonctif présent',
    description: 'Usage et formation du subjonctif',
    example: 'Il faut que je parte',
    difficulty: 'Avancé',
    exercises: 25,
    color: 'bg-red-100 text-red-800'
  },
  {
    id: 'accord-participe',
    title: 'Accord du participe passé',
    description: 'Règles d\'accord avec être et avoir',
    example: 'Elle est venue, les livres que j\'ai lus',
    difficulty: 'Avancé',
    exercises: 22,
    color: 'bg-indigo-100 text-indigo-800'
  }
];

const GrammarTopics = ({ onTopicSelect, userProgress }: GrammarTopicsProps) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Débutant':
        return 'bg-green-100 text-green-800';
      case 'Intermédiaire':
        return 'bg-orange-100 text-orange-800';
      case 'Avancé':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMasteryIcon = (masteryLevel: number) => {
    if (masteryLevel >= 3) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (masteryLevel >= 2) return <Star className="w-5 h-5 text-blue-500" />;
    if (masteryLevel >= 1) return <BookOpen className="w-5 h-5 text-green-500" />;
    return <Clock className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Sujets de grammaire
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explorez les concepts grammaticaux essentiels du français
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic) => {
          const progress = userProgress[topic.id];
          const score = progress?.best_score || 0;
          const masteryLevel = progress?.mastery_level || 0;
          const attempts = progress?.total_attempts || 0;

          return (
            <Card 
              key={topic.id}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
              onClick={() => onTopicSelect(topic)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg text-gray-900">{topic.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={getDifficultyColor(topic.difficulty)}>
                        {topic.difficulty}
                      </Badge>
                      {getMasteryIcon(masteryLevel)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="text-gray-600">
                  {topic.description}
                </CardDescription>
                
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Exemple:</span> {topic.example}
                  </p>
                </div>

                {attempts > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Meilleur score</span>
                      <span className="font-medium text-gray-900">{score}%</span>
                    </div>
                    <Progress value={score} className="h-2" />
                    <p className="text-xs text-gray-500">
                      {attempts} tentative{attempts > 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {topic.exercises} exercices
                  </span>
                  {score > 0 && (
                    <span className="text-green-600 font-medium">
                      {masteryLevel >= 3 ? 'Maîtrisé' : masteryLevel >= 2 ? 'Bon niveau' : 'En cours'}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default GrammarTopics;
