
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, Crown, TrendingUp, Star, Users } from 'lucide-react';
import { SupabaseUserManager, LeaderboardEntry } from '@/utils/SupabaseUserManager';
import { useAuth } from '@/hooks/useAuth';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');
  const { user } = useAuth();

  useEffect(() => {
    loadLeaderboard();
  }, [timeFilter]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await SupabaseUserManager.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Trophy className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <Award className="w-6 h-6 text-gray-300" />;
    }
  };

  const getRankColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getRankBadge = (position: number) => {
    if (position <= 3) {
      return (
        <Badge className={`${getRankColor(position)} border-0`}>
          Top {position}
        </Badge>
      );
    }
    return null;
  };

  const getCurrentUserRank = () => {
    const userIndex = leaderboard.findIndex(entry => entry.id === user?.id);
    return userIndex !== -1 ? userIndex + 1 : null;
  };

  const getLeaderboardStats = () => {
    const totalUsers = leaderboard.length;
    const avgScore = totalUsers > 0 
      ? Math.round(leaderboard.reduce((sum, entry) => sum + entry.total_score, 0) / totalUsers)
      : 0;
    const topScore = totalUsers > 0 ? leaderboard[0]?.total_score || 0 : 0;
    
    return { totalUsers, avgScore, topScore };
  };

  const stats = getLeaderboardStats();
  const currentUserRank = getCurrentUserRank();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Chargement du classement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Classement des apprenants
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Découvrez les meilleurs apprenants de français et suivez votre progression
        </p>
        {currentUserRank && (
          <div className="mt-4">
            <Badge className="bg-blue-100 text-blue-800 text-lg px-4 py-2">
              Votre position: #{currentUserRank}
            </Badge>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total apprenants</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Score moyen</p>
                <p className="text-2xl font-bold">{stats.avgScore}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Meilleur score</p>
                <p className="text-2xl font-bold">{stats.topScore}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Filter */}
      <div className="flex justify-center space-x-2">
        <Button
          variant={timeFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimeFilter('all')}
        >
          Tout temps
        </Button>
        <Button
          variant={timeFilter === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimeFilter('week')}
        >
          Cette semaine
        </Button>
        <Button
          variant={timeFilter === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimeFilter('month')}
        >
          Ce mois
        </Button>
      </div>

      {leaderboard.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun classement disponible
            </h3>
            <p className="text-gray-600">
              Soyez le premier à apparaître dans le classement en complétant des exercices !
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {leaderboard.map((entry, index) => {
            const position = index + 1;
            const isCurrentUser = entry.id === user?.id;
            
            return (
              <Card 
                key={entry.id} 
                className={`${getRankColor(position)} ${isCurrentUser ? 'ring-4 ring-blue-400 ring-opacity-50 transform scale-105' : ''} transition-all duration-300 hover:shadow-lg`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        {getRankIcon(position)}
                        <div className="text-2xl font-bold">
                          #{position}
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className={`text-lg font-semibold ${isCurrentUser ? 'text-blue-100' : ''}`}>
                            {entry.name}
                          </h3>
                          {isCurrentUser && (
                            <Badge className="bg-blue-500 text-white">Vous</Badge>
                          )}
                          {getRankBadge(position)}
                        </div>
                        <p className={`text-sm ${position <= 3 ? 'text-white/80' : 'text-gray-500'}`}>
                          Niveau {entry.level} • {entry.mastered_topics} sujets maîtrisés
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${position <= 3 ? 'text-white' : 'text-gray-900'}`}>
                        {entry.total_score}
                      </div>
                      <p className={`text-sm ${position <= 3 ? 'text-white/80' : 'text-gray-500'}`}>
                        points
                      </p>
                      <div className="flex items-center justify-end mt-1">
                        {Array.from({ length: Math.min(5, Math.floor(entry.total_score / 100)) }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${position <= 3 ? 'text-white' : 'text-yellow-400'} fill-current`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* User's Position Card (if not in top 10) */}
      {currentUserRank && currentUserRank > 10 && (
        <Card className="border-2 border-blue-400 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-center text-blue-800">
              Votre position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                #{currentUserRank}
              </div>
              <p className="text-blue-700">
                Continuez à vous entraîner pour améliorer votre classement !
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips Section */}
      {leaderboard.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-red-50 border-0">
          <CardHeader>
            <CardTitle className="text-center text-gray-900">
              Conseils pour grimper dans le classement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Complétez des exercices</h4>
                <p className="text-sm text-gray-600">Gagnez des points en réussissant les exercices</p>
              </div>
              <div>
                <Medal className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Maîtrisez les sujets</h4>
                <p className="text-sm text-gray-600">Obtenez 80% ou plus dans chaque domaine</p>
              </div>
              <div>
                <Award className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Pratiquez régulièrement</h4>
                <p className="text-sm text-gray-600">Maintenez une série quotidienne</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Leaderboard;
