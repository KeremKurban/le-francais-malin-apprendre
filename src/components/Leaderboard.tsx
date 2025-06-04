
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { SupabaseUserManager, LeaderboardEntry } from '@/utils/SupabaseUserManager';
import { useAuth } from '@/hooks/useAuth';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadLeaderboard();
  }, []);

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
                className={`${getRankColor(position)} ${isCurrentUser ? 'ring-4 ring-blue-400 ring-opacity-50' : ''} transition-all duration-300 hover:shadow-lg`}
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
                        <h3 className={`text-lg font-semibold ${isCurrentUser ? 'text-blue-100' : ''}`}>
                          {entry.name}
                          {isCurrentUser && (
                            <Badge className="ml-2 bg-blue-500 text-white">Vous</Badge>
                          )}
                        </h3>
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
