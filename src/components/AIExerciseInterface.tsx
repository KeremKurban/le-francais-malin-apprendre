import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Loader2, Send, RotateCcw, MessageSquare } from 'lucide-react';
import { api, Exercise, EvaluationResult, NextStep } from '@/api/backendClient';
import EvaluationFeedback from './EvaluationFeedback';
import { SkeletonCard } from '@/components/ui/SkeletonCard';

interface AIExerciseInterfaceProps {
  sessionId: string;
  examType: string;
  level: string;
  topicId?: string;
  onComplete: (score: number) => void;
  onBack: () => void;
}

type Phase = 'exercise' | 'evaluating' | 'feedback' | 'next_step';

interface ExercisePersistedState {
  phase: Phase;
  exercise: Exercise | null;
  userResponse: string;
  evaluation: EvaluationResult | null;
  attemptNumber: number;
  sessionScore: number[];
}

const EXERCISE_STATE_KEY = 'ai_exercise_state';
/** Minimum recommended character count for a "sufficient" answer */
const MIN_RESPONSE_CHARS = 60;

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

/** Return a left-border accent class based on exercise difficulty */
function difficultyBorderClass(difficulty?: string): string {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
    case 'facile':
      return 'border-l-4 border-l-green-400';
    case 'medium':
    case 'moyen':
    case 'intermédiaire':
      return 'border-l-4 border-l-yellow-400';
    case 'hard':
    case 'difficile':
      return 'border-l-4 border-l-red-400';
    default:
      return 'border-l-4 border-l-blue-200';
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

  const [phase, setPhase] = useState<Phase>(persisted?.phase ?? 'exercise');
  const [exercise, setExercise] = useState<Exercise | null>(persisted?.exercise ?? null);
  const [userResponse, setUserResponse] = useState(persisted?.userResponse ?? '');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(persisted?.evaluation ?? null);
  const [attemptNumber, setAttemptNumber] = useState(persisted?.attemptNumber ?? 1);
  const [sessionScore, setSessionScore] = useState<number[]>(persisted?.sessionScore ?? []);
  const [loadingExercise, setLoadingExercise] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Persist exercise state to survive tab switches
  useEffect(() => {
    if (phase === 'evaluating') return;
    localStorage.setItem(EXERCISE_STATE_KEY, JSON.stringify({
      sessionId,
      state: { phase, exercise, userResponse, evaluation, attemptNumber, sessionScore },
    }));
  }, [phase, exercise, userResponse, evaluation, attemptNumber, sessionScore, sessionId]);

  useEffect(() => {
    if (!persisted?.exercise) {
      loadExercise('writing_prompt');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate in the feedback panel when it becomes visible
  useEffect(() => {
    if (phase === 'feedback') {
      // Small delay so the DOM transition fires
      const id = setTimeout(() => setFeedbackOpen(true), 30);
      return () => clearTimeout(id);
    } else {
      setFeedbackOpen(false);
    }
  }, [phase]);

  const loadExercise = async (exerciseType = 'writing_prompt', context?: string) => {
    setLoadingExercise(true);
    setError(null);
    setUserResponse('');
    setEvaluation(null);
    setAttemptNumber(1);
    setFeedbackOpen(false);
    localStorage.removeItem(EXERCISE_STATE_KEY);
    try {
      const ex = await api.generateExercise({
        exam_type: examType,
        level,
        exercise_type: exerciseType,
        mode: 'writing',
        topic_id: topicId,
        context,
      });
      setExercise(ex);
      setPhase('exercise');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement');
    } finally {
      setLoadingExercise(false);
    }
  };

  const submitResponse = async () => {
    if (!exercise || !userResponse.trim()) return;
    setPhase('evaluating');
    setError(null);
    try {
      const result = await api.evaluate({
        exercise_id: exercise.id,
        session_id: sessionId,
        response_content: userResponse,
        attempt_number: attemptNumber,
      });
      setEvaluation(result.evaluation);
      setSessionScore(prev => [...prev, result.evaluation.score]);
      setPhase('feedback');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'évaluation');
      setPhase('exercise');
    }
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
        await loadExercise('writing_prompt', step.exercise_hint);
        break;
      case 'mini_role_play':
        await loadExercise('role_play', step.exercise_hint);
        break;
      case 'grammar_focus':
        await loadExercise('grammar_correction', step.exercise_hint);
        break;
      default:
        await loadExercise();
    }
  };

  const averageScore = sessionScore.length
    ? Math.round(sessionScore.reduce((a, b) => a + b, 0) / sessionScore.length)
    : 0;

  // Character-counter colour logic
  const charCount = userResponse.length;
  const charRatio = charCount / MIN_RESPONSE_CHARS;
  const charCountClass =
    charRatio >= 1
      ? 'text-green-600 font-semibold'
      : charRatio >= 0.8
        ? 'text-yellow-600 font-semibold'
        : 'text-gray-400';

  if (!exercise && !loadingExercise && error) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4 page-enter">
        <p className="text-red-600">{error}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          {['writing_prompt', 'role_play', 'grammar_correction'].map(type => (
            <Button key={type} variant="outline" onClick={() => loadExercise(type)}>
              {type === 'writing_prompt' && 'Production écrite'}
              {type === 'role_play' && 'Jeu de rôle'}
              {type === 'grammar_correction' && 'Correction grammaticale'}
            </Button>
          ))}
        </div>
        <Button variant="ghost" onClick={onBack}>← Retour</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 page-enter">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem(EXERCISE_STATE_KEY); onBack(); }}>←</Button>
          <Badge variant="outline">{examType}</Badge>
          <Badge variant="outline">{level}</Badge>
          {exercise && <Badge variant="outline">{exercise.difficulty}</Badge>}
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

      {loadingExercise && <SkeletonCard variant="exercise" />}

      {exercise && !loadingExercise && (
        <>
          {/* Exercise card — left border indicates difficulty */}
          <Card className={`shadow-md ${difficultyBorderClass(exercise.difficulty)}`}>
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
                  onClick={() => loadExercise()}
                  title="Générer un autre exercice"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900 font-medium leading-relaxed whitespace-pre-wrap">
                {exercise.prompt}
              </p>
              {attemptNumber > 1 && (
                <p className="mt-2 text-sm text-amber-600">
                  Tentative {attemptNumber} — réessayez en tenant compte des corrections précédentes.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Response input */}
          {(phase === 'exercise' || phase === 'evaluating') && (
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
                  <span className={`text-xs transition-colors ${charCountClass}`}>
                    {charCount} caractères
                    {charRatio >= 1 ? ' ✓' : charRatio >= 0.8 ? ' — presque !' : ''}
                  </span>
                  <Button
                    onClick={submitResponse}
                    disabled={!userResponse.trim() || phase === 'evaluating'}
                    className="bg-[#0055A4] hover:bg-[#003d7a] text-white transition-colors"
                  >
                    {phase === 'evaluating' ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4 mr-2" />
                        Évaluation en cours…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Soumettre
                      </>
                    )}
                  </Button>
                </div>
                {phase === 'evaluating' && (
                  <div className="space-y-2">
                    <Progress value={66} className="h-1" />
                    <p className="text-xs text-gray-500 text-center">Claude analyse votre réponse…</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Feedback — smooth expand animation */}
          {phase === 'feedback' && evaluation && (
            <div className={`feedback-expand ${feedbackOpen ? 'open' : ''}`}>
              <EvaluationFeedback
                evaluation={evaluation}
                onNextStep={handleNextStep}
                onNewExercise={() => loadExercise()}
                onFinish={() => { localStorage.removeItem(EXERCISE_STATE_KEY); onComplete(averageScore); }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
