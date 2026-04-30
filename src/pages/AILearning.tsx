/**
 * The main AI-powered learning page.
 * Manages session lifecycle and routes between: setup → topic map / practice / mock exam.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { api, Session, Topic } from '@/api/backendClient';
import { useBackendAuth } from '@/hooks/useBackendAuth';
import SessionSetup from '@/components/SessionSetup';
import AIExerciseInterface from '@/components/AIExerciseInterface';
import TopicMap from '@/components/TopicMap';
import MockExam from '@/components/MockExam';
import AIProgressDashboard from '@/components/AIProgressDashboard';
import { useToast } from '@/hooks/use-toast';

type View = 'setup' | 'topic_map' | 'practice' | 'mock_exam' | 'dashboard';

interface SessionConfig {
  examType: string;
  level: string;
  mode: 'practice' | 'mock_exam';
}

export default function AILearning() {
  const { ready, error: authError } = useBackendAuth();
  const [view, setView] = useState<View>('setup');
  const [session, setSession] = useState<Session | null>(null);
  const [config, setConfig] = useState<SessionConfig | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const { toast } = useToast();

  const handleStart = async (cfg: SessionConfig) => {
    setConfig(cfg);
    setCreatingSession(true);
    try {
      const s = await api.createSession({
        exam_type: cfg.examType,
        mode: cfg.mode === 'mock_exam' ? 'mock_exam' : 'writing',
        level: cfg.level,
      });
      setSession(s);
      if (cfg.mode === 'mock_exam') {
        setView('mock_exam');
      } else {
        setView('topic_map');
      }
    } catch (e: unknown) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Impossible de créer la session',
        variant: 'destructive',
      });
    } finally {
      setCreatingSession(false);
    }
  };

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    setView('practice');
  };

  const handleComplete = async (score: number) => {
    if (session) {
      try {
        await api.endSession(session.id);
      } catch {
        // Non-critical
      }
    }
    toast({
      title: 'Session terminée',
      description: `Score final : ${score}%`,
    });
    setView('dashboard');
  };

  const reset = () => {
    setSession(null);
    setConfig(null);
    setSelectedTopic(null);
    setView('setup');
  };

  if (!ready) {
    if (authError) {
      return (
        <Card className="border-red-200">
          <CardContent className="py-8 text-center">
            <p className="text-red-600 mb-4">
              Impossible de se connecter au serveur IA : {authError}
            </p>
            <p className="text-sm text-gray-500">
              Vérifiez que le backend est démarré (docker-compose up).
            </p>
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin w-6 h-6 text-blue-600 mr-3" />
        <span className="text-gray-600">Connexion au serveur IA…</span>
      </div>
    );
  }

  if (creatingSession) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin w-6 h-6 text-blue-600 mr-3" />
        <span className="text-gray-600">Préparation de votre session…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top nav for active session */}
      {session && (
        <div className="flex items-center gap-3 border-b pb-4">
          <Button
            variant={view === 'topic_map' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('topic_map')}
          >
            Carte des thèmes
          </Button>
          <Button
            variant={view === 'practice' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('practice')}
          >
            Exercice IA
          </Button>
          <Button
            variant={view === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('dashboard')}
          >
            Mes progrès
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={reset}>
            Nouvelle session
          </Button>
        </div>
      )}

      {view === 'setup' && <SessionSetup onStart={handleStart} />}

      {view === 'topic_map' && session && config && (
        <TopicMap onTopicSelect={handleTopicSelect} />
      )}

      {view === 'practice' && session && config && (
        <AIExerciseInterface
          sessionId={session.id}
          examType={config.examType}
          level={config.level}
          topicId={selectedTopic?.id}
          onComplete={handleComplete}
          onBack={() => setView('topic_map')}
        />
      )}

      {view === 'mock_exam' && session && config && (
        <MockExam
          sessionId={session.id}
          examType={config.examType}
          level={config.level}
          onComplete={handleComplete}
          onBack={reset}
        />
      )}

      {view === 'dashboard' && (
        <div className="space-y-4">
          <AIProgressDashboard />
          <div className="flex justify-center">
            <Button onClick={reset}>Nouvelle session</Button>
          </div>
        </div>
      )}
    </div>
  );
}
