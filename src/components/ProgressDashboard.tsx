
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Calendar, TrendingUp } from 'lucide-react';
import { UserProgress } from '@/utils/SupabaseUserManager';

interface ProgressDashboardProps {
  userProgress: Record<string, UserProgress>;
}

const ProgressDashboard = ({ userProgress }: ProgressDashboardProps) => {
  const progressEntries = Object.entries(userProgress);
  
  const totalAttempts = progressEntries.reduce((sum, [_, progress]) => sum + progress.total_attempts, 0);
  const averageScore = progressEntries.length > 0 
    ? progressEntries.reduce((sum, [_, progress]) => sum + progress.best_score, 0) / progressEntries.length 
    : 0;
  const masteredTopics = progressEntries.filter(([_, progress]) => progress.mastery_level >= 3).length;
  const topicsInProgress = progressEntries.filter(([_, progress]) => progress.mastery_level > 0 && progress.mastery_level < 3).length;

  const getMasteryText = (level: number) => {
    switch (level) {
      case 3: return 'Maîtrisé';
      case 2: return 'Bon niveau';
      case 1: return 'Débutant';
      default: return 'Non commencé';
    }
  };

  const getMasteryColor = (level: number) => {
    switch (level) {
      case 3: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 1: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTopicName = (topicId: string) => {
    return topicId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Tableau de progression
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Suivez vos progrès et identifiez vos points forts
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Sujets maîtrisés</p>
                <p className="text-2xl font-bold">{masteredTopics}</p>
              </div>
              <Trophy className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Score moyen</p>
                <p className="text-2xl font-bold">{Math.round(averageScore)}%</p>
              </div>
              <Star className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">En cours</p>
                <p className="text-2xl font-bold">{topicsInProgress}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Total tentatives</p>
                <p className="text-2xl font-bold">{totalAttempts}</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Progress */}
      {progressEntries.length > 0 ? (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Progression détaillée</CardTitle>
            <CardDescription>
              Votre performance dans chaque domaine grammatical
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {progressEntries
              .sort(([,a], [,b]) => new Date(b.last_practiced).getTime() - new Date(a.last_practiced).getTime())
              .map(([topicId, progress]) => (
                <div key={topicId} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium text-gray-900">
                        {formatTopicName(topicId)}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Badge className={getMasteryColor(progress.mastery_level)}>
                          {getMasteryText(progress.mastery_level)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {progress.total_attempts} tentative{progress.total_attempts > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {progress.best_score}%
                      </div>
                      <div className="text-sm text-gray-500">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {formatDate(progress.last_practiced)}
                      </div>
                    </div>
                  </div>
                  <Progress value={progress.best_score} className="h-3" />
                </div>
              ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune progression enregistrée
            </h3>
            <p className="text-gray-600">
              Commencez par faire des exercices pour voir vos progrès ici !
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressDashboard;
