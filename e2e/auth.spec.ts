import { expect, test } from '@playwright/test';

test.describe('KineFit Authentication & Basic Navigation E2E Tests', () => {
  // Test 1: Accesso alla pagina da utente non autenticato (deve mostrare la form di login)
  test('should redirect to auth page when not logged in', async ({ page }) => {
    // Intercettiamo la chiamata iniziale per verificare la sessione (restituiamo null per simulare sessione assente)
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Auth session missing' }),
      });
    });

    await page.goto('/');

    // Verifica che la pagina mostri la card di login
    await expect(page.locator('.auth-card')).toBeVisible();
    await expect(page.locator('.title')).toContainText('KINE');
    await expect(page.locator('.subtitle')).toContainText('Bentornato, atleta');
  });

  // Test 2: Toggle tra Login e Registrazione
  test('should toggle between login and registration states', async ({ page }) => {
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({ status: 400, body: JSON.stringify({ error: 'Auth session missing' }) });
    });

    await page.goto('/');

    // Clicca sul pulsante per registrare un nuovo account
    const toggleBtn = page.locator('.toggle-btn');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    // La descrizione dovrebbe essere cambiata
    await expect(page.locator('.subtitle')).toContainText('Crea un nuovo account');
    await expect(page.locator('.save-btn')).toContainText('Registrati');

    // Torna indietro a Login
    await toggleBtn.click();
    await expect(page.locator('.subtitle')).toContainText('Bentornato, atleta');
    await expect(page.locator('.save-btn')).toContainText('Accedi');
  });

  // Test 3: Tentativo di login fallito (errore da Supabase)
  test('should show error message on failed login', async ({ page }) => {
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({ status: 400, body: JSON.stringify({ error: 'Auth session missing' }) });
    });

    // Intercettiamo la richiesta di login fallita
    await page.route('**/auth/v1/token?grant_type=password', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_credentials', message: 'Credenziali non valide.' }),
      });
    });

    await page.goto('/');

    // Compila la form di login
    await page.locator('input[type="email"]').fill('test@kinefit.it');
    await page.locator('input[type="password"]').fill('passworderrata');

    // Invia
    await page.locator('.save-btn').click();

    // Dovrebbe comparire il messaggio di errore
    const errorMessage = page.locator('.auth-message.error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Credenziali non valide.');
  });

  // Test 4: Login di successo e navigazione della dashboard
  test('should login successfully and navigate through views', async ({ page }) => {
    // 1. Mock sessione mancante all'avvio
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({ status: 400, body: JSON.stringify({ error: 'Auth session missing' }) });
    });

    // 2. Mock della richiesta di login (successo)
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

    // 3. Mock delle chiamate API REST di caricamento dati (esercizi, sessioni, profilo)
    await page.route('**/rest/v1/profiles?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'fake-user-id-123', full_name: 'Atleta Test' }]),
      });
    });

    await page.route('**/rest/v1/exercises?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', name: 'Panca Piana', muscle_group: 'Petto', is_custom: false },
          { id: '2', name: 'Squat', muscle_group: 'Gambe', is_custom: false },
        ]),
      });
    });

    await page.route('**/rest/v1/workout_sessions?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/');

    // Compila la form ed esegue il login
    await page.locator('input[type="email"]').fill('test@kinefit.it');
    await page.locator('input[type="password"]').fill('passwordcorretta');
    await page.locator('.save-btn').click();

    // Verifica che l'utente sia entrato nella dashboard OggiView
    // Dovrebbe mostrare la bottom nav bar
    await expect(page.locator('.bottom-nav')).toBeVisible();

    // Attendi la stabilizzazione dell'UI controllando che il pulsante START sia visibile
    await expect(page.locator('.pro-start-btn')).toBeVisible({ timeout: 10000 });

    // Clicca sulla voce "Storico" della barra di navigazione

    const storicoNav = page.locator('a.nav-item[href="/storico"]');
    await expect(storicoNav).toBeVisible();
    await page.waitForTimeout(300); // attesa transizione
    await storicoNav.click();
    await expect(page.url()).toContain('/storico');

    // Clicca sulla voce "Analisi"
    const analisiNav = page.locator('a.nav-item[href="/analisi"]');
    await expect(analisiNav).toBeVisible();
    await page.waitForTimeout(300);
    await analisiNav.click();
    await expect(page.url()).toContain('/analisi');

    // Clicca sulla voce "Timer"
    const timerNav = page.locator('a.nav-item[href="/timer"]');
    await expect(timerNav).toBeVisible();
    await page.waitForTimeout(300);
    await timerNav.click();
    await expect(page.url()).toContain('/timer');

    // Clicca sulla voce "Info"
    const infoNav = page.locator('a.nav-item[href="/info"]');
    await expect(infoNav).toBeVisible();
    await page.waitForTimeout(300);
    await infoNav.click();
    await expect(page.url()).toContain('/info');
  });
});
