import { test, expect } from '@playwright/test';

test.describe('KineFit Workout Session & Exercise Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Mock dell'utente loggato
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'fake-user-id-123',
          email: 'test@kinefit.it',
          role: 'authenticated',
          aud: 'authenticated',
        }),
      });
    });

    // 2. Mock del token di autenticazione per il login riuscito
    await page.route('**/auth/v1/token?grant_type=password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'fake-jwt-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'fake-refresh-token',
          user: {
            id: 'fake-user-id-123',
            email: 'test@kinefit.it',
            role: 'authenticated',
            aud: 'authenticated',
          },
        }),
      });
    });

    // 3. Mock del profilo utente
    await page.route('**/rest/v1/profiles?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'fake-user-id-123', full_name: 'Atleta Test' }]),
      });
    });

    // 4. Mock della lista esercizi di oggi
    await page.route('**/rest/v1/exercises?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'ex-1',
            name: 'Panca Piana',
            muscle_group: 'Petto',
            target_sets: 4,
            target_reps: '8-10',
            notes: '',
            user_id: 'fake-user-id-123',
          },
          {
            id: 'ex-2',
            name: 'Squat',
            muscle_group: 'Gambe',
            target_sets: 3,
            target_reps: '6-8',
            notes: '',
            user_id: 'fake-user-id-123',
          },
        ]),
      });
    });

    // 5. Mock dei log fatti oggi (nessun log registrato all'inizio)
    await page.route('**/rest/v1/training_logs?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
  });

  // Test 1: Dashboard in stato non attivo (Mostra START e Suggerimento)
  test('should display start button and training nudge when no active session', async ({
    page,
  }) => {
    // Mock nessuna sessione attiva
    await page.route('**/rest/v1/workout_sessions?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    // Login ed entrata in OggiView
    await page.goto('/');
    await page.locator('input[type="email"]').fill('test@kinefit.it');
    await page.locator('input[type="password"]').fill('passwordcorretta');
    await page.locator('.save-btn').click();

    // Attendi la bottom nav
    await expect(page.locator('.bottom-nav')).toBeVisible({ timeout: 10000 });

    // Verifica la presenza di START e del nudge informativo
    await expect(page.locator('.pro-start-btn')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.glass-nudge')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.glass-nudge')).toContainText(
      'Pronti per la sessione? Clicca su Start!',
    );
  });

  // Test 2: Fine di una sessione attiva (Stato attivo all'avvio)
  test('should end active workout session successfully', async ({ page }) => {
    // Mock sessione attiva presente fin dal primo caricamento
    const activeSessionMock = {
      id: 'fake-session-999',
      user_id: 'fake-user-id-123',
      status: 'active',
      start_time: new Date().toISOString(),
    };

    await page.route('**/rest/v1/workout_sessions?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(activeSessionMock),
      });
    });

    // Mock della chiamata PATCH per terminare la sessione
    await page.route('**/rest/v1/workout_sessions?id=eq.fake-session-999', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'fake-session-999',
          status: 'completed',
          end_time: new Date().toISOString(),
        }),
      });
    });

    // Login ed entrata in OggiView
    await page.goto('/');
    await page.locator('input[type="email"]').fill('test@kinefit.it');
    await page.locator('input[type="password"]').fill('passwordcorretta');
    await page.locator('.save-btn').click();

    // Attendi la bottom nav
    await expect(page.locator('.bottom-nav')).toBeVisible({ timeout: 10000 });

    // La dashboard deve caricare direttamente con il pulsante STOP visibile e senza nudge
    const stopBtn = page.locator('.pro-end-btn');
    await expect(stopBtn).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.glass-nudge')).not.toBeVisible();

    // Gestiamo il dialog di conferma fine allenamento
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain("Terminare l'allenamento?");
      await dialog.accept();
    });

    // Clicchiamo su STOP per concludere
    await stopBtn.click();

    // Dovrebbe ripristinare il pulsante START
    await expect(page.locator('.pro-start-btn')).toBeVisible({ timeout: 10000 });
  });

  // Test 3: Apertura del Modale di Aggiunta Esercizio
  test('should open add exercise modal when clicking plus button', async ({ page }) => {
    // Mock nessuna sessione attiva
    await page.route('**/rest/v1/workout_sessions?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    // Login ed entrata
    await page.goto('/');
    await page.locator('input[type="email"]').fill('test@kinefit.it');
    await page.locator('input[type="password"]').fill('passwordcorretta');
    await page.locator('.save-btn').click();

    // Attendi stabilizzazione
    await expect(page.locator('.bottom-nav')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.pro-start-btn')).toBeVisible({ timeout: 10000 });

    // Trova e clicca sul bottone "+" per aggiungere un esercizio
    const addExBtn = page.locator('.pro-add-btn');
    await expect(addExBtn).toBeVisible();
    await addExBtn.click();

    // Verifica che compaia l'interfaccia dell'AddExerciseModal (h2 con classe modal-title)
    const modalTitle = page.locator('h2.modal-title');
    await expect(modalTitle).toBeVisible();
    await expect(modalTitle).toContainText('Nuovo Esercizio');
  });
});
