
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, RotateCcw, CheckCircle, TrendingUp, Target } from 'lucide-react';
import { SupabaseUserManager, UserMistake } from '@/utils/SupabaseUserManager';
import { useToast } from '@/hooks/use-toast';

const Mistakes = () => {
  const [mistakes, setMistakes] = useState<UserMistake[]>([]);
  const [personalizedMistakes, setPersonalizedMistakes] = useState<UserMistake[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMistakes();
    loadPersonalizedMistakes();
  }, []);

  const loadMistakes = async () => {
    try {
      setLoading(true);
      const data = await SupabaseUserManager.getUserMistakes();
      setMistakes(data);
    } catch (error) {
      console.error('Error loading mistakes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos erreurs.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalizedMistakes = async () => {
    try {
      const data = await SupabaseUserManager.getPersonalizedMistakes(5);
      setPersonalizedMistakes(data);
    } catch (error) {
      console.error('Error loading personalized mistakes:', error);
    }
  };

  const filteredMistakes = filter === 'all' 
    ? mistakes 
    : mistakes.filter(mistake => mistake.topic_id === filter);

  const uniqueTopics = [...new Set(mistakes.map(mistake => mistake.topic_id))];

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const markAsResolved = async (mistakeId: string) => {
    try {
      await SupabaseUserManager.markMistakeAsResolved(mistakeId);
      await loadMistakes(); // Reload to show updated status
      await loadPersonalizedMistakes(); // Update personalized recommendations
      toast({
        title: "Erreur marquée comme résolue",
        description: "Continuez à pratiquer ce type d'exercice !",
      });
    } catch (error) {
      console.error('Error marking mistake as resolved:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer cette erreur comme résolue.",
        variant: "destructive"
      });
    }
  };

  const getTopicColor = (topic: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ];
    const index = uniqueTopics.indexOf(topic) % colors.length;
    return colors[index];
  };

  const getMistakeStats = () => {
    const totalMistakes = mistakes.length;
    const resolvedMistakes = mistakes.filter(m => m.is_resolved).length;
    const unresolvedMistakes = totalMistakes - resolvedMistakes;
    const resolutionRate = totalMistakes > 0 ? Math.round((resolvedMistakes / totalMistakes) * 100) : 0;

    return { totalMistakes, resolvedMistakes, unresolvedMistakes, resolutionRate };
  };

  const stats = getMistakeStats();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Chargement de vos erreurs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Analyse des erreurs
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Analysez vos erreurs pour mieux progresser et maîtriser le français
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100">Total erreurs</p>
                <p className="text-2xl font-bold">{stats.totalMistakes}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Résolues</p>
                <p className="text-2xl font-bold">{stats.resolvedMistakes}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">À revoir</p>
                <p className="text-2xl font-bold">{stats.unresolvedMistakes}</p>
              </div>
              <Target className="w-8 h-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Taux résolution</p>
                <p className="text-2xl font-bold">{stats.resolutionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personalized Recommendations */}
      {personalizedMistakes.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Recommandations personnalisées
            </CardTitle>
            <CardDescription>
              Erreurs prioritaires à revoir pour améliorer votre français
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {personalizedMistakes.slice(0, 3).map((mistake, index) => (
                <div key={mistake.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <Badge className={getTopicColor(mistake.topic_id)} size="sm">
                      {mistake.topic_id.replace(/-/g, ' ')}
                    </Badge>
                    <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                      {mistake.question}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markAsResolved(mistake.id)}
                    className="ml-3"
                  >
                    Revu
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter and Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Toutes ({mistakes.length})
          </Button>
          {uniqueTopics.map(topic => {
            const count = mistakes.filter(m => m.topic_id === topic).length;
            return (
              <Button
                key={topic}
                variant={filter === topic ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(topic)}
              >
                {topic.replace(/-/g, ' ')} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Mistakes List */}
      {filteredMistakes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            {mistakes.length === 0 ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucune erreur enregistrée
                </h3>
                <p className="text-gray-600">
                  Commencez à faire des exercices pour voir vos erreurs ici et apprendre de vos erreurs.
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucune erreur dans cette catégorie
                </h3>
                <p className="text-gray-600">
                  Parfait ! Vous n'avez fait aucune erreur dans "{filter}".
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMistakes.map((mistake, index) => (
            <Card key={mistake.id} className={`border-l-4 ${mistake.is_resolved ? 'border-l-green-400' : 'border-l-red-400'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-gray-900">
                      Erreur #{filteredMistakes.length - index}
                      {mistake.is_resolved && (
                        <Badge className="ml-2 bg-green-100 text-green-800">Résolue</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={getTopicColor(mistake.topic_id)}>
                        {mistake.topic_id.replace(/-/g, ' ')}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(mistake.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {mistake.is_resolved ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Question :</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                    {mistake.question}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-red-600 mb-2">Votre réponse :</h4>
                    <p className="text-gray-700 bg-red-50 p-3 rounded-md border border-red-200">
                      {mistake.user_answer}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-green-600 mb-2">Réponse correcte :</h4>
                    <p className="text-gray-700 bg-green-50 p-3 rounded-md border border-green-200">
                      {mistake.correct_answer}
                    </p>
                  </div>
                </div>

                {!mistake.is_resolved && (
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsResolved(mistake.id)}
                      className="text-green-600 hover:text-green-700 border-green-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marquer comme comprise
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Learning Tips */}
      {mistakes.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-red-50 border-0">
          <CardHeader>
            <CardTitle className="text-center text-gray-900">
              Conseils pour éviter les erreurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <AlertCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Analysez vos erreurs</h4>
                <p className="text-sm text-gray-600">Comprenez pourquoi vous avez fait cette erreur</p>
              </div>
              <div>
                <RotateCcw className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Refaites l'exercice</h4>
                <p className="text-sm text-gray-600">Pratiquez le même type d'exercice</p>
              </div>
              <div>
                <CheckCircle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Pratiquez régulièrement</h4>
                <p className="text-sm text-gray-600">La répétition aide à mémoriser</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Mistakes;
