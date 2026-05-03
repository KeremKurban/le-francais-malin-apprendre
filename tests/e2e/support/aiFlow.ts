import { expect, Page } from '@playwright/test';

export async function openAIMode(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Mode IA' })).toBeVisible();
  await page.getByRole('button', { name: 'Mode IA' }).click();
}

export async function startPracticeSession(page: Page) {
  await openAIMode(page);
  await expect(page.getByRole('heading', { name: 'Nouvelle session' })).toBeVisible();
  await page.getByRole('button', { name: 'Par thème' }).click();
  await expect(page.getByRole('heading', { name: 'Carte des thèmes' })).toBeVisible();
}

/**
 * Clicks "Pratique libre" on the session setup page and waits for the exercise
 * to load. The exercise card renders immediately after the generate request
 * resolves, so we wait for the textarea to become visible.
 */
export async function startFreePracticeSession(page: Page) {
  await openAIMode(page);
  await expect(page.getByRole('heading', { name: 'Nouvelle session' })).toBeVisible();
  await page.getByRole('button', { name: 'Pratique libre' }).click();
  // Wait for the exercise card to render (the textarea is present once the
  // generate call completes and the exercise state is populated).
  await expect(page.getByPlaceholder('Écrivez votre réponse ici…')).toBeVisible({ timeout: 8000 });
}
