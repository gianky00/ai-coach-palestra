import { expect, test } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('Home page should match snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=KineFit', { timeout: 10000 });

    // Mask dynamic elements if necessary (e.g., timers, random names)
    // await page.addStyleTag({ content: '.timer { visibility: hidden; }' });

    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    });
  });

  test('Muscle Heatmap should match snapshot', async ({ page }) => {
    await page.goto('/');
    // Assuming the heatmap is on the home page or accessible via a button
    const heatmap = page.locator('.muscle-heatmap-container');
    if (await heatmap.isVisible()) {
      await expect(heatmap).toHaveScreenshot('muscle-heatmap.png');
    }
  });
});
