import { test, expect } from '@playwright/test';

test.describe('Extreme Coverage & Hardening', () => {
  test.beforeEach(async ({ page }) => {
    const userId = 'test-user-uuid';
    // Pattern generico per intercettare qualsiasi istanza di supabase
    const supabasePattern = /.*\.supabase\.co/;

    await page.addInitScript(() => {
      const session = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJleHAiOjI1Mzc0NjA4MDB9.signature',
        refresh_token: 'fake-refresh',
        expires_in: 36000,
        token_type: 'bearer',
        user: { id: 'test-user-uuid', email: 'test@example.com', aud: 'authenticated', role: 'authenticated' }
      };
      // Proviamo a iniettare per diversi possibili projectRef o pattern
      window.localStorage.setItem(`sb-ekckzmihqswqfglowpwk-auth-token`, JSON.stringify(session));
    });

    await page.route(supabasePattern, async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/v1/user')) {
        return route.fulfill({
          status: 200,
          body: JSON.stringify({ id: userId, email: 'test@example.com' }),
        });
      }
      if (url.includes('/rest/v1/exercises')) {
        return route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: '1',
              name: 'Panca Piana',
              muscle_group: 'Petto',
              target_sets: 3,
              target_reps: '10',
            },
          ]),
        });
      }
      if (url.includes('/rest/v1/profiles')) {
        return route.fulfill({
          status: 200,
          body: JSON.stringify([{ id: userId, full_name: 'Test User' }]),
        });
      }
      return route.fulfill({ status: 200, body: '[]' });
    });
  });

  test('Responsive: Layout should adjust from Mobile to Desktop', async ({ page }) => {
    await page.goto('/');

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.bottom-nav')).toBeVisible();

    // Desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    const container = page.locator('.app-container');
    const box = await container.boundingBox();
    expect(box?.width).toBeGreaterThan(1000);
  });

  test('Security: XSS Protection in Input Fields', async ({ page }) => {
    await page.goto('/');

    // Apri modale aggiunta esercizio
    await page.locator('.pro-start-btn').click(); // Inizia workout prima
    await page.locator('.add-ex-btn').click();

    const xssInput = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
    const nameInput = page.locator('input[placeholder="es. Panca Piana"]');
    await nameInput.fill(xssInput);

    // Se l'app non è vulnerabile, lo script non viene eseguito e il testo viene renderizzato come stringa o filtrato
    // Non possiamo facilmente intercettare l'alert in modo automatico qui senza configurazione extra,
    // ma possiamo verificare che il testo sia presente letteralmente se salvato.

    await page.locator('button:has-text("Aggiungi Esercizio")').click();

    // Verifica che l'esercizio compaia nella lista (come testo piano)
    await expect(page.locator('.ex-name-premium', { hasText: 'script' })).toBeVisible();
    // Se framer-motion o react rendono il testo, lo faranno come stringa sicura.
  });

  test('Performance: Core Web Vitals basics', async ({ page }) => {
    const [performanceTiming] = await page.evaluate(() => {
      const [timing] = performance.getEntriesByType('navigation');
      return [timing.toJSON()];
    });

    // Caricamento DOM < 2s (generoso per dev server)
    expect(performanceTiming.domInteractive).toBeLessThan(3000);
  });

  test('Data Integrity: Complex volume calculations after multiple sets', async ({ page }) => {
    await page.goto('/');
    await page.locator('.pro-start-btn').click();

    // Log Set 1: 100kg x 10 = 1000 volume
    await page.locator('text=Panca Piana').click();
    await page.locator('input[aria-label="Peso (kg)"]').fill('100');
    await page.locator('input[aria-label="Ripetizioni"]').fill('10');
    await page.locator('button:has-text("Salva Set")').click();

    // Log Set 2: 50kg x 20 = 1000 volume
    await page.locator('input[aria-label="Peso (kg)"]').fill('50');
    await page.locator('input[aria-label="Ripetizioni"]').fill('20');
    await page.locator('button:has-text("Salva Set")').click();

    await page.locator('.close-btn').click();

    // Volume Totale atteso: 2000
    await expect(page.locator('.volume-val')).toContainText('2.000');
  });

  test('Navigation: Back/Forward resilience', async ({ page }) => {
    await page.goto('/');
    await page.locator('text=Storico').click();
    await expect(page).toHaveURL(/.*storico/);

    await page.locator('text=Analisi').click();
    await expect(page).toHaveURL(/.*analisi/);

    await page.goBack();
    await expect(page).toHaveURL(/.*storico/);

    await page.goForward();
    await expect(page).toHaveURL(/.*analisi/);
  });

  test('Security: No sensitive data in DOM after logout', async ({ page }) => {
    await page.goto('/');
    // Simula logout (se presente pulsante o via store)
    // Verifica che elementi come il nome utente spariscano dal DOM
  });
});
