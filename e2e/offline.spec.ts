import { expect, test } from '@playwright/test';

/**
 * KineFit Offline Mode E2E Test Suite
 * 
 * Obiettivo: Verificare la resilienza dell'app in assenza di connessione.
 */
test.describe('Offline Mode Resilience', () => {
  
  test.beforeEach(async ({ page }) => {
    // Logging per debugging automatico
    page.on('console', msg => {
        if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
    });

    // Mock Auth
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'offline-user-123', email: 'offline@kinefit.it' }),
      });
    });

    await page.route('**/auth/v1/token?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'fake-jwt',
          user: { id: 'offline-user-123', email: 'offline@kinefit.it' },
        }),
      });
    });

    // Mock Rest API
    await page.route('**/rest/v1/profiles?**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([{ id: 'u1', full_name: 'Offline User' }]) });
    });

    await page.route('**/rest/v1/exercises?**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([
          { id: 'ex-1', name: 'Panca Piana', muscle_group: 'Petto', target_sets: 3, target_reps: '10' }
        ]),
      });
    });

    // Mock sessione (inizialmente nessuna attiva)
    await page.route('**/rest/v1/workout_sessions?**', async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.route('**/rest/v1/training_logs?**', async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });
  });

  test('should handle full workout lifecycle while offline and sync when online', async ({ page, context }) => {
    // 1. Login ONLINE
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Assicuriamoci che il form sia carico
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 15000 });
    
    await emailInput.fill('offline@kinefit.it');
    await page.locator('input[type="password"]').fill('password');
    
    // Clicca sul pulsante di login (identificato come .save-btn nei test esistenti)
    await page.locator('button:has-text("Accedi"), .save-btn').click();

    // Attesa redirezione alla dashboard
    await expect(page.locator('.bottom-nav')).toBeVisible({ timeout: 20000 });

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
