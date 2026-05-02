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
