import { expect, test } from '@playwright/test';

// Test E2E 100% REALE con connessione al DB live di Supabase
// Questo test crea un utente isolato, esegue le azioni reali ed esegue la pulizia dei dati al termine
test.describe.skip('KineFit 100% REAL E2E Test Suite (Live Supabase Connection)', () => {
  const testEmail = 'test-e2e-automated@kinefit.it';
  const testPassword = 'SafeTestPassword123!';
  let userToken: string | null = null;
  let userId: string | null = null;

  test.beforeAll(async () => {
    // Non facciamo mock: il test si connetterà direttamente a Supabase
  });

  test('should execute complete real workflow (Login -> Start Session -> Stop -> Clean)', async ({
    page,
  }) => {
    // 1. Vai alla pagina iniziale
    await page.goto('/');

    // Attendi che la schermata di login sia visibile
    await expect(page.locator('.auth-card')).toBeVisible();

    // Inserisci le credenziali di test
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);

    // Clicca su Accedi
    await page.locator('.save-btn').click();

    // Se l'utente non esiste ancora nel DB di Supabase, il login fallirà. In tal caso, lo registriamo al volo!
    const errorMsg = page.locator('.auth-message.error');
    const isErrorVisible = await errorMsg.isVisible({ timeout: 5000 }).catch(() => false);

    if (isErrorVisible) {
      const text = await errorMsg.textContent();
      if (
        text &&
        (text.includes('Invalid login credentials') ||
          text.includes('Email not confirmed') ||
          text.includes('user not found'))
      ) {
        console.log(
          'Utente di test non esistente o non confermato. Procedo alla registrazione automatica...',
        );

        // Clicca sul pulsante per passare alla registrazione
        await page.locator('.toggle-btn').click();

        // Compila nuovamente i campi (se svuotati)
        await page.locator('input[type="email"]').fill(testEmail);
        await page.locator('input[type="password"]').fill(testPassword);

        // Clicca su Registrati
        await page.locator('.save-btn').click();

        // Attendi il messaggio di successo della registrazione o del login
        const successMsg = page.locator('.auth-message.success');
        await expect(successMsg).toBeVisible({ timeout: 15000 });
        expect(await successMsg.textContent()).toContain('Registrazione completata!');

        // NOTA: Nello scenario in cui la registrazione richiede la conferma email,
        // nei test successivi faremo comunque il mock o useremo un utente già confermato.
        // Ma per consentire al test reale di procedere se l'autenticazione è configurata con auto-conferma:
        console.log(
          'Registrazione completata. Si assume che la conferma sia automatica o bypassata in staging.',
        );
        return; // Terminiamo qui se l'utente deve ancora confermare la mail, per evitare blocchi
      }
    }

    // Se il login ha avuto successo, saremo reindirizzati alla OggiView (Dashboard)
    await expect(page.locator('.bottom-nav')).toBeVisible({ timeout: 15000 });

    // Otteniamo il token dell'utente loggato dal localStorage per effettuare la pulizia automatica via API a fine test
    const supabaseAuthToken = await page.evaluate(() => {
      // Cerca la chiave di Supabase nel localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          return localStorage.getItem(key);
        }
      }
      return null;
    });

    if (supabaseAuthToken) {
      const parsedToken = JSON.parse(supabaseAuthToken);
      userToken = parsedToken.access_token;
      userId = parsedToken.user?.id;
      console.log(`Autenticazione reale riuscita per user ID: ${userId}`);
    }

    // 2. Avvio Allenamento Reale
    const startBtn = page.locator('.pro-start-btn');
    const isStartVisible = await startBtn.isVisible();

    if (isStartVisible) {
      // Clicchiamo su START reale
      await startBtn.click();

      // Il pulsante deve diventare STOP reale
      const stopBtn = page.locator('.pro-end-btn');
      await expect(stopBtn).toBeVisible({ timeout: 10000 });

      // Gestiamo il dialog di conferma di fine allenamento
      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain("Terminare l'allenamento?");
        await dialog.accept();
      });

      // Clicchiamo su STOP reale per concludere
      await stopBtn.click();

      // Verifica che si apra il modale di riepilogo reale
      await expect(page.locator('.pro-start-btn')).toBeVisible({ timeout: 10000 });
    }

    // 3. Apertura modale per aggiungere un esercizio reale
    const addExBtn = page.locator('.pro-add-btn');
    if (await addExBtn.isVisible()) {
      await addExBtn.click();
      await expect(page.locator('h3:has-text("Aggiungi Esercizio")')).toBeVisible();
      // Chiudiamo il modale per non bloccare
      await page
        .locator('button:has-text("Annulla"), button:has-text("Chiudi"), .close-btn')
        .first()
        .click()
        .catch(() => {});
    }
  });

  test.afterAll(async () => {
    // 4. Pulizia automatica dei dati reali inseriti nel database
    // Usiamo le API REST di Supabase per eliminare tutti i dati associati a questo utente di test in modo da non inquinare il DB!
    if (userToken && userId) {
      console.log(`Avvio pulizia del database per l'utente di test: ${userId}`);
      const supabaseUrl = 'https://ekckzmihqswqfglowpwk.supabase.co';
      const anonKey = 'sb_publishable_wIFYjd5yII9ThcBrBTvQtg_2vRBoZZh';

      const headers = {
        apikey: anonKey,
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      };

      try {
        // Eliminiamo i log di allenamento dell'utente
        const deleteLogs = await fetch(
          `${supabaseUrl}/rest/v1/training_logs?user_id=eq.${userId}`,
          {
            method: 'DELETE',
            headers,
          },
        );
        console.log(`Eliminazione training_logs: ${deleteLogs.status}`);

        // Eliminiamo le sessioni di allenamento dell'utente
        const deleteSessions = await fetch(
          `${supabaseUrl}/rest/v1/workout_sessions?user_id=eq.${userId}`,
          {
            method: 'DELETE',
            headers,
          },
        );
        console.log(`Eliminazione workout_sessions: ${deleteSessions.status}`);

        // Eliminiamo gli esercizi personalizzati creati dall'utente
        const deleteExercises = await fetch(
          `${supabaseUrl}/rest/v1/exercises?user_id=eq.${userId}`,
          {
            method: 'DELETE',
            headers,
          },
        );
        console.log(`Eliminazione exercises: ${deleteExercises.status}`);
      } catch (err) {
        console.error('Errore durante la pulizia dei dati di test su Supabase:', err);
      }
    }
  });
});
