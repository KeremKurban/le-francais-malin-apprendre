import { Page, Route } from '@playwright/test';

const mockTopics = [
  {
    id: 'topic-fide-1',
    name: 'Banque en Suisse',
    description: 'Expliquer une situation bancaire simple.',
    exam_type: 'FIDE',
    level: null,
    category: 'communication',
    swiss_context: true,
    parent_id: null,
  },
  {
    id: 'topic-delf-1',
    name: 'Opinion sur le travail',
    description: 'Donner son avis dans un texte argumentatif.',
    exam_type: 'DELF',
    level: 'B1',
    category: 'writing',
    swiss_context: false,
    parent_id: null,
  },
];

const mockDashboard = {
  total_sessions: 3,
  total_exercises: 9,
  total_responses: 9,
  average_score: 76,
  skill_levels: [
    { skill: 'grammar', estimated_level: 'B1', confidence: 0.8, score_history: 5 },
    { skill: 'vocabulary', estimated_level: 'B2', confidence: 0.7, score_history: 5 },
  ],
  top_weaknesses: [
    {
      topic_id: 'topic-delf-1',
      topic_name: 'Opinion sur le travail',
      error_count: 4,
      severity: 'medium',
      error_type_counts: { grammar: 2, vocabulary: 2 },
      last_seen: new Date().toISOString(),
    },
  ],
  recommendations: [
    {
      id: 'rec-1',
      topic_id: 'topic-delf-1',
      topic_name: 'Opinion sur le travail',
      priority: 1,
      reason: 'Révision recommandée',
      exercise_type: 'writing_prompt',
    },
  ],
  recent_scores: [60, 70, 78, 82],
  streak_days: 2,
};

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function mockAIBackend(page: Page) {
  let exerciseCounter = 0;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();

    if (url.includes('/api/v1/auth/login') && method === 'POST') {
      return json(route, { access_token: 'mock-backend-token', token_type: 'bearer' });
    }

    if (url.includes('/api/v1/auth/register') && method === 'POST') {
      return json(route, { access_token: 'mock-backend-token', token_type: 'bearer' }, 201);
    }

    if (url.includes('/api/v1/sessions') && method === 'POST') {
      return json(route, {
        id: 'session-1',
        user_id: 'user-1',
        exam_type: 'DELF',
        mode: 'writing',
        level: 'B1',
        started_at: new Date().toISOString(),
        ended_at: null,
        total_exercises: 0,
        correct_responses: 0,
        score_total: 0,
      }, 201);
    }

    if (url.includes('/api/v1/topics') && method === 'GET') {
      return json(route, { topics: mockTopics, total: mockTopics.length });
    }

    if (url.includes('/api/v1/exercises/generate') && method === 'POST') {
      exerciseCounter += 1;
      const payload = request.postDataJSON() as { exercise_type?: string };
      return json(route, {
        id: `exercise-${exerciseCounter}`,
        topic_id: 'topic-delf-1',
        level: 'B1',
        exam_type: 'DELF',
        exercise_type: payload.exercise_type ?? 'writing_prompt',
        mode: 'writing',
        prompt: `Rédigez une réponse test ${exerciseCounter}.`,
        context: 'Situation simulée E2E',
        rubric: { grammar: 'ok', coherence: 'ok' },
        prompt_version: 'test-v1',
        difficulty: 'intermediate',
      });
    }

    if (url.includes('/api/v1/evaluations/evaluate') && method === 'POST') {
      return json(route, {
        evaluation: {
          response_id: 'resp-1',
          score: 78,
          overall_feedback: 'Bonne structure globale, quelques erreurs mineures.',
          strengths: ['Bonne cohérence'],
          improvements: ['Mieux accorder les verbes'],
          errors: [
            {
              error_type: 'grammar',
              severity: 'minor',
              original_text: 'je suis allé',
              correction: 'je suis alle',
              explanation: 'Simplified demo correction.',
            },
          ],
          next_steps: [
            { type: 'retry', description: 'Réessayez une nouvelle version.' },
            { type: 'variation', description: 'Passez à une variation du thème.' },
          ],
          mlflow_run_id: 'mlflow-mock-run',
        },
        weaknesses_updated: true,
        skill_levels_updated: true,
      });
    }

    if (url.includes('/api/v1/progress/dashboard') && method === 'GET') {
      return json(route, mockDashboard);
    }

    if (url.includes('/api/v1/sessions/') && url.endsWith('/end') && method === 'PATCH') {
      return json(route, {
        id: 'session-1',
        user_id: 'user-1',
        exam_type: 'DELF',
        mode: 'writing',
        level: 'B1',
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        total_exercises: 1,
        correct_responses: 1,
        score_total: 78,
      });
    }

    return route.continue();
  });
}
