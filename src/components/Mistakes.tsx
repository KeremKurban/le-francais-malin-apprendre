
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, RotateCcw, CheckCircle } from 'lucide-react';
import { UserManager, Mistake } from '@/utils/UserManager';

const Mistakes = () => {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const userData = UserManager.getCurrentUser();
    if (userData) {
      setMistakes(userData.mistakes || []);
    }
  }, []);

  const filteredMistakes = filter === 'all' 
    ? mistakes 
    : mistakes.filter(mistake => mistake.topic === filter);

  const uniqueTopics = [...new Set(mistakes.map(mistake => mistake.topic))];

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearMistakes = () => {
    const userData = UserManager.getCurrentUser();
    if (userData) {
      UserManager.updateUserProgress({ mistakes: [] });
      setMistakes([]);
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

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Historique des erreurs
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Analysez vos erreurs pour mieux progresser
        </p>
      </div>

      {/* Filter and Stats */}
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
            const count = mistakes.filter(m => m.topic === topic).length;
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

        {mistakes.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearMistakes}
            className="text-red-600 hover:text-red-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Effacer l'historique
          </Button>
        )}
      </div>

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
            <Card key={mistake.id} className="border-l-4 border-l-red-400">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-gray-900">
                      Erreur #{filteredMistakes.length - index}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={getTopicColor(mistake.topic)}>
                        {mistake.topic.replace(/-/g, ' ')}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(mistake.timestamp)}
                      </div>
                    </div>
                  </div>
                  <AlertCircle className="w-5 h-5 text-red-500 mt-1" />
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
                      {mistake.userAnswer}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-green-600 mb-2">Réponse correcte :</h4>
                    <p className="text-gray-700 bg-green-50 p-3 rounded-md border border-green-200">
                      {mistake.correctAnswer}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
