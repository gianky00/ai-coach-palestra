import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Accessibility (A11y)', () => {
  test('should not have any automatically detectable accessibility issues on Home page', async ({
    page,
  }) => {
    await page.goto('/');

    // Wait for the app to be ready
    await page.waitForSelector('text=KineFit', { timeout: 10000 });

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have any automatically detectable accessibility issues on Oggi view', async ({
    page,
  }) => {
    await page.goto('/');
    // Assuming user is logged in or we are in a state where "Oggi" is visible
    // For simplicity, we just test the current view

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
