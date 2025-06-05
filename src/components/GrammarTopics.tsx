import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight } from 'lucide-react';
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

const grammarTopics: Topic[] = [
  // Original topics
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
  
  // New topics from user request
  {
    id: 'articulateurs-discours',
    title: 'Les articulateurs du discours',
    description: 'Structurer et organiser les idées',
    example: 'D\'abord, ensuite, enfin, par conséquent...',
    difficulty: 'B1',
    exercises: 22,
    color: 'from-teal-500 to-teal-600'
  },
  {
    id: 'adverbes-ment',
    title: 'Les adverbes en "-ment"',
    description: 'Formation et usage des adverbes de manière',
    example: 'Elle parle couramment français.',
    difficulty: 'A2+',
    exercises: 16,
    color: 'from-cyan-500 to-cyan-600'
  },
  {
    id: 'hypothese-si',
    title: 'L\'hypothèse avec si (complexe)',
    description: 'Si + imparfait + conditionnel',
    example: 'Si j\'étais riche, j\'achèterais une maison.',
    difficulty: 'B1',
    exercises: 19,
    color: 'from-indigo-500 to-indigo-600'
  },
  {
    id: 'plus-que-parfait',
    title: 'Le plus-que-parfait',
    description: 'Antériorité dans le passé',
    example: 'Il avait mangé avant de partir.',
    difficulty: 'B1',
    exercises: 17,
    color: 'from-violet-500 to-violet-600'
  },
  {
    id: 'questions-formelles',
    title: 'Les questions formelles',
    description: 'Inversion du sujet et registre soutenu',
    example: 'Pourrions-nous vous rencontrer demain ?',
    difficulty: 'B1',
    exercises: 14,
    color: 'from-pink-500 to-pink-600'
  },
  {
    id: 'adjectifs-indefinis',
    title: 'Les adjectifs indéfinis',
    description: 'Tout, tous, quelques, plusieurs, certains',
    example: 'Quelques personnes sont venues.',
    difficulty: 'A2+',
    exercises: 18,
    color: 'from-rose-500 to-rose-600'
  },
  {
    id: 'superlatif',
    title: 'Le superlatif',
    description: 'Le plus, le moins, le mieux',
    example: 'C\'est le livre le plus intéressant.',
    difficulty: 'A2+',
    exercises: 15,
    color: 'from-amber-500 to-amber-600'
  },
  {
    id: 'pronoms-cod-coi',
    title: 'Les pronoms COD/COI',
    description: 'Le, la, les, lui, leur, en, y',
    example: 'Je lui ai donné le livre.',
    difficulty: 'B1',
    exercises: 24,
    color: 'from-emerald-500 to-emerald-600'
  },
  {
    id: 'subjonctif-obligation',
    title: 'Le subjonctif et l\'obligation',
    description: 'Il faut que, il est nécessaire que',
    example: 'Il faut que tu viennes demain.',
    difficulty: 'B1+',
    exercises: 21,
    color: 'from-red-500 to-red-600'
  },
  {
    id: 'marqueurs-temporels',
    title: 'Les marqueurs temporels',
    description: 'Il y a, pendant, depuis, dans',
    example: 'Je l\'ai vu il y a trois jours.',
    difficulty: 'A2+',
    exercises: 16,
    color: 'from-lime-500 to-lime-600'
  },
  {
    id: 'pronoms-relatifs',
    title: 'Les pronoms relatifs',
    description: 'Qui, que, dont, où, lequel, avec qui',
    example: 'L\'homme dont je parle est médecin.',
    difficulty: 'B1',
    exercises: 23,
    color: 'from-sky-500 to-sky-600'
  },
  {
    id: 'negation',
    title: 'La négation',
    description: 'Ne...pas, ne...plus, ne...jamais, ne...rien',
    example: 'Je ne vois personne.',
    difficulty: 'A2',
    exercises: 17,
    color: 'from-slate-500 to-slate-600'
  }
];

const GrammarTopics = ({ onTopicSelect, userProgress }: GrammarTopicsProps) => {
  if (!grammarTopics || grammarTopics.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600">Les sujets de grammaire sont en cours de chargement...</p>
      </div>
    );
  }

  const handleTopicClick = (topic: Topic, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Ensure we have valid topic data before navigating
    if (topic && topic.id) {
      console.log('Navigating to topic:', topic.id);
      onTopicSelect(topic);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Sujets de grammaire
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choisissez un sujet pour commencer vos exercices adaptatifs avec des textes longs et complexes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {grammarTopics.map((topic) => {
          const progress = userProgress[topic.id]?.topicProgress?.[topic.id] || 0;

          return (
            <Card 
              key={topic.id}
              className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                      {topic.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 mt-1">
                      {topic.description}
                    </CardDescription>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
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
                  <Badge variant="outline">{topic.difficulty}</Badge>
                  <span>{topic.exercises} exercices</span>
                </div>

                <Button 
                  className={`w-full bg-gradient-to-r ${topic.color} hover:opacity-90 text-white`}
                  onClick={(e) => handleTopicClick(topic, e)}
                >
                  {progress >= 100 ? 'Pratiquer à nouveau' : progress > 0 ? 'Continuer' : 'Commencer'}
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
