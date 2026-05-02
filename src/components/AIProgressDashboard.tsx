import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, TrendingUp, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { api, Dashboard } from '@/api/backendClient';

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-yellow-100 text-yellow-800',
  medium: 'bg-orange-100 text-orange-800',
  high: 'bg-red-100 text-red-800',
};

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2'];

function levelToScore(level: string): number {
  return (LEVEL_ORDER.indexOf(level) + 1) * 25;
}

export default function AIProgressDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getDashboard()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200">
        <CardContent className="py-8 text-center text-red-600">
          {error ?? 'Impossible de charger les données'}
        </CardContent>
      </Card>
    );
  }

  const radarData = data.skill_levels.map(s => ({
    skill: s.skill.charAt(0).toUpperCase() + s.skill.slice(1),
    value: levelToScore(s.estimated_level),
    fullMark: 100,
  }));

  const scoreHistory = data.recent_scores
    .slice()
    .reverse()
    .map((score, i) => ({ exercise: i + 1, score: Math.round(score) }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Sessions', value: data.total_sessions, color: 'from-blue-500 to-blue-600' },
          { label: 'Exercices', value: data.total_exercises, color: 'from-indigo-500 to-indigo-600' },
          { label: 'Score moyen', value: `${data.average_score}%`, color: 'from-green-500 to-emerald-500' },
          { label: 'Réponses', value: data.total_responses, color: 'from-purple-500 to-purple-600' },
        ].map(kpi => (
          <Card key={kpi.label} className={`border-0 shadow text-white bg-gradient-to-br ${kpi.color}`}>
            <CardContent className="p-4">
              <p className="text-white/80 text-sm">{kpi.label}</p>
              <p className="text-2xl font-bold mt-1">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill radar */}
        {radarData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                Niveaux par compétence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
                  <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {data.skill_levels.map(s => (
                  <Badge key={s.skill} variant="outline" className="text-xs">
                    {s.skill}: <strong className="ml-1">{s.estimated_level}</strong>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Score history */}
        {scoreHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Évolution des scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={scoreHistory}>
                  <XAxis dataKey="exercise" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Weaknesses */}
      {data.top_weaknesses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Points faibles prioritaires
            </CardTitle>
            <CardDescription>Thèmes avec le plus d'erreurs — à travailler en priorité</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.top_weaknesses.map((w, i) => (
              <div key={w.topic_id} className="flex items-center gap-4">
                <span className="text-gray-400 text-sm w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{w.topic_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{w.error_count} erreurs</span>
                      <Badge className={`text-xs ${SEVERITY_COLORS[w.severity]}`}>{w.severity}</Badge>
                    </div>
                  </div>
                  <Progress
                    value={Math.min((w.error_count / 10) * 100, 100)}
                    className="h-1.5"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Exercices recommandés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recommendations.map(r => (
              <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <span className="text-lg">{r.priority === 1 ? '🥇' : r.priority === 2 ? '🥈' : '🥉'}</span>
                <div>
                  <div className="text-sm font-medium text-gray-900">{r.topic_name}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{r.reason}</div>
                  <Badge variant="outline" className="mt-1 text-xs">{r.exercise_type}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data.total_responses === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-gray-500">
            Commencez votre premier exercice pour voir vos statistiques ici.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
