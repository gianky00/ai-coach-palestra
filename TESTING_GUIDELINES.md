# 🧪 KineFit Testing Guidelines

Questo documento definisce le linee guida, le architetture e le best practice per il testing all'interno del progetto KineFit. L'obiettivo è mantenere una code coverage elevata (target >75%) e prevenire regressioni, garantendo un'esperienza utente impeccabile.

## 🏗 Architettura di Testing

Il progetto utilizza un approccio di testing a tre livelli ("Test Pyramid" ottimizzata per frontend):

1.  **Unit Tests (Vitest)**: Coprono la logica pura, i servizi (es. calcoli, chiamate API isolate) e gli hook personalizzati.
2.  **Integration / Component Tests (Vitest + React Testing Library)**: Verificano il corretto rendering dei componenti UI, le interazioni dell'utente (click, input) e l'integrazione tra componenti isolando le dipendenze esterne (tramite mock).
3.  **End-to-End (E2E) Tests (Playwright)**: Verificano i flussi utente completi (es. login, creazione allenamento, salvataggio) interagendo con l'applicazione reale (o un database di test/staging).

## 🛠 Stack Tecnologico

*   **Test Runner & Unit:** [Vitest](https://vitest.dev/)
*   **Component Testing:** [React Testing Library (RTL)](https://testing-library.com/docs/react-testing-library/intro/)
*   **E2E Testing:** [Playwright](https://playwright.dev/)
*   **Mocking:** `vi` (integrato in Vitest)

---

## 📜 Best Practice e Convenzioni

### 1. Naming e Struttura dei File
*   I file di test devono risiedere nella stessa cartella del file che stanno testando.
*   La nomenclatura deve essere `[nome-file].test.ts` o `[nome-file].test.tsx`.
*   Struttura i blocchi `describe` rispecchiando il nome del componente o del servizio. Usa blocchi nidificati per i metodi o i sotto-stati principali.

```typescript
// src/services/myService.test.ts
describe('myService', () => {
  describe('calculateSomething()', () => {
    it('should return correct value when...', () => { ... });
  });
});
```

### 2. Selettori nei Component Tests (RTL)
*   **Priorità 1: Selettori accessibili.** Usa `getByRole`, `getByLabelText`, `getByPlaceholderText`. Questi garantiscono che l'app sia accessibile agli screen reader.
*   **Priorità 2: Test IDs.** Se un elemento non ha un ruolo chiaro o il testo cambia dinamicamente, aggiungi un attributo `data-testid="nome-elemento"` e usa `getByTestId`.
*   **Testo Flessibile:** Per evitare test fragili a causa di formattazioni (es. `1.000` vs `1000`), usa espressioni regolari o funzioni custom matcher con `getByText`.

```tsx
// ❌ Sconsigliato (Fragile)
expect(screen.getByText('1.000 kg')).toBeInTheDocument();

// ✅ Consigliato (Flessibile)
expect(screen.getByText(/1[.,]?000\s*kg/i)).toBeInTheDocument();
```

### 3. Gestione dell'Asincronia (Wait & Act)
React Testing Library è molto severa riguardo agli aggiornamenti di stato asincroni.
*   Usa sempre `await waitFor(...)` o i query asincroni come `await screen.findByText(...)` quando ti aspetti che l'UI cambi dopo un'interazione o un fetch dei dati.
*   Assicurati che i componenti non siano in stato di "loading" prima di cercare elementi definitivi.

```tsx
// Aspetta che il loader sparisca prima di fare asserzioni
await waitFor(() => {
  expect(screen.queryByText(/Caricamento/i)).not.toBeInTheDocument();
});
```

### 4. Mocking delle Dipendenze Esterne
Non chiamare mai servizi reali (Supabase, API esterne) nei test Unitari o di Componente.
*   **Supabase:** Mocka sempre le risposte del DB. La struttura concatenata (`.from().select().eq()`) richiede mock specifici. Guarda `sessionService.test.ts` per esempi.
*   **IndexedDB:** Per i test offline, usa i mock definiti in `indexedDb.test.ts` per simulare le transazioni locali.
*   **Servizi Esterni/Librerie Visive:** Librerie come `recharts` o `canvas-confetti` possono causare errori in ambiente Node/JSDOM. Mockale restituendo componenti vuoti.

```tsx
// Esempio Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  // ... altri componenti SVG
}));
```

### 5. Ripristino dello Stato (Teardown)
Pulisci sempre i mock e lo stato prima di ogni test per evitare interferenze ("test leakage").

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

---

## 🚀 E2E Testing con Playwright

I test Playwright si trovano nella cartella `/e2e`.

### Quando scrivere un test E2E?
Scrivi un test E2E solo per i **flussi critici dell'utente (Happy Paths)**:
*   Registrazione e Login.
*   Avvio e completamento di una sessione di allenamento.
*   Visualizzazione corretta dello storico e delle statistiche.

### Regole d'oro per E2E:
1.  **Non abusarne:** I test E2E sono lenti e complessi da manutenere. Usa i test di Componente per i dettagli dell'UI.
2.  **Isolamento dei Dati:** I test devono poter girare in parallelo senza pestarsi i piedi. Usa account di test dinamici o pulisci il database di staging prima di ogni esecuzione.
3.  **Resilienza:** Usa gli auto-waiting di Playwright (`await page.locator('.btn').click()`) invece di sleep statici (`page.waitForTimeout()`).

---

## 🏃‍♂️ Comandi Utili

*   **Esegui tutti i test unitari/componente:** `npm run test`
*   **Esegui e calcola la Coverage:** `npm run test:coverage`
*   **Esegui i test E2E:** `npx playwright test`
*   **Visualizza report E2E:** `npx playwright show-report`

> "Test code is just as important as production code. Keep it clean, DRY, and focused on behavior, not implementation details."
