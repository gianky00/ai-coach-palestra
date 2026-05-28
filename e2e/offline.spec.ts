import { expect, test } from '@playwright/test';

/**
 * KineFit Offline Mode E2E Test Suite
 *
 * Obiettivo: Verificare la resilienza dell'app in assenza di connessione.
 */
test.describe('Offline Mode Resilience', () => {
  test.beforeEach(async ({ page }) => {
    const userId = 'offline-user-123';
    const projectRef = 'ekckzmihqswqfglowpwk';

    // Iniezione sessione
    await page.addInitScript(
      ({ userId, projectRef }) => {
        const session = {
          access_token: 'header.payload.signature',
          refresh_token: 'fake-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: userId,
            email: 'offline@kinefit.it',
            aud: 'authenticated',
            role: 'authenticated',
          },
        };
        window.localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify(session));
      },
      { userId, projectRef },
    );

    // Mock Network granulare
    await page.route(`https://${projectRef}.supabase.co/rest/v1/**`, async (route) => {
        const url = route.request().url();

        if (url.includes('profiles')) {
        return route.fulfill({
          status: 200,
          body: JSON.stringify([{ id: userId, full_name: 'Offline User' }]),
        });
      }
      if (url.includes('exercises')) {
        return route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: 'ex-1',
              name: 'Panca Piana',
              muscle_group: 'Petto',
              target_sets: 3,
              target_reps: '10',
              notes: '',
            },
          ]),
        });
      }
      if (url.includes('workout_sessions')) {
        return route.fulfill({ status: 200, body: JSON.stringify([]) });
      }
      if (url.includes('training_logs')) {
        return route.fulfill({ status: 200, body: JSON.stringify([]) });
      }
      route.fulfill({ status: 200, body: '[]' });
    });
  });

  test('should handle full workout lifecycle while offline and sync when online', async ({
    page,
    context,
  }) => {
    // 1. Caricamento app (già autenticata via LocalStorage)
    await page.goto('/', { waitUntil: 'networkidle' });

    // Attesa caricamento dashboard
    await expect(page.locator('.bottom-nav')).toBeVisible({ timeout: 15000 });

    // 2. Transizione OFFLINE
    await context.setOffline(true);
    // Simula anche navigator.onLine per sicurezza se l'app non reagisce subito
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { get: () => false });
      window.dispatchEvent(new Event('offline'));
    });

    // 3. Inizio allenamento offline
    const startBtn = page.locator('.pro-start-btn');
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Verifica feedback offline
    await expect(page.locator('text=Offline: Allenamento iniziato localmente')).toBeVisible();

    // 4. Registriamo un set
    await page.locator('text=Panca Piana').first().click();
    await expect(page.locator('h2.modal-title')).toContainText('Panca Piana');

    await page.locator('input[aria-label="Peso (kg)"]').fill('80');
    await page.locator('input[aria-label="Ripetizioni"]').fill('10');
    await page.locator('button:has-text("Salva Set")').click();

    await expect(page.locator('text=Offline: Set salvato localmente')).toBeVisible();

    // Chiudiamo il modale
    await page.locator('.close-btn').click();

    // 5. Terminiamo offline
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.locator('.pro-end-btn').click();
    await expect(page.locator('text=Offline: Allenamento terminato localmente')).toBeVisible();

    await expect(page.locator('text=Ottimo Lavoro!')).toBeVisible();
    await page.locator('button:has-text("Chiudi")').click();

    // 6. Verifica coda offline nel Profilo
    await page.locator('button:has-text("Profilo")').click();
    await page.locator('text=Info & Novità').click();
    // 1 sessione + 1 log = 2
    await expect(page.locator('text=Coda Offline: 2 set')).toBeVisible();
    await page.locator('button:has-text("Chiudi Finestra")').click();

    // 7. Ritorno ONLINE e Sincronizzazione
    let sessionSynced = false;
    let logSynced = false;

    // Aggiorniamo le rotte per la fase di sync
    await page.route('**/rest/v1/workout_sessions', async (route) => {
      if (route.request().method() === 'POST') {
        sessionSynced = true;
        await route.fulfill({ status: 201, body: JSON.stringify({ id: 'real-id-from-db' }) });
      } else {
        await route.continue();
      }
    });

    await page.route('**/rest/v1/training_logs', async (route) => {
      if (route.request().method() === 'POST') {
        logSynced = true;
        await route.fulfill({ status: 201, body: JSON.stringify({}) });
      } else {
        await route.continue();
      }
    });

    await context.setOffline(false);
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { get: () => true });
      window.dispatchEvent(new Event('online'));
    });

    // Attendiamo la sincronizzazione automatica (gestita da offlineSync.ts)
    await expect.poll(() => sessionSynced, { timeout: 15000 }).toBeTruthy();
    await expect.poll(() => logSynced, { timeout: 15000 }).toBeTruthy();

    await expect(page.locator('text=Sincronizzazione completata!')).toBeVisible();

    // Verifica coda svuotata
    await page.locator('text=Info & Novità').click();
    await expect(page.locator('text=Coda Offline: 0 set')).toBeVisible();
  });
});
