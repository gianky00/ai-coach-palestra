import { expect, test } from '@playwright/test';

test.describe('KineFit Workout Session & Exercise Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Mock dell'utente loggato all'avvio
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

    // 2. Mock del profilo utente
    await page.route('**/rest/v1/profiles?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'fake-user-id-123', full_name: 'Atleta Test' }]),
      });
    });

    // 3. Mock della lista esercizi di oggi
    await page.route('**/rest/v1/exercises?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'ex-1',
            name: 'Panca Piana',
            category: 'Petto',
            target_sets: 4,
            target_reps: '8-10',
            notes: '',
            user_id: 'fake-user-id-123',
          },
          {
            id: 'ex-2',
            name: 'Squat',
            category: 'Gambe',
            target_sets: 3,
            target_reps: '6-8',
            notes: '',
            user_id: 'fake-user-id-123',
          },
        ]),
      });
    });

    // 4. Mock dei log fatti oggi (nessun log registrato all'inizio)
    await page.route('**/rest/v1/training_logs?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
  });

  // Test 1: Avvio e Terminazione dell'Allenamento
  test('should start and end a workout session successfully', async ({ page }) => {
    interface FakeSession {
      id: string;
      user_id: string;
      status: string;
      start_time: string;
    }
    // Mock nessuna sessione attiva
    let activeSessionResponse: FakeSession[] = [];

    await page.route('**/rest/v1/workout_sessions?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(activeSessionResponse),
      });
    });

    // Mock della creazione sessione (POST)
    await page.route('**/rest/v1/workout_sessions', async (route) => {
      if (route.request().method() === 'POST') {
        activeSessionResponse = [
          {
            id: 'fake-session-999',
            user_id: 'fake-user-id-123',
            status: 'active',
            start_time: new Date().toISOString(),
          },
        ];
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(activeSessionResponse[0]),
        });
      } else {
        await route.fallback();
      }
    });

    // Mock dell'aggiornamento sessione (PATCH per chiuderla)
    await page.route('**/rest/v1/workout_sessions?id=eq.fake-session-999', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'fake-session-999',
            status: 'completed',
            end_time: new Date().toISOString(),
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/');

    // Dovrebbe mostrare OggiView con il suggerimento per iniziare l'allenamento
    await expect(page.locator('.glass-nudge')).toBeVisible();
    await expect(page.locator('.glass-nudge')).toContainText(
      'Pronti per la sessione? Clicca su Start!',
    );

    // Clicca su START
    const startBtn = page.locator('.pro-start-btn');
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Il suggerimento dovrebbe scomparire e il bottone dovrebbe diventare STOP
    await expect(page.locator('.glass-nudge')).not.toBeVisible();
    const stopBtn = page.locator('.pro-end-btn');
    await expect(stopBtn).toBeVisible();

    // Gestiamo il dialog di conferma di fine allenamento
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain("Terminare l'allenamento?");
      await dialog.accept();
    });

    // Clicchiamo su STOP per concludere
    await stopBtn.click();

    // Dovrebbe comparire il modale del summary (WorkoutSummaryModal)
    await expect(page.locator('.pro-start-btn')).toBeVisible();
  });

  // Test 2: Apertura del Modale di Aggiunta Esercizio
  test('should open add exercise modal when clicking plus button', async ({ page }) => {
    // Mock nessuna sessione attiva
    await page.route('**/rest/v1/workout_sessions?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/');

    // Trova e clicca sul bottone "+" per aggiungere un esercizio
    const addExBtn = page.locator('.pro-add-btn');
    await expect(addExBtn).toBeVisible();
    await addExBtn.click();

    // Verifica che compaia l'interfaccia dell'AddExerciseModal
    const modalTitle = page.locator('h3:has-text("Aggiungi Esercizio")');
    await expect(modalTitle).toBeVisible();
  });
});
