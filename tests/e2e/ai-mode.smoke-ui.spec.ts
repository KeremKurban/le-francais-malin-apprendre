import { expect, test } from '@playwright/test';
import { openAIMode } from './support/aiFlow';

test('AI mode smoke: opens and creates session against real backend', async ({ page }) => {
  await openAIMode(page);

  await expect(page.getByText('Impossible de se connecter au serveur IA')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Nouvelle session' })).toBeVisible();

  await page.getByRole('button', { name: 'Par thème' }).click();
  await expect(page.getByRole('heading', { name: 'Carte des thèmes' })).toBeVisible();
});
