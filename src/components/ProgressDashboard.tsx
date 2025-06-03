
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Target, TrendingUp, Award, Calendar } from 'lucide-react';

const badgeDefinitions = {
  'beginner': {
    name: 'Débutant',
    description: 'Premier exercice complété',
    icon: Star,
    color: 'bg-yellow-100 text-yellow-800'
  },
  'consistent': {
    name: 'Assidu',
    description: '7 jours consécutifs',
    icon: Calendar,
    color: 'bg-blue-100 text-blue-800'
  },
  'grammar-master': {
    name: 'Maître de grammaire',
    description: '80% dans tous les sujets',
    icon: Award,
    color: 'bg-purple-100 text-purple-800'
  },
  'perfectionist': {
    name: 'Perfectionniste',
    description: '100% dans un sujet',
    icon: Target,
    color: 'bg-green-100 text-green-800'
  }
};

const ProgressDashboard = ({ userProgress }) => {
  const totalTopics = Object.keys(userProgress.topicProgress).length;
  const completedTopics = Object.values(userProgress.topicProgress).filter(progress => progress >= 80).length;
  const averageProgress = Object.values(userProgress.topicProgress).reduce((a, b) => a + b, 0) / totalTopics;

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressLabel = (progress) => {
    if (progress >= 80) return 'Maîtrisé';
    if (progress >= 60) return 'En cours';
    return 'À revoir';
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Tableau de progression
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Suivez vos progrès et célébrez vos réussites
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Niveau</p>
                <p className="text-2xl font-bold">{userProgress.level}</p>
              </div>
              <Trophy className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Sujets maîtrisés</p>
                <p className="text-2xl font-bold">{completedTopics}/{totalTopics}</p>
              </div>
              <Target className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Progression moyenne</p>
                <p className="text-2xl font-bold">{Math.round(averageProgress)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Points totaux</p>
                <p className="text-2xl font-bold">{userProgress.totalPoints}</p>
              </div>
              <Star className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Topic Progress */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Progression par sujet</CardTitle>
            <CardDescription>
              Votre performance détaillée dans chaque domaine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(userProgress.topicProgress).map(([topic, progress]) => {
              const topicName = topic.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              
              return (
                <div key={topic} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{topicName}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getProgressColor(progress).replace('bg-', 'bg-opacity-20 ') + ' text-gray-700'}>
                          {getProgressLabel(progress)}
                        </Badge>
                        <span className="text-sm text-gray-500">{progress}%</span>
                      </div>
                    </div>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Badges */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Badges obtenus</CardTitle>
            <CardDescription>
              Vos récompenses et accomplissements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userProgress.badges.map((badgeId, index) => {
              const badge = badgeDefinitions[badgeId];
              if (!badge) return null;
              
              const IconComponent = badge.icon;
              
              return (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`p-3 rounded-full ${badge.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{badge.name}</h4>
                    <p className="text-sm text-gray-600">{badge.description}</p>
                  </div>
                </div>
              );
            })}
            
            {/* Next Badge */}
            <div className="flex items-center space-x-4 p-4 bg-gray-100 rounded-lg opacity-60">
              <div className="p-3 rounded-full bg-gray-300">
                <Target className="w-6 h-6 text-gray-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-700">Perfectionniste</h4>
                <p className="text-sm text-gray-500">Obtenez 100% dans un sujet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Streak */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Série d'apprentissage</CardTitle>
          <CardDescription>
            Maintenez votre motivation avec une pratique quotidienne
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-8 py-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600">{userProgress.streak}</div>
              <p className="text-sm text-gray-600 mt-1">Jours consécutifs</p>
            </div>
            <div className="flex space-x-2">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full ${
                    i < userProgress.streak % 7 
                      ? 'bg-orange-500' 
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600">
              {userProgress.streak >= 7 
                ? `Fantastique ! Vous avez maintenu votre série pendant ${userProgress.streak} jours !`
                : `Plus que ${7 - (userProgress.streak % 7)} jour(s) pour obtenir le badge "Assidu" !`
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressDashboard;
