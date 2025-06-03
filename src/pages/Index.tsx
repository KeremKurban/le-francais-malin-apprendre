
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Flame, BookOpen } from 'lucide-react';
import GrammarTopics from '@/components/GrammarTopics';
import ExerciseInterface from '@/components/ExerciseInterface';
import ProgressDashboard from '@/components/ProgressDashboard';

interface Topic {
  id: string;
  title: string;
  description: string;
  example: string;
  difficulty: string;
  exercises: number;
  color: string;
}

interface UserProgress {
  level: string;
  streak: number;
  totalPoints: number;
  badges: string[];
  topicProgress: Record<string, number>;
}

const Index = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    level: 'A2',
    streak: 7,
    totalPoints: 1250,
    badges: ['beginner', 'consistent', 'grammar-master'],
    topicProgress: {
      'si-present-imperatif': 85,
      'si-present-futur': 72,
      'temps-passe': 90,
      'conditionnel': 65,
      'mise-en-relief': 78,
      'pronoms-interrogatifs': 88,
      'place-adverbe': 70,
      'articulateurs-discours': 45,
      'adverbes-ment': 60,
      'hypothese-si': 55,
      'plus-que-parfait': 40,
      'questions-formelles': 68,
      'adjectifs-indefinis': 52,
      'superlatif': 75,
      'formes-interrogation': 63,
      'accord-participe-etre': 58,
      'subjonctif-obligation': 35,
      'genre-noms': 82,
      'marqueurs-temporels': 47,
      'pronoms-cod-coi': 71,
      'structures-comparaison': 66,
      'devoir-imperatif-falloir': 53,
      'negation': 79,
      'pronoms-relatifs': 44,
      'adverbes-lieu': 61
    }
  });

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    setCurrentView('exercise');
  };

  const handleExerciseComplete = (score: number, topic: Topic) => {
    setUserProgress(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + score,
      topicProgress: {
        ...prev.topicProgress,
        [topic.id]: Math.max(prev.topicProgress[topic.id] || 0, score)
      }
    }));
    setCurrentView('dashboard');
  };

  const renderView = () => {
    switch (currentView) {
      case 'topics':
        return <GrammarTopics onTopicSelect={handleTopicSelect} userProgress={userProgress} />;
      case 'exercise':
        return (
          <ExerciseInterface 
            topic={selectedTopic}
            onComplete={handleExerciseComplete}
            onBack={() => setCurrentView('topics')}
          />
        );
      case 'progress':
        return <ProgressDashboard userProgress={userProgress} />;
      default:
        return <DashboardView userProgress={userProgress} setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FrançaisPro</h1>
                <p className="text-sm text-gray-600">Niveau {userProgress.level}</p>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              <Button 
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('dashboard')}
              >
                Tableau de bord
              </Button>
              <Button 
                variant={currentView === 'topics' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('topics')}
              >
                Grammaire
              </Button>
              <Button 
                variant={currentView === 'progress' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('progress')}
              >
                Progrès
              </Button>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-gray-900">{userProgress.streak}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold text-gray-900">{userProgress.totalPoints}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>
    </div>
  );
};

interface DashboardViewProps {
  userProgress: UserProgress;
  setCurrentView: (view: string) => void;
}

const DashboardView = ({ userProgress, setCurrentView }: DashboardViewProps) => {
  const progressValues = Object.values(userProgress.topicProgress) as number[];
  const averageProgress = progressValues.reduce((a: number, b: number) => a + b, 0) / progressValues.length;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Bonjour ! Prêt à améliorer votre français ?
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Maîtrisez la grammaire française avec des exercices adaptatifs pour les niveaux A2/B1
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Niveau actuel</p>
                <p className="text-2xl font-bold">{userProgress.level}</p>
              </div>
              <Trophy className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Série actuelle</p>
                <p className="text-2xl font-bold">{userProgress.streak} jours</p>
              </div>
              <Flame className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Points totaux</p>
                <p className="text-2xl font-bold">{userProgress.totalPoints}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Progrès moyen</p>
                <p className="text-2xl font-bold">{Math.round(averageProgress)}%</p>
              </div>
              <BookOpen className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Continuer l'apprentissage</CardTitle>
            <CardDescription>
              Explorez les sujets de grammaire et pratiquez avec des exercices interactifs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setCurrentView('topics')}
              className="w-full bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700"
            >
              Commencer les exercices
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Suivre vos progrès</CardTitle>
            <CardDescription>
              Consultez vos statistiques détaillées et badges gagnés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setCurrentView('progress')}
              variant="outline"
              className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              Voir les progrès
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Progress */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Progrès par sujet</CardTitle>
          <CardDescription>
            Votre performance dans chaque domaine grammatical
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(userProgress.topicProgress).map(([topic, progress]) => (
            <div key={topic} className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {topic.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
