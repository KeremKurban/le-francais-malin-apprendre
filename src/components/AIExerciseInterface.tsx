import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Loader2, Send, RotateCcw, BookOpen, MessageSquare, ChevronRight } from 'lucide-react';
import { api, Exercise, EvaluationResult, NextStep } from '@/api/backendClient';
import EvaluationFeedback from './EvaluationFeedback';

interface AIExerciseInterfaceProps {
  sessionId: string;
  examType: string;
  level: string;
  topicId?: string;
  onComplete: (score: number) => void;
  onBack: () => void;
}

type Phase = 'exercise' | 'evaluating' | 'feedback' | 'next_step';

export default function AIExerciseInterface({
  sessionId,
  examType,
  level,
  topicId,
  onComplete,
  onBack,
}: AIExerciseInterfaceProps) {
  const [phase, setPhase] = useState<Phase>('exercise');
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [sessionScore, setSessionScore] = useState<number[]>([]);
  const [loadingExercise, setLoadingExercise] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExercise = async (exerciseType = 'writing_prompt', context?: string) => {
    setLoadingExercise(true);
    setError(null);
    setUserResponse('');
    setEvaluation(null);
    setAttemptNumber(1);
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

  if (!exercise && !loadingExercise) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exercice IA</h2>
          <p className="text-gray-600 mt-2">
            Un exercice {examType} niveau {level} va être généré par Claude.
            Écrivez votre réponse et recevez un retour détaillé.
          </p>
        </div>
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>←</Button>
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

      {loadingExercise && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="animate-spin w-8 h-8 mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Claude génère votre exercice…</p>
          </CardContent>
        </Card>
      )}

      {exercise && !loadingExercise && (
        <>
          {/* Exercise card */}
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
                  <span className="text-xs text-gray-400">{userResponse.length} caractères</span>
                  <Button
                    onClick={submitResponse}
                    disabled={!userResponse.trim() || phase === 'evaluating'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {phase === 'evaluating' ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4 mr-2" />
                        Évaluation…
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

          {/* Feedback */}
          {phase === 'feedback' && evaluation && (
            <EvaluationFeedback
              evaluation={evaluation}
              onNextStep={handleNextStep}
              onNewExercise={() => loadExercise()}
              onFinish={() => onComplete(averageScore)}
            />
          )}
        </>
      )}
    </div>
  );
}
