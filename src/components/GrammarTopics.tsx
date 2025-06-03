
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, Check, Star } from 'lucide-react';

const grammarTopics = [
  {
    id: 'si-present-imperatif',
    title: 'Si + présent + impératif',
    description: 'Exprimer une hypothèse avec des conseils',
    example: 'Si tu as faim, mange une pomme.',
    difficulty: 'A2',
    exercises: 15,
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'si-present-futur',
    title: 'Si + présent + futur simple',
    description: 'Exprimer une conséquence future',
    example: 'Si tu étudies bien, tu réussiras l\'examen.',
    difficulty: 'A2+',
    exercises: 18,
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'temps-passe',
    title: 'Les temps du passé',
    description: 'Imparfait, Passé Composé, Plus-que-Parfait',
    example: 'Quand j\'étais enfant, je jouais au football.',
    difficulty: 'B1',
    exercises: 25,
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'conditionnel',
    title: 'Le conditionnel',
    description: 'Exprimer un souhait ou un conseil',
    example: 'À ta place, je partirais plus tôt.',
    difficulty: 'B1',
    exercises: 20,
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 'mise-en-relief',
    title: 'La mise en relief',
    description: 'Ce qui/ce que/c\'est/ce sont',
    example: 'Ce qui m\'énerve, c\'est le bruit.',
    difficulty: 'B1',
    exercises: 16,
    color: 'from-red-500 to-red-600'
  },
  {
    id: 'pronoms-interrogatifs',
    title: 'Pronoms interrogatifs',
    description: 'Lequel/laquelle/lesquels/lesquelles',
    example: 'Parmi ces robes, laquelle préfères-tu ?',
    difficulty: 'A2+',
    exercises: 14,
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    id: 'place-adverbe',
    title: 'Place de l\'adverbe',
    description: 'Position correcte des adverbes',
    example: 'Elle va souvent au cinéma.',
    difficulty: 'A2',
    exercises: 12,
    color: 'from-pink-500 to-pink-600'
  }
];

const GrammarTopics = ({ onTopicSelect, userProgress }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'A2': return 'bg-green-100 text-green-800';
      case 'A2+': return 'bg-blue-100 text-blue-800';
      case 'B1': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTopicProgress = (topicId) => {
    return userProgress.topicProgress[topicId] || 0;
  };

  const isTopicCompleted = (topicId) => {
    return getTopicProgress(topicId) >= 80;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Sujets de grammaire
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choisissez un sujet pour commencer vos exercices adaptatifs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {grammarTopics.map((topic, index) => {
          const progress = getTopicProgress(topic.id);
          const isCompleted = isTopicCompleted(topic.id);
          
          return (
            <Card 
              key={topic.id}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer overflow-hidden"
              onClick={() => onTopicSelect(topic)}
            >
              <div className={`h-2 bg-gradient-to-r ${topic.color}`} />
              
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getDifficultyColor(topic.difficulty)}>
                        {topic.difficulty}
                      </Badge>
                      {isCompleted && (
                        <div className="flex items-center space-x-1">
                          <Check className="w-4 h-4 text-green-600" />
                          <Star className="w-4 h-4 text-yellow-500" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                      {topic.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 mt-1">
                      {topic.description}
                    </CardDescription>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 italic">
                    Exemple : "{topic.example}"
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progrès</span>
                    <span className="font-medium text-gray-900">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>{topic.exercises} exercices</span>
                  <span>{Math.round((progress / 100) * topic.exercises)} complétés</span>
                </div>

                <Button 
                  className={`w-full bg-gradient-to-r ${topic.color} hover:opacity-90 text-white`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTopicSelect(topic);
                  }}
                >
                  {progress > 0 ? 'Continuer' : 'Commencer'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default GrammarTopics;
