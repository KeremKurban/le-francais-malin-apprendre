import { expect, test } from '@playwright/test';
import { startPracticeSession } from './support/aiFlow';
import { mockAIBackend } from './support/aiMocks';

test.beforeEach(async ({ page }) => {
  await mockAIBackend(page);
});

test('loads AI mode and creates a practice session', async ({ page }) => {
  await startPracticeSession(page);
});

test('loads topic map and opens exercise interface', async ({ page }) => {
  await startPracticeSession(page);

  await page.getByText('Banque en Suisse').first().click();
  await expect(page.getByRole('button', { name: 'Exercice IA' })).toBeVisible();
  await expect(page.getByText('Prêt pour un exercice ?')).toBeVisible();
  await expect(page.getByRole('button', { name: /Générer l'exercice/ })).toBeVisible();
});

test('generates exercise and submits evaluation loop', async ({ page }) => {
  await startPracticeSession(page);
  await page.getByText('Banque en Suisse').first().click();
  await page.getByRole('button', { name: /Générer l'exercice/ }).click();

  await expect(page.getByText('Rédigez une réponse test')).toBeVisible();
  await page.getByPlaceholder('Écrivez votre réponse ici…').fill('Je voudrais ouvrir un compte bancaire.');
  await page.getByRole('button', { name: 'Soumettre' }).click();

  await expect(page.getByRole('heading', { name: 'Évaluation générale' })).toBeVisible();
  await expect(page.getByText('Que voulez-vous faire maintenant ?')).toBeVisible();
});

test('opens dashboard after finishing exercise session', async ({ page }) => {
  await startPracticeSession(page);
  await page.getByText('Banque en Suisse').first().click();
  await page.getByRole('button', { name: /Générer l'exercice/ }).click();
  await page.getByPlaceholder('Écrivez votre réponse ici…').fill('Réponse de test pour le dashboard.');
  await page.getByRole('button', { name: 'Soumettre' }).click();
  await expect(page.getByRole('heading', { name: 'Évaluation générale' })).toBeVisible({ timeout: 8000 });
  await page.getByRole('button', { name: 'Terminer la session' }).click();

  await expect(page.getByRole('button', { name: 'Mes progrès' })).toBeVisible();
  await page.getByRole('button', { name: 'Mes progrès' }).click();
  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
  await expect(page.getByText('Exercices recommandés')).toBeVisible();
});
