import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Loader2, Send, RotateCcw, MessageSquare } from 'lucide-react';
import { api, Exercise, EvaluationResult, NextStep, AsyncEvaluationStatus } from '@/api/backendClient';
import { useToast } from '@/hooks/use-toast';
import EvaluationFeedback from './EvaluationFeedback';
import ExerciseRenderer from './exercises/ExerciseRenderer';
import { cn } from '@/lib/utils';

interface AIExerciseInterfaceProps {
  sessionId: string;
  examType: string;
  level: string;
  topicId?: string;
  onComplete: (score: number) => void;
  onBack: () => void;
}

type Phase = 'exercise' | 'evaluating' | 'feedback' | 'next_step' | 'finishing';

type ExercisePool = 'fresh' | 'history';

interface PendingEvaluation {
  evaluationId: string;
  exerciseId: string;
  exercisePrompt: string;
}

interface ExercisePersistedState {
  phase: Phase;
  exercise: Exercise | null;
  userResponse: string;
  evaluation: EvaluationResult | null;
  attemptNumber: number;
  sessionScore: number[];
  exercisePool?: ExercisePool;
}

const EXERCISE_STATE_KEY = 'ai_exercise_state';

function loadPersistedExerciseState(sessionId: string): ExercisePersistedState | null {
  try {
    const raw = localStorage.getItem(EXERCISE_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.sessionId === sessionId ? parsed.state : null;
  } catch {
    return null;
  }
}

export default function AIExerciseInterface({
  sessionId,
  examType,
  level,
  topicId,
  onComplete,
  onBack,
}: AIExerciseInterfaceProps) {
  const persisted = loadPersistedExerciseState(sessionId);
  const { toast } = useToast();

  const persistedPool: ExercisePool = persisted?.exercisePool === 'history' ? 'history' : 'fresh';

  const [phase, setPhase] = useState<Phase>(persisted?.phase ?? 'exercise');
  const [exercise, setExercise] = useState<Exercise | null>(persisted?.exercise ?? null);
  const [userResponse, setUserResponse] = useState(persisted?.userResponse ?? '');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(persisted?.evaluation ?? null);
  const [attemptNumber, setAttemptNumber] = useState(persisted?.attemptNumber ?? 1);
  const [sessionScore, setSessionScore] = useState<number[]>(persisted?.sessionScore ?? []);
  const [exercisePool, setExercisePool] = useState<ExercisePool>(persistedPool);
  const [loadingExercise, setLoadingExercise] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingEvaluations, setPendingEvaluations] = useState<PendingEvaluation[]>([]);
  const pollingIntervals = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  useEffect(() => {
    return () => {
      pollingIntervals.current.forEach(interval => clearInterval(interval));
      pollingIntervals.current.clear();
    };
  }, []);

  useEffect(() => {
    if (phase === 'evaluating' || phase === 'finishing') return;
    localStorage.setItem(EXERCISE_STATE_KEY, JSON.stringify({
      sessionId,
      state: {
        phase,
        exercise,
        userResponse,
        evaluation,
        attemptNumber,
        sessionScore,
        exercisePool,
      },
    }));
  }, [phase, exercise, userResponse, evaluation, attemptNumber, sessionScore, sessionId, exercisePool]);

  const fetchExercise = async (
    exerciseType = 'writing_prompt',
    options?: { context?: string; pool?: ExercisePool },
  ) => {
    const pool = options?.pool ?? exercisePool;
    setLoadingExercise(true);
    setError(null);
    setUserResponse('');
    setEvaluation(null);
    setAttemptNumber(1);
    localStorage.removeItem(EXERCISE_STATE_KEY);
    try {
      const ex = await api.generateExercise({
        exam_type: examType,
        level,
        exercise_type: exerciseType,
        mode: 'writing',
        topic_id: topicId,
        context: options?.context,
        exercise_pool: pool,
      });
      setExercise(ex);
      setPhase('exercise');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement');
    } finally {
      setLoadingExercise(false);
    }
  };

  const startPollingEvaluation = (evaluationId: string) => {
    if (pollingIntervals.current.has(evaluationId)) return;

    const interval = setInterval(async () => {
      try {
        const status: AsyncEvaluationStatus = await api.getEvaluationStatus(evaluationId);
        if (status.status === 'done' || status.status === 'failed') {
          clearInterval(interval);
          pollingIntervals.current.delete(evaluationId);

          setPendingEvaluations(prev => prev.filter(p => p.evaluationId !== evaluationId));

          if (status.status === 'done' && status.result) {
            setSessionScore(prev => [...prev, status.result!.score]);
            setEvaluation(status.result);
            setPhase('feedback');
            toast({
              title: 'Évaluation prête',
              description: `Score : ${Math.round(status.result.score)}%`,
            });
          }
        }
      } catch {
        // Ignore polling errors silently
      }
    }, 2000);

    pollingIntervals.current.set(evaluationId, interval);
  };

  const submitResponse = async () => {
    if (!exercise || !userResponse.trim()) return;
    setPhase('evaluating');
    setError(null);

    try {
      const { evaluation_id } = await api.evaluateAsync({
        exercise_id: exercise.id,
        session_id: sessionId,
        response_content: userResponse,
        attempt_number: attemptNumber,
      });

      const pending: PendingEvaluation = {
        evaluationId: evaluation_id,
        exerciseId: exercise.id,
        exercisePrompt: exercise.prompt,
      };
      setPendingEvaluations(prev => [...prev, pending]);
      startPollingEvaluation(evaluation_id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'envoi");
      setPhase('exercise');
    }
  };

  const handleFinish = async () => {
    if (pendingEvaluations.length > 0) {
      setPhase('finishing');
      const deadline = Date.now() + 30_000;
      while (pendingEvaluations.length > 0 && Date.now() < deadline) {
        await new Promise(res => setTimeout(res, 500));
      }
    }
    localStorage.removeItem(EXERCISE_STATE_KEY);
    const avg = sessionScore.length
      ? Math.round(sessionScore.reduce((a, b) => a + b, 0) / sessionScore.length)
      : 0;
    onComplete(avg);
  };

  const handleNextStep = async (step: NextStep) => {
    switch (step.type) {
      case 'reformulate':
        setUserResponse('');
        setAttemptNumber(prev => prev + 1);
        setPhase('exercise');
        break;
      case 'retry':
        setUserResponse('');
        setAttemptNumber(prev => prev + 1);
        setPhase('exercise');
        break;
      case 'variation':
        await fetchExercise('writing_prompt', { context: step.exercise_hint, pool: 'fresh' });
        break;
      case 'mini_role_play':
        await fetchExercise('role_play', { context: step.exercise_hint, pool: 'fresh' });
        break;
      case 'grammar_focus':
        await fetchExercise('grammar_correction', { context: step.exercise_hint, pool: 'fresh' });
        break;
      default:
        await fetchExercise('writing_prompt', { pool: 'fresh' });
    }
  };

  const averageScore = sessionScore.length
    ? Math.round(sessionScore.reduce((a, b) => a + b, 0) / sessionScore.length)
    : 0;

  const loadingHint =
    exercisePool === 'history'
      ? 'Recherche dans vos exercices déjà vus…'
      : 'Génération du nouvel exercice…';

  if (phase === 'finishing') {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <Loader2 className="animate-spin w-8 h-8 mx-auto text-blue-600 mb-4" />
        <p className="text-gray-600">Finalisation…</p>
        <p className="text-sm text-gray-400">
          {pendingEvaluations.length} évaluation{pendingEvaluations.length > 1 ? 's' : ''} en attente
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem(EXERCISE_STATE_KEY); onBack(); }}>←</Button>
          <Badge variant="outline">{examType}</Badge>
          <Badge variant="outline">{level}</Badge>
          {exercise && <Badge variant="outline">{exercise.difficulty}</Badge>}
          {pendingEvaluations.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {pendingEvaluations.length} éval. en cours…
            </Badge>
          )}
        </div>
        {sessionScore.length > 0 && (
          <div className="text-sm text-gray-600">
            Score moyen : <span className="font-bold">{averageScore}%</span>
            {' '}({sessionScore.length} réponse{sessionScore.length > 1 ? 's' : ''})
          </div>
        )}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-red-700 text-sm">{error}</CardContent>
        </Card>
      )}

      {!exercise && !loadingExercise && (
        <Card className="border-emerald-100 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Prêt pour un exercice ?</CardTitle>
            <CardDescription>
              Choisissez la source, puis générez quand vous voulez — aucune requête n’est envoyée avant le bouton vert.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3 flex-1">
                <span className="text-sm font-medium text-gray-700">Source des sujets</span>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      'text-sm transition-colors',
                      exercisePool === 'history' ? 'font-semibold text-gray-900' : 'text-muted-foreground',
                    )}
                  >
                    Déjà vus
                  </span>
                  <Switch
                    checked={exercisePool === 'fresh'}
                    onCheckedChange={checked => setExercisePool(checked ? 'fresh' : 'history')}
                    aria-label="Basculer entre exercices déjà vus et nouveaux"
                  />
                  <span
                    className={cn(
                      'text-sm transition-colors',
                      exercisePool === 'fresh' ? 'font-semibold text-gray-900' : 'text-muted-foreground',
                    )}
                  >
                    Nouveau (IA)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                  {exercisePool === 'history'
                    ? 'Un sujet tiré au hasard parmi ceux que vous avez déjà eus (même examen, niveau et type — filtré par le thème si vous en avez choisi un).'
                    : 'Un nouveau sujet généré par l’IA, enregistré en base pour être réutilisable par d’autres apprenants.'}
                </p>
              </div>
              <Button
                type="button"
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white shrink-0 px-8"
                onClick={() => void fetchExercise()}
              >
                Générer l’exercice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loadingExercise && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="animate-spin w-8 h-8 mx-auto text-emerald-600 mb-4" />
            <p className="text-gray-600">{loadingHint}</p>
          </CardContent>
        </Card>
      )}

      {exercise && !loadingExercise && phase !== 'feedback' && (
        <>
          <Card className="border-blue-100 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {exercise.exercise_type === 'writing_prompt' && 'Production écrite'}
                    {exercise.exercise_type === 'role_play' && 'Jeu de rôle'}
                    {exercise.exercise_type === 'grammar_correction' && 'Correction grammaticale'}
                    {exercise.exercise_type === 'fill_blank' && 'Texte à trous'}
                    {exercise.exercise_type === 'translation' && 'Traduction'}
                  </CardTitle>
                  {exercise.context && (
                    <CardDescription className="mt-1 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      📍 {exercise.context}
                    </CardDescription>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void fetchExercise(exercise.exercise_type)}
                  title="Autre exercice (même mode que la barre ci-dessus)"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {exercise.content ? (
                <ExerciseRenderer
                  content={exercise.content}
                  onAnswerChange={setUserResponse}
                  answer={userResponse}
                  showResult={phase === 'feedback'}
                />
              ) : (
                <p className="text-gray-900 font-medium leading-relaxed whitespace-pre-wrap">
                  {exercise.prompt}
                </p>
              )}
              {attemptNumber > 1 && (
                <p className="mt-2 text-sm text-amber-600">
                  Tentative {attemptNumber} — réessayez en tenant compte des corrections précédentes.
                </p>
              )}
            </CardContent>
          </Card>

          {(phase === 'exercise' || phase === 'evaluating') && !exercise.content && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Votre réponse</span>
                </div>
                <Textarea
                  value={userResponse}
                  onChange={e => setUserResponse(e.target.value)}
                  placeholder="Écrivez votre réponse ici…"
                  className="min-h-[140px] resize-none text-base"
                  disabled={phase === 'evaluating'}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{userResponse.length} caractères</span>
                  <div className="flex gap-2">
                    {sessionScore.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={handleFinish}
                        disabled={phase === 'evaluating'}
                      >
                        Terminer
                      </Button>
                    )}
                    <Button
                      onClick={submitResponse}
                      disabled={!userResponse.trim() || phase === 'evaluating'}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {phase === 'evaluating' ? (
                        <>
                          <Loader2 className="animate-spin w-4 h-4 mr-2" />
                          Envoi…
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Soumettre
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(phase === 'exercise' || phase === 'evaluating') && exercise.content && (
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{userResponse.length} caractères</span>
                  <div className="flex gap-2">
                    {sessionScore.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={handleFinish}
                        disabled={phase === 'evaluating'}
                      >
                        Terminer
                      </Button>
                    )}
                    <Button
                      onClick={submitResponse}
                      disabled={!userResponse.trim() || phase === 'evaluating'}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {phase === 'evaluating' ? (
                        <>
                          <Loader2 className="animate-spin w-4 h-4 mr-2" />
                          Envoi…
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Soumettre
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {phase === 'evaluating' && (
                  <div className="space-y-2">
                    <Progress value={66} className="h-1" />
                    <p className="text-xs text-gray-500 text-center">Analyse de votre réponse…</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </>
      )}

      {phase === 'feedback' && evaluation && exercise && (
        <EvaluationFeedback
          evaluation={evaluation}
          onNextStep={handleNextStep}
          onNewExercise={() => {
            setExercise(null);
            setEvaluation(null);
            setUserResponse('');
            setAttemptNumber(1);
            setPhase('exercise');
          }}
          onFinish={handleFinish}
        />
      )}
    </div>
  );
}
