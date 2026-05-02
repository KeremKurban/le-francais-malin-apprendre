import { expect, test } from '@playwright/test';
import { openAIMode } from './support/aiFlow';
import { mockAIBackend } from './support/aiMocks';

test.beforeEach(async ({ page }) => {
  await mockAIBackend(page);
});

test('runs mock exam flow and displays results', async ({ page }) => {
  await openAIMode(page);
  await page.getByRole('button', { name: 'Examen blanc' }).click();

  await expect(page.getByRole('heading', { name: 'Examen blanc' })).toBeVisible();
  await page.getByRole('button', { name: "Commencer l'examen" }).click();

  for (let i = 0; i < 5; i += 1) {
    await expect(page.getByPlaceholder('Rédigez votre réponse…')).toBeVisible();
    await page.getByPlaceholder('Rédigez votre réponse…').fill(`Réponse examen ${i + 1}`);
    const buttonName = i < 4 ? 'Exercice suivant' : "Terminer l'examen";
    await page.getByRole('button', { name: buttonName }).click();
  }

  await expect(page.getByText(/Session terminée|Tableau de bord/)).toBeVisible();
});
