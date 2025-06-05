import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { SupabaseUserManager, UserMistake, UserProfile } from '@/utils/SupabaseUserManager';

const AccountPage = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [mistakes, setMistakes] = useState<UserMistake[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch user info and mistakes from Supabase
    const fetchData = async () => {
      setLoading(true);
      try {
        const user = await SupabaseUserManager.getCurrentUser();
        if (user) {
          setName(user.name);
          setProfile(user);
        }
        const mistakesData = await SupabaseUserManager.getUserMistakes();
        setMistakes(mistakesData);
      } catch (e) {
        toast({ title: 'Erreur', description: 'Impossible de charger le profil ou les erreurs.', variant: 'destructive' });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value);

  const handleSave = async () => {
    try {
      await SupabaseUserManager.updateUserProfile({ name });
      toast({ title: 'Succès', description: 'Nom mis à jour !' });
    } catch (e) {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le nom.', variant: 'destructive' });
    }
  };

  const handleResetScores = async () => {
    try {
      await SupabaseUserManager.resetUserScores();
      toast({ title: 'Succès', description: 'Scores réinitialisés !' });
    } catch (e) {
      toast({ title: 'Erreur', description: 'Impossible de réinitialiser les scores.', variant: 'destructive' });
    }
  };

  // Group mistakes by topic
  const errorDistribution = mistakes.reduce((acc, m) => {
    acc[m.topic_id] = (acc[m.topic_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-xl mx-auto py-10 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Mon compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block mb-2 font-medium">Nom d'utilisateur</label>
            <Input value={name} onChange={handleNameChange} disabled={loading} />
          </div>
          <Button onClick={handleSave} disabled={loading || !name} className="w-full">Enregistrer</Button>
          <hr />
          <Button onClick={handleResetScores} variant="destructive" disabled={loading} className="w-full">Réinitialiser les scores</Button>
        </CardContent>
      </Card>

      {/* User stats */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>Niveau : <span className="font-semibold">{profile.level}</span></div>
            <div>Date de création : <span className="font-semibold">{profile.created_at?.split('T')[0]}</span></div>
          </CardContent>
        </Card>
      )}

      {/* Error distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition des erreurs par sujet</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(errorDistribution).length === 0 ? (
            <div className="text-gray-500">Aucune erreur enregistrée.</div>
          ) : (
            <ul className="space-y-1">
              {Object.entries(errorDistribution).map(([topic, count]) => (
                <li key={topic} className="flex justify-between">
                  <span>{topic.replace(/-/g, ' ')}</span>
                  <span className="font-semibold">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountPage;
