import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Timer, Send, Loader2, Trophy } from 'lucide-react';
import { api, Exercise, EvaluationResult } from '@/api/backendClient';

interface Props {
  sessionId: string;
  examType: string;
  level: string;
  onComplete: (finalScore: number) => void;
  onBack: () => void;
}

const MOCK_EXAM_CONFIG = {
  totalExercises: 5,
  timeLimitMinutes: 30,
};

interface ExerciseResult {
  exercise: Exercise;
  response: string;
  evaluation: EvaluationResult | null;
}

export default function MockExam({ sessionId, examType, level, onComplete, onBack }: Props) {
  const [phase, setPhase] = useState<'intro' | 'running' | 'evaluating' | 'results'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(MOCK_EXAM_CONFIG.timeLimitMinutes * 60);
  const [loading, setLoading] = useState(false);

  const exerciseTypes = ['writing_prompt', 'grammar_correction', 'role_play', 'fill_blank', 'writing_prompt'];

  const loadNextExercise = useCallback(async () => {
    setLoading(true);
    setUserResponse('');
    try {
      const ex = await api.generateExercise({
        exam_type: examType,
        level,
        exercise_type: exerciseTypes[currentIndex % exerciseTypes.length],
        mode: 'writing',
        exercise_pool: 'fresh',
      });
      setExercise(ex);
    } finally {
      setLoading(false);
    }
  }, [currentIndex, examType, level]);

  useEffect(() => {
    if (phase === 'running') {
      loadNextExercise();
    }
  }, [phase, currentIndex]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'running') return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const submitAndNext = async () => {
    if (!exercise || !userResponse.trim()) return;
    setPhase('evaluating');

    let evaluation: EvaluationResult | null = null;
    try {
      const result = await api.evaluate({
        exercise_id: exercise.id,
        session_id: sessionId,
        response_content: userResponse,
        attempt_number: 1,
      });
      evaluation = result.evaluation;
    } catch {
      // Allow continuing even if eval fails
    }

    setResults(prev => [...prev, { exercise, response: userResponse, evaluation }]);

    if (currentIndex + 1 >= MOCK_EXAM_CONFIG.totalExercises) {
      handleFinish();
    } else {
      setCurrentIndex(prev => prev + 1);
      setPhase('running');
    }
  };

  const handleFinish = () => {
    setPhase('results');
    const avg = results.reduce((sum, r) => sum + (r.evaluation?.score ?? 0), 0) / Math.max(results.length, 1);
    onComplete(Math.round(avg));
  };

  const finalScore = results.length
    ? Math.round(results.reduce((sum, r) => sum + (r.evaluation?.score ?? 0), 0) / results.length)
    : 0;

  const timePercent = ((MOCK_EXAM_CONFIG.timeLimitMinutes * 60 - timeRemaining) / (MOCK_EXAM_CONFIG.timeLimitMinutes * 60)) * 100;

  if (phase === 'intro') {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Examen blanc</h2>
          <p className="text-gray-600 mt-2">
            {MOCK_EXAM_CONFIG.totalExercises} exercices {examType} niveau {level}
            {' '}en {MOCK_EXAM_CONFIG.timeLimitMinutes} minutes.
            Chaque réponse est évaluée par IA.
          </p>
        </div>
        <div className="text-left bg-gray-50 rounded-xl p-4 text-sm text-gray-700 space-y-2">
          <p>• <strong>Production écrite</strong> — rédigez un texte court</p>
          <p>• <strong>Correction grammaticale</strong> — identifiez les erreurs</p>
          <p>• <strong>Jeu de rôle</strong> — simulez une situation réelle</p>
          <p>• <strong>Texte à trous</strong> — complétez le texte</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="ghost" onClick={onBack}>Annuler</Button>
          <Button
            onClick={() => setPhase('running')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Commencer l'examen
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div className="text-center">
          <div className={`text-5xl font-bold mb-2 ${finalScore >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
            {finalScore}%
          </div>
          <p className="text-gray-600">
            {finalScore >= 80 ? 'Excellent résultat !' : finalScore >= 60 ? 'Bon effort, continuez !' : 'Entraînez-vous davantage.'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Exercices', value: results.length },
            { label: 'Réussis (≥70)', value: results.filter(r => (r.evaluation?.score ?? 0) >= 70).length },
            { label: 'Erreurs totales', value: results.reduce((s, r) => s + (r.evaluation?.errors.length ?? 0), 0) },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="py-4">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-3">
          {results.map((r, i) => (
            <Card key={i} className="border-gray-100">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700">
                    Exercice {i + 1} — {r.exercise.exercise_type}
                  </div>
                  <Badge className={r.evaluation?.score && r.evaluation.score >= 70 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                    {r.evaluation?.score?.toFixed(0) ?? '?'}%
                  </Badge>
                </div>
                {r.evaluation?.errors && r.evaluation.errors.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {r.evaluation.errors.length} erreur{r.evaluation.errors.length > 1 ? 's' : ''} détectée{r.evaluation.errors.length > 1 ? 's' : ''}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onBack}>Retour au menu</Button>
          <Button onClick={() => { setPhase('intro'); setResults([]); setCurrentIndex(0); }}>
            Recommencer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Exam header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-100 text-purple-800">Examen blanc</Badge>
          <Badge variant="outline">{examType} {level}</Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {currentIndex + 1} / {MOCK_EXAM_CONFIG.totalExercises}
          </div>
          <div className={`flex items-center gap-2 font-mono font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-700'}`}>
            <Timer className="w-4 h-4" />
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      <Progress value={timePercent} className="h-1" />

      {loading || phase === 'evaluating' ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="animate-spin w-8 h-8 mx-auto text-purple-600 mb-4" />
            <p className="text-gray-600">
              {loading ? 'Préparation de l\'exercice…' : 'Évaluation de votre réponse…'}
            </p>
          </CardContent>
        </Card>
      ) : exercise && (
        <>
          <Card className="border-purple-100">
            <CardHeader>
              <CardTitle className="text-base">
                Exercice {currentIndex + 1} — {exercise.exercise_type}
              </CardTitle>
              {exercise.context && (
                <p className="text-sm text-gray-600 bg-purple-50 rounded-lg p-3">
                  📍 {exercise.context}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-gray-900 font-medium whitespace-pre-wrap">{exercise.prompt}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <Textarea
                value={userResponse}
                onChange={e => setUserResponse(e.target.value)}
                placeholder="Rédigez votre réponse…"
                className="min-h-[120px] resize-none"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">{userResponse.length} caractères</span>
                <Button
                  onClick={submitAndNext}
                  disabled={!userResponse.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {currentIndex + 1 < MOCK_EXAM_CONFIG.totalExercises ? 'Exercice suivant' : 'Terminer l\'examen'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
