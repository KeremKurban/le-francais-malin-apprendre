/**
 * Typed client for the FastAPI backend.
 * All requests include the JWT from localStorage.
 */
import type { ExerciseContent } from '../types/exercise';

export type { ExerciseContent };

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

function getToken(): string | null {
  return localStorage.getItem('backend_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let resp: Response;
  try {
    resp = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch (e: unknown) {
    const isNetwork =
      e instanceof TypeError ||
      (typeof e === 'object' &&
        e !== null &&
        'name' in e &&
        (e as { name?: string }).name === 'TypeError');
    if (isNetwork) {
      throw new Error(
        `Impossible de joindre l'API (${BASE_URL}). Démarrez le backend, vérifiez VITE_API_BASE_URL, et ouvrez l'app via la même URL que dans CORS_ORIGINS (ex. localhost vs 127.0.0.1).`,
      );
    }
    throw e instanceof Error ? e : new Error('Erreur réseau');
  }
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: resp.statusText }));
    throw new Error(err.detail ?? 'API error');
  }
  return resp.json() as Promise<T>;
}

export const api = {
  // Auth
  register: (body: { email: string; username: string; password: string; target_exam: string; target_level: string }) =>
    request<{ access_token: string }>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<{ access_token: string }>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: () => request<{ id: string; email: string; username: string; target_exam: string; target_level: string }>('/api/v1/auth/me'),

  // Topics
  getTopics: (params?: { exam_type?: string; level?: string; category?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ topics: Topic[]; total: number }>(`/api/v1/topics${qs ? `?${qs}` : ''}`);
  },

  // Sessions
  createSession: (body: { exam_type: string; mode: string; level: string }) =>
    request<Session>('/api/v1/sessions', { method: 'POST', body: JSON.stringify(body) }),

  listSessions: () => request<Session[]>('/api/v1/sessions'),

  endSession: (sessionId: string) =>
    request<Session>(`/api/v1/sessions/${sessionId}/end`, { method: 'PATCH' }),

  // Exercises
  generateExercise: (body: {
    topic_id?: string;
    exam_type: string;
    level: string;
    exercise_type: string;
    mode: string;
    context?: string;
    /** fresh = new LLM exercise (stored for reuse). history = random exercise you already saw. */
    exercise_pool?: 'fresh' | 'history';
  }) => request<Exercise>('/api/v1/exercises/generate', { method: 'POST', body: JSON.stringify(body) }),

  // Evaluations
  evaluate: (body: {
    exercise_id: string;
    session_id: string;
    response_content: string;
    attempt_number: number;
  }) => request<EvaluationResponse>('/api/v1/evaluations/evaluate', { method: 'POST', body: JSON.stringify(body) }),

  evaluateAsync: (body: { exercise_id: string; session_id: string; response_content: string; attempt_number: number }) =>
    request<{ evaluation_id: string; response_id: string }>('/api/v1/evaluations/evaluate-async', { method: 'POST', body: JSON.stringify(body) }),

  getEvaluationStatus: (evaluationId: string) =>
    request<AsyncEvaluationStatus>(`/api/v1/evaluations/${evaluationId}`),

  // Progress
  getDashboard: () => request<Dashboard>('/api/v1/progress/dashboard'),
  getWeaknesses: () => request<WeaknessItem[]>('/api/v1/progress/weaknesses'),
  getRecommendations: () => request<Recommendation[]>('/api/v1/progress/recommendations'),
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Topic {
  id: string;
  name: string;
  description: string;
  exam_type: string;
  level: string | null;
  category: string;
  swiss_context: boolean;
  parent_id: string | null;
}

export interface Session {
  id: string;
  user_id: string;
  exam_type: string;
  mode: string;
  level: string;
  started_at: string;
  ended_at: string | null;
  total_exercises: number;
  correct_responses: number;
  score_total: number;
}

export interface Exercise {
  id: string;
  topic_id: string;
  level: string;
  exam_type: string;
  exercise_type: string;
  mode: string;
  prompt: string;
  context: string;
  rubric: Record<string, string>;
  prompt_version: string;
  difficulty: string;
  content: ExerciseContent | null;
}

export interface ErrorDetail {
  error_type: string;
  severity: string;
  original_text: string;
  correction: string;
  explanation: string;
}

export interface NextStep {
  type: string;
  description: string;
  exercise_hint?: string;
}

export interface EvaluationResult {
  response_id: string;
  score: number;
  overall_feedback: string;
  strengths: string[];
  improvements: string[];
  errors: ErrorDetail[];
  next_steps: NextStep[];
  mlflow_run_id?: string;
}

export interface EvaluationResponse {
  evaluation: EvaluationResult;
  weaknesses_updated: boolean;
  skill_levels_updated: boolean;
}

export interface SkillLevel {
  skill: string;
  estimated_level: string;
  confidence: number;
  score_history: number;
}

export interface WeaknessItem {
  topic_id: string;
  topic_name: string;
  error_count: number;
  severity: string;
  error_type_counts: Record<string, number>;
  last_seen: string;
}

export interface Recommendation {
  id: string;
  topic_id: string;
  topic_name: string;
  priority: number;
  reason: string;
  exercise_type: string;
}

export interface Dashboard {
  total_sessions: number;
  total_exercises: number;
  total_responses: number;
  average_score: number;
  skill_levels: SkillLevel[];
  top_weaknesses: WeaknessItem[];
  recommendations: Recommendation[];
  recent_scores: number[];
  streak_days: number;
}

export interface AsyncEvaluationStatus {
  evaluation_id: string;
  response_id: string | null;
  status: 'pending' | 'running' | 'done' | 'failed';
  result: EvaluationResult | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}
