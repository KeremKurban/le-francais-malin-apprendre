import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, ArrowRight, RefreshCw, Flag } from 'lucide-react';
import { EvaluationResult, NextStep } from '@/api/backendClient';

interface Props {
  evaluation: EvaluationResult;
  onNextStep: (step: NextStep) => void;
  onNewExercise: () => void;
  onFinish: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  minor: 'border-yellow-200 bg-yellow-50',
  moderate: 'border-orange-200 bg-orange-50',
  major: 'border-red-200 bg-red-50',
};

const SEVERITY_BADGES: Record<string, string> = {
  minor: 'bg-yellow-100 text-yellow-800',
  moderate: 'bg-orange-100 text-orange-800',
  major: 'bg-red-100 text-red-800',
};

const NEXT_STEP_ICONS: Record<string, string> = {
  reformulate: '✍️',
  retry: '🔄',
  variation: '🎲',
  mini_role_play: '🎭',
  grammar_focus: '📖',
};

const NEXT_STEP_LABELS: Record<string, string> = {
  reformulate: 'Reformuler',
  retry: 'Réessayer',
  variation: 'Exercice similaire',
  mini_role_play: 'Mini jeu de rôle',
  grammar_focus: 'Focus grammaire',
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const size = 80;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-1 text-center">
        <div className="text-2xl font-bold" style={{ color }}>{score}</div>
        <div className="text-xs text-gray-500">/ 100</div>
      </div>
    </div>
  );
}

export default function EvaluationFeedback({ evaluation, onNextStep, onNewExercise, onFinish }: Props) {
  const [errorsExpanded, setErrorsExpanded] = useState(true);
  const [selectedStep, setSelectedStep] = useState<NextStep | null>(null);

  const { score, overall_feedback, strengths, improvements, errors, next_steps } = evaluation;

  return (
    <div className="space-y-4">
      {/* Score & summary */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <ScoreRing score={Math.round(score)} />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Évaluation générale</h3>
              <p className="text-gray-700 text-sm leading-relaxed">{overall_feedback}</p>
              <div className="flex gap-2 mt-3">
                {score >= 70 ? (
                  <Badge className="bg-green-100 text-green-800">Réussi</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">À améliorer</Badge>
                )}
                <Badge variant="outline">{errors.length} erreur{errors.length !== 1 ? 's' : ''}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths */}
      {strengths.length > 0 && (
        <Card className="border-green-100">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold text-green-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Points forts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1">
              {strengths.map((s, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span> {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="border-orange-100">
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Erreurs détectées ({errors.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setErrorsExpanded(!errorsExpanded)}
              >
                {errorsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          {errorsExpanded && (
            <CardContent className="pt-0 space-y-3">
              {errors.map((err, i) => (
                <div key={i} className={`rounded-lg border p-3 ${SEVERITY_COLORS[err.severity]}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_BADGES[err.severity]}`}>
                      {err.severity}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">{err.error_type}</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 line-through">{err.original_text}</span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-green-700 font-medium">{err.correction}</span>
                    </div>
                    <p className="text-gray-600 text-xs">{err.explanation}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Improvements */}
      {improvements.length > 0 && (
        <Card className="border-blue-100">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold text-blue-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> À améliorer
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1">
              {improvements.map((imp, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">→</span> {imp}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Next steps — user actively chooses */}
      {next_steps.length > 0 && (
        <Card className="border-purple-100 bg-purple-50/40">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold text-purple-700">
              Que voulez-vous faire maintenant ?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {next_steps.map((step, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedStep(step);
                  onNextStep(step);
                }}
                className={`w-full text-left rounded-lg border p-3 transition-all hover:border-purple-400 hover:bg-white ${
                  selectedStep === step ? 'border-purple-500 bg-white shadow-sm' : 'border-purple-200 bg-white/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{NEXT_STEP_ICONS[step.type] ?? '▶️'}</span>
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {NEXT_STEP_LABELS[step.type] ?? step.type}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">{step.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Footer actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onNewExercise} className="flex-1">
          <RefreshCw className="w-4 h-4 mr-2" />
          Nouvel exercice
        </Button>
        <Button variant="outline" onClick={onFinish} className="flex-1">
          <Flag className="w-4 h-4 mr-2" />
          Terminer la session
        </Button>
      </div>
    </div>
  );
}
