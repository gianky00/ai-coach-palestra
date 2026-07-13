# KineFit — Linee guida testing (Mobile)

## Stack attuale

| Livello        | Tool                         | Stato          |
| -------------- | ---------------------------- | -------------- |
| Unit test      | Vitest (`mobile/__tests__/`) | ✅ Attivo      |
| Coverage       | `@vitest/coverage-v8`        | ✅ CI          |
| Component test | React Native Testing Library | 🔜 Futuro      |
| E2E mobile     | Maestro (`.maestro/flows/`)  | ✅ Configurato |

## Struttura

```
mobile/
├── __tests__/
│   ├── helpers/
│   │   └── supabaseMock.ts
│   ├── lib/
│   │   ├── utils.test.ts
│   │   ├── profileMappers.test.ts
│   │   └── offlineSync.test.ts
│   └── services/
│       └── profileService.test.ts
├── vitest.config.ts
└── package.json             # npm test / test:coverage / e2e

.maestro/
├── flows/
│   ├── login.yaml
│   └── navigation.yaml
└── README.md
```

I test unitari importano moduli con mock per Supabase, NetInfo e SQLite.

## Cosa testare

**Priorità alta (logica pura):**

- `utils.ts` — calcoli, merge offline, date
- `profileMappers.ts` — mapping campi DB (row ↔ app)

**Priorità media (con mock):**

- `offlineSync.ts` — queue, sync, save/delete offline
- `profileService.ts` — fetch/save con mock Supabase
- `analyticsService.ts` — RPC (mock)

**E2E (Maestro):**

- Login → tab Oggi visibile
- Navigazione tra tab

## Convenzioni

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('myModule', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does something', () => {
    expect(true).toBe(true);
  });
});
```

- Nome file: `*.test.ts`
- Mock Supabase: `__tests__/helpers/supabaseMock.ts`
- Reset lock sync: `__resetSyncStateForTests()` in offlineSync

## Comandi

```bash
npm run validate              # typecheck + test (root)
npm run mobile:test           # solo Vitest
npm run mobile:test:coverage  # coverage + soglie (30%)
cd mobile && npm run test:watch
cd mobile && npm run e2e      # Maestro (device richiesto)
```

### Maestro E2E

```bash
export MAESTRO_TEST_EMAIL="test@example.com"
export MAESTRO_TEST_PASSWORD="secret"
cd mobile && npm run e2e
```

Vedi [.maestro/README.md](../.maestro/README.md).

## CI

GitHub Actions (`.github/workflows/ci.yml`):

- Format, lint, typecheck
- Vitest unit test
- Coverage report con soglie minime

E2E Maestro **non** in CI (richiede emulatore). Usare Maestro Cloud per pipeline E2E.

## Target coverage

| Fase      | Target                               |
| --------- | ------------------------------------ |
| Fase 2    | utils, profileMappers                |
| Fase 5    | + offlineSync, profileService (30%)  |
| Obiettivo | 70% su `mobile/src/lib` e `services` |
