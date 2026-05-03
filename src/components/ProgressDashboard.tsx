
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Target, TrendingUp, Award, Calendar, Flame } from 'lucide-react';

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

interface UserProgress {
  id: string;
  name: string;
  level: string;
  created_at: string;
  updated_at: string;
  totalPoints: number;
  badges: string[];
  streak: number;
  topicProgress: Record<string, number>;
}

interface ProgressDashboardProps {
  userProgress: UserProgress;
  onGoToExercise?: () => void;
}

/** Derive a mock XP level from total points (100 XP per level, max shown cap at 300) */
function deriveXpLevel(points: number): { level: number; current: number; target: number } {
  const xpPerLevel = 100;
  const level = Math.floor(points / xpPerLevel) + 1;
  const current = points % xpPerLevel;
  const target = xpPerLevel;
  return { level, current, target };
}

const ProgressDashboard = ({ userProgress, onGoToExercise }: ProgressDashboardProps) => {
  const totalTopics = Object.keys(userProgress.topicProgress).length;
  const completedTopics = Object.values(userProgress.topicProgress).filter((progress: number) => progress >= 80).length;
  const averageProgress = totalTopics > 0 ? Object.values(userProgress.topicProgress).reduce((a: number, b: number) => a + b, 0) / totalTopics : 0;

  const xp = deriveXpLevel(userProgress.totalPoints);
  const xpFillPct = Math.round((xp.current / xp.target) * 100);

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressLabel = (progress: number) => {
    if (progress >= 80) return 'Maîtrisé';
    if (progress >= 60) return 'En cours';
    return 'À revoir';
  };

  return (
    <div className="space-y-8 page-enter">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          Tableau de progression
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Suivez vos progrès et célébrez vos réussites
        </p>
      </div>

      {/* ── Streak + XP bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Streak counter */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <Flame className="w-8 h-8 text-orange-100" />
            </div>
            <div>
              <p className="text-orange-100 text-sm font-medium uppercase tracking-wide">Série en cours</p>
              <p className="text-4xl font-extrabold leading-none mt-1">
                {userProgress.streak}
                <span className="text-xl font-semibold ml-1">jour{userProgress.streak !== 1 ? 's' : ''}</span>
              </p>
              <p className="text-orange-200 text-xs mt-1">
                {userProgress.streak >= 7
                  ? 'Fantastique — continuez !'
                  : `Encore ${7 - (userProgress.streak % 7)} jour(s) pour le badge "Assidu"`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* XP level bar */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 flex flex-col justify-between h-full gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Niveau {xp.level}
              </span>
              <Badge variant="outline" className="text-[#0055A4] border-[#0055A4]">
                {xp.current} / {xp.target} XP
              </Badge>
            </div>
            <div className="relative h-4 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[#0055A4] transition-all duration-700 ease-out"
                style={{ width: `${xpFillPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {xp.target - xp.current} XP pour atteindre le niveau {xp.level + 1}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white touch-manipulation">
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

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white touch-manipulation">
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

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white touch-manipulation">
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

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white touch-manipulation">
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
        {/* Topic Progress — staggered skill bars */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Progression par sujet</CardTitle>
            <CardDescription>
              Votre performance détaillée dans chaque domaine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {totalTopics === 0 ? (
              <div className="text-center py-10 space-y-3">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-3xl">
                  📚
                </div>
                <p className="font-semibold text-gray-800">Aucun sujet commencé</p>
                <p className="text-sm text-gray-500">
                  Complétez votre premier exercice pour voir votre progression ici.
                </p>
                {onGoToExercise && (
                  <Button
                    size="sm"
                    className="bg-[#0055A4] hover:bg-[#003d7a] text-white mt-2"
                    onClick={onGoToExercise}
                  >
                    Commencer un exercice
                  </Button>
                )}
              </div>
            ) : (
              Object.entries(userProgress.topicProgress).map(([topic, progress], idx) => {
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
                    {/* Staggered animated progress bar */}
                    <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getProgressColor(progress)} skill-bar`}
                        style={{
                          animationDelay: `${idx * 0.1}s`,
                          width: `${progress}%`,
                        } as React.CSSProperties}
                      />
                    </div>
                  </div>
                );
              })
            )}
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
              const badge = badgeDefinitions[badgeId as keyof typeof badgeDefinitions];
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

            {userProgress.badges.length === 0 && (
              <div className="text-center py-8 space-y-3">
                <div className="mx-auto w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center text-3xl">
                  🏅
                </div>
                <p className="font-semibold text-gray-800">Pas encore de badges</p>
                <p className="text-sm text-gray-500">
                  Continuez à pratiquer pour débloquer vos premières récompenses !
                </p>
                {onGoToExercise && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#0055A4] text-[#0055A4] hover:bg-blue-50 mt-2"
                    onClick={onGoToExercise}
                  >
                    Aller aux exercices
                  </Button>
                )}
              </div>
            )}

            {/* Next Badge hint */}
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

      {/* Streak week view */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Série d'apprentissage
          </CardTitle>
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
                  className={`w-8 h-8 rounded-full transition-colors ${
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
