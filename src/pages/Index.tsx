import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Flame, BookOpen, LogOut } from 'lucide-react';
import GrammarTopics from '@/components/GrammarTopics';
import ExerciseInterface from '@/components/ExerciseInterface';
import ProgressDashboard from '@/components/ProgressDashboard';
import Leaderboard from '@/components/Leaderboard';
import Mistakes from '@/components/Mistakes';
import AccountPage from '@/pages/Account';
import { useAuth } from '@/hooks/useAuth';
import { SupabaseUserManager, UserProfile, UserProgress } from '@/utils/SupabaseUserManager';
import { useToast } from '@/hooks/use-toast';

interface Topic {
  id: string;
  title: string;
  description: string;
  example: string;
  difficulty: string;
  exercises: number;
  color: string;
}

const Index = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [profile, progress] = await Promise.all([
        SupabaseUserManager.getCurrentUser(),
        SupabaseUserManager.getUserProgress()
      ]);
      
      setUserProfile(profile);
      setUserProgress(progress);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos données.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelect = (topic: Topic) => {
    if (!topic) {
      console.error('No topic selected');
      return;
    }
    
    console.log('Selected topic:', topic.id);
    setSelectedTopic(topic);
    
    // Ensure clean state transition
    setTimeout(() => {
      setCurrentView('exercise');
    }, 0);
  };

  const handleExerciseComplete = async (
    score: number, 
    topic: Topic, 
    mistakes?: Array<{question: string, userAnswer: string, correctAnswer: string}>
  ) => {
    try {
      const formattedMistakes = mistakes?.map(mistake => ({
        question: mistake.question,
        userAnswer: mistake.userAnswer,
        correctAnswer: mistake.correctAnswer,
        type: 'grammar' // You can enhance this to detect the actual mistake type
      })) || [];

      await SupabaseUserManager.updateUserProgress(topic.id, score, formattedMistakes);
      
      // Reload user data to show updated progress
      await loadUserData();
      
      toast({
        title: "Exercice terminé !",
        description: `Score: ${score}% - ${mistakes?.length || 0} erreur(s)`,
      });
      
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder votre progression.",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Déconnexion",
        description: "À bientôt sur FrançaisPro !",
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderView = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      );
    }

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
        // Merge userProfile and userProgress for ProgressDashboard
        if (!userProfile) return null;
        const progressDashboardData = {
          ...userProfile,
          totalPoints: Object.values(userProgress).reduce((sum, p) => sum + (p.best_score || 0), 0),
          badges: [], // You can replace this with real badge logic if available
          streak: 0, // You can replace this with real streak logic if available
          topicProgress: Object.fromEntries(
            Object.entries(userProgress).map(([topicId, progress]) => [topicId, progress.best_score || 0])
          )
        };
        return <ProgressDashboard userProgress={progressDashboardData} />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'mistakes':
        return <Mistakes />;
      case 'account':
        return <AccountPage />;
      default:
        return <DashboardView userProfile={userProfile} userProgress={userProgress} setCurrentView={setCurrentView} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

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
                <p className="text-sm text-gray-600">
                  Bonjour, {userProfile?.name} • Niveau {userProfile?.level}
                </p>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-4">
              <Button 
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('dashboard')}
                size="sm"
              >
                Tableau de bord
              </Button>
              <Button 
                variant={currentView === 'topics' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('topics')}
                size="sm"
              >
                Grammaire
              </Button>
              <Button 
                variant={currentView === 'progress' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('progress')}
                size="sm"
              >
                Progrès
              </Button>
              <Button 
                variant={currentView === 'leaderboard' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('leaderboard')}
                size="sm"
              >
                Classement
              </Button>
              <Button 
                variant={currentView === 'mistakes' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('mistakes')}
                size="sm"
              >
                Erreurs
              </Button>
              <Button 
                variant={currentView === 'account' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('account')}
                size="sm"
              >
                Mon compte
              </Button>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold text-gray-900">
                  {Object.values(userProgress).reduce((sum, p) => sum + p.best_score, 0)}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-blue-100">
          <div className="px-4 py-2 flex space-x-2 overflow-x-auto">
            <Button 
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('dashboard')}
              size="sm"
              className="whitespace-nowrap"
            >
              Accueil
            </Button>
            <Button 
              variant={currentView === 'topics' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('topics')}
              size="sm"
              className="whitespace-nowrap"
            >
              Grammaire
            </Button>
            <Button 
              variant={currentView === 'progress' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('progress')}
              size="sm"
              className="whitespace-nowrap"
            >
              Progrès
            </Button>
            <Button 
              variant={currentView === 'leaderboard' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('leaderboard')}
              size="sm"
              className="whitespace-nowrap"
            >
              Classement
            </Button>
            <Button 
              variant={currentView === 'mistakes' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('mistakes')}
              size="sm"
              className="whitespace-nowrap"
            >
              Erreurs
            </Button>
            <Button 
              variant={currentView === 'account' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('account')}
              size="sm"
              className="whitespace-nowrap"
            >
              Mon compte
            </Button>
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
  userProfile: UserProfile | null;
  userProgress: Record<string, UserProgress>;
  setCurrentView: (view: string) => void;
}

const DashboardView = ({ userProfile, userProgress, setCurrentView }: DashboardViewProps) => {
  const progressValues = Object.values(userProgress).map(p => p.best_score);
  const averageProgress = progressValues.length > 0 
    ? progressValues.reduce((a, b) => a + b, 0) / progressValues.length 
    : 0;
  const totalPoints = progressValues.reduce((sum, score) => sum + score, 0);
  const masteredTopics = Object.values(userProgress).filter(p => p.mastery_level >= 3).length;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Bonjour {userProfile?.name} ! Prêt à améliorer votre français ?
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
                <p className="text-2xl font-bold">{userProfile?.level}</p>
              </div>
              <Trophy className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Sujets maîtrisés</p>
                <p className="text-2xl font-bold">{masteredTopics}</p>
              </div>
              <BookOpen className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Points totaux</p>
                <p className="text-2xl font-bold">{totalPoints}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Progrès moyen</p>
                <p className="text-2xl font-bold">{Math.round(averageProgress)}%</p>
              </div>
              <Trophy className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <CardTitle className="text-xl text-gray-900">Voir le classement</CardTitle>
            <CardDescription>
              Comparez vos performances avec d'autres apprenants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setCurrentView('leaderboard')}
              variant="outline"
              className="w-full border-2 border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              Consulter le classement
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Analyser vos erreurs</CardTitle>
            <CardDescription>
              Consultez vos erreurs passées pour mieux progresser
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setCurrentView('mistakes')}
              variant="outline"
              className="w-full border-2 border-red-600 text-red-600 hover:bg-red-50"
            >
              Voir les erreurs
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Progress */}
      {Object.keys(userProgress).length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Progrès par sujet</CardTitle>
            <CardDescription>
              Votre performance dans chaque domaine grammatical
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(userProgress).slice(0, 5).map(([topicId, progress]) => (
              <div key={topicId} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {topicId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className="text-sm text-gray-500">{progress.best_score}%</span>
                </div>
                <Progress value={progress.best_score} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;
