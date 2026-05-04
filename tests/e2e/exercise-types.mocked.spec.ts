/**
 * Exercise-type rendering tests — all network calls are intercepted by mockAIBackend.
 *
 * Architecture note: AIExerciseInterface submits via the async evaluation
 * endpoint (evaluate-async + polling). mockAIBackend now intercepts both that
 * endpoint and the polling status endpoint (returning status:"done" instantly),
 * so the evaluation result is delivered within the first polling tick (~2 s).
 * Tests 4 & 5 therefore wait up to 8 s for the EvaluationFeedback component to
 * appear after polling resolves.
 */

import { expect, test } from '@playwright/test';
import { startFreePracticeSession } from './support/aiFlow';
import { mockAIBackend } from './support/aiMocks';
import {
  WRITING_PROMPT_EXERCISE,
  ERROR_CORRECTION_EXERCISE,
  MULTIPLE_CHOICE_EXERCISE,
  EVALUATION_WITH_MARKDOWN,
} from './exerciseFixtures';

// ── Test 1 ────────────────────────────────────────────────────────────────────

test('writing_prompt renders instruction and free-text textarea', async ({ page }) => {
  await mockAIBackend(page, WRITING_PROMPT_EXERCISE as Record<string, unknown>);
  await startFreePracticeSession(page);

  // The WritingPromptRenderer shows the instruction from content.instruction
  await expect(
    page.getByText('Décrivez votre routine matinale en 5 phrases.'),
  ).toBeVisible({ timeout: 8000 });

  // The textarea is rendered by WritingPromptRenderer (content path)
  await expect(
    page.getByPlaceholder('Écrivez votre réponse ici…'),
  ).toBeVisible({ timeout: 8000 });
});

// ── Test 2 ────────────────────────────────────────────────────────────────────

test('error_correction passage is rendered — key regression test', async ({ page }) => {
  await mockAIBackend(page, ERROR_CORRECTION_EXERCISE as Record<string, unknown>);
  await startFreePracticeSession(page);

  // The card title should reflect the error_correction exercise type
  await expect(
    page.getByRole('heading', { name: 'Correction grammaticale' }),
  ).toBeVisible({ timeout: 8000 });

  // The passage itself must be visible — this is the regression being guarded
  await expect(
    page.getByText('Hier, je suis allé au marché'),
  ).toBeVisible({ timeout: 8000 });
});

// ── Test 3 ────────────────────────────────────────────────────────────────────

test('multiple_choice renders 4 clickable option buttons', async ({ page }) => {
  await mockAIBackend(page, MULTIPLE_CHOICE_EXERCISE as Record<string, unknown>);

  // startFreePracticeSession waits for the textarea placeholder — which is NOT
  // present for MCQ (it renders option buttons, not a textarea). We therefore
  // open AI mode and click "Pratique libre" manually, then wait for the MCQ
  // content instead.
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Mode IA' })).toBeVisible();
  await page.getByRole('button', { name: 'Mode IA' }).click();
  await expect(page.getByRole('heading', { name: 'Nouvelle session' })).toBeVisible();
  await page.getByRole('button', { name: 'Pratique libre' }).click();

  // Wait for the MCQ question to appear
  await expect(
    page.getByText('Quelle phrase est grammaticalement correcte ?'),
  ).toBeVisible({ timeout: 8000 });

  // The MultipleChoiceRenderer renders each option as a <button>
  // Assert all 4 option buttons are visible
  await expect(page.getByRole('button', { name: /Je suis allé au marché hier\./ })).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole('button', { name: /Je sommes allé au marché hier\./ })).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole('button', { name: /Je suis aller au marché hier\./ })).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole('button', { name: /Je suis allé à le marché hier\./ })).toBeVisible({ timeout: 8000 });
});

// ── Test 4 ────────────────────────────────────────────────────────────────────

test('evaluation feedback renders structured data, not raw JSON', async ({ page }) => {
  // EVALUATION_WITH_MARKDOWN has overall_feedback with **bold** markers
  await mockAIBackend(
    page,
    WRITING_PROMPT_EXERCISE as Record<string, unknown>,
    EVALUATION_WITH_MARKDOWN as Record<string, unknown>,
  );
  await startFreePracticeSession(page);

  // Fill in a response using the textarea rendered by WritingPromptRenderer
  await page.getByPlaceholder('Écrivez votre réponse ici…').fill(
    'Je me lève à sept heures. Je prends le petit-déjeuner.',
  );

  // Submit — fires evaluateAsync; the mock returns evaluation_id immediately,
  // and the polling mock returns status:"done" with the evaluation result on the
  // first poll (≈2 s).
  await page.getByRole('button', { name: 'Soumettre' }).click();

  // After the component receives the done status it should render EvaluationFeedback.
  // Wait generously for the polling interval to fire and the UI to update.
  await expect(
    page.getByRole('heading', { name: 'Évaluation générale' }),
  ).toBeVisible({ timeout: 8000 });

  // Markdown should be rendered — raw marker must NOT appear as plain text
  await expect(page.getByText('**Excellent travail.**')).not.toBeVisible();

  // Parsed bold element must be present
  await expect(page.locator('strong', { hasText: 'Excellent travail.' })).toBeVisible();

  // Structured sections must be present
  await expect(page.getByText('Points forts')).toBeVisible();
  await expect(page.getByText(/Erreurs détectées/)).toBeVisible();
  await expect(page.getByText('Que voulez-vous faire maintenant ?')).toBeVisible();
});

// ── Test 5 ────────────────────────────────────────────────────────────────────

test('score ring shows a number, not JSON', async ({ page }) => {
  await mockAIBackend(
    page,
    WRITING_PROMPT_EXERCISE as Record<string, unknown>,
    EVALUATION_WITH_MARKDOWN as Record<string, unknown>,
  );
  await startFreePracticeSession(page);

  await page.getByPlaceholder('Écrivez votre réponse ici…').fill(
    'Je me lève à sept heures. Je prends le petit-déjeuner.',
  );
  await page.getByRole('button', { name: 'Soumettre' }).click();

  // Wait for feedback to appear (same timing as Test 4)
  await expect(
    page.getByRole('heading', { name: 'Évaluation générale' }),
  ).toBeVisible({ timeout: 8000 });

  // The ScoreRing renders the score as a plain integer next to "/ 100"
  // Score from EVALUATION_WITH_MARKDOWN is 72
  await expect(page.getByText('72')).toBeVisible();
  await expect(page.getByText('/ 100')).toBeVisible();

  // No raw JSON curly-brace text should appear inside the score area
  const scoreCardText = await page.locator('.space-y-4').first().textContent();
  expect(scoreCardText).not.toMatch(/^\s*\{/);
});
