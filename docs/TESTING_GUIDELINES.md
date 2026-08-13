# KineFit — Linee guida testing (Mobile)

Build/run sotto test: **bare React Native + Android Studio + Gradle** (`mobile/android`) con **Metro** per il JS.  
Procedure device/smoke dettagliate in [VERIFY.md](../mobile/VERIFY.md) e [SETUP_ANDROID.md](../mobile/SETUP_ANDROID.md).

**Device UI di riferimento:** emulatore **Pixel 9A** (ADB / Maestro / `verify:ui`).

## Stack attuale

| Livello        | Tool                                       | Stato             |
| -------------- | ------------------------------------------ | ----------------- |
| Unit test      | Vitest (`mobile/__tests__/`)               | Attivo            |
| Coverage       | `@vitest/coverage-v8`                      | CI Gate E         |
| Gate locali    | `scripts/android/verify-gates.ps1` A–H     | Attivo            |
| UI smoke (adb) | `verify_ui.ps1` / `verify_ui_full.ps1`     | Locale (Pixel 9A) |
| Build          | Android Studio / Gradle (`mobile/android`) | Ufficiale         |
| E2E mobile     | Maestro (`.maestro/flows/`)                | Locale            |
| Component test | React Native Testing Library               | Futuro            |

## Struttura

```
mobile/
├── __tests__/
│   ├── helpers/supabaseMock.ts
│   ├── lib/          # utils, profileMappers, offlineSync, smokeMode
│   └── services/     # profileService, garminService, analyticsService
├── SETUP_ANDROID.md
├── VERIFY.md
├── vitest.config.ts
└── package.json

scripts/android/
├── lib/android-env.ps1          # SDK + AVD Pixel_9A helpers
├── ensure-emulator.ps1          # npm run android:emulator
├── verify-gates.ps1
├── verify_ui.ps1
├── verify_ui_full.ps1
├── prebuild-android.ps1 / assemble-debug.ps1 / install-debug.ps1 / open-studio.ps1
└── .ui-shots/

.maestro/flows/
├── login.yaml
└── navigation.yaml
```

## Gate A–H + suite bug-finding

| Suite                | Comando                        | Cosa cattura                            |
| -------------------- | ------------------------------ | --------------------------------------- |
| Unit + bug-finding   | `npm run mobile:test`          | e1RM, PR, date, heatmap, CSV, services  |
| View contracts       | incluso in Vitest              | testID obbligatori per ogni vista       |
| Gate A–E             | `npm run gate`                 | format/lint/typecheck/test/coverage     |
| Smoke tutte le viste | `cd mobile; npm run e2e:smoke` | Maestro deep-link (device)              |
| UI adb full          | `npm run verify:ui:full`       | Auth + 4 tab smoke (Pixel 9a)           |
| Emulator Pixel 9a    | `npm run android:emulator`     | Boot/create AVD `Pixel_9A` / `Pixel_9a` |

### Bug già individuati e corretti da questa suite

- `calculateE1RM` Infinity su reps alte
- `isPersonalRecord(0,0)` falso positivo
- PlateCalculator vs `calculatePlates` messaggi divergenti
- History/Analytics fetch senza `enabled: !!user`
- `user!.id` crash risk in onboarding
- Analytics date UTC vs locale
- Offline heatmap sempre `Varie` (ora normalizza gruppi)

Policy auto-verify: **zero login reale**, **zero Garmin OAuth**. Deep-link `kinefit://smoke/...` — vedi [VERIFY.md](../mobile/VERIFY.md).

## Cosa testare

**Priorità alta (logica pura):**

- `utils.ts`, `profileMappers.ts`, `smokeMode.ts`

**Priorità media (con mock):**

- `offlineSync.ts`, `profileService.ts`, `analyticsService.ts`, `garminService.ts`

**E2E / UI:**

- Device ufficiale: emulatore **Pixel 9a** (`Pixel_9A` / `Pixel_9a`) via Android Studio / `npm run android:emulator`
- Smoke adb (Auth + tab) senza credenziali — deep-link `kinefit://smoke/...`
- Maestro login → tab (account test)

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

```powershell
npm run validate              # typecheck + test (root)
npm run gate                  # Gate A–E
npm run mobile:test
npm run mobile:test:coverage
cd mobile; npm run test:watch
cd mobile; npm run e2e        # Maestro (path ../.maestro/flows)
npm run android:emulator
npm run verify:ui
npm run verify:ui:full

# Runner unico (report in logs/quality_report.log)
python run_quality_checks.py              # --quick: A–E + F
python run_quality_checks.py --full       # + assemble + Pixel 9A UI
python run_quality_checks.py --full --skip-ui
```

`run_quality_checks.py` (root o via `run_quality_checks.bat`) richiama gli stessi script npm/ps1 dei gate A–H e stampa un riepilogo PASS/FAIL; esce non-zero se un check BLOCKING fallisce.

Variabili Maestro:

```powershell
$env:MAESTRO_TEST_EMAIL = "test@example.com"
$env:MAESTRO_TEST_PASSWORD = "secret"
```

## CI

GitHub Actions (`.github/workflows/ci.yml`):

- **Job `quality`**: `python scripts/run_quality_checks.py` (--quick) = Gate A–E + Gate F (presenza gradlew) + advisory in report
- Artifact `quality-report` (`logs/quality_report.log`) e `coverage-mobile` (lcov / json-summary)
- Concurrency cancel-in-progress; trigger su tutti i rami + PR
- Dependabot: `.github/dependabot.yml` (npm root + mobile, GitHub Actions) — mai `npm audit fix --force`

Locale Windows (stesso report della CI):

```powershell
npm run quality              # oppure .\run_quality_checks.bat (--quick)
npm run quality:fix         # prettier + eslint --fix, poi report
npm run quality:full         # + assemble + Pixel 9A UI (locale)
npm run gate                 # A–E via verify-gates.ps1 (invariato)
```

Gate G–H e Maestro **non** in CI (richiedono SDK/emulatore Pixel 9a).

## Target coverage

| Metrica                        | Soglia CI |
| ------------------------------ | --------- |
| Lines / Statements / Functions | **95%**   |
| Branches                       | **85%**   |

Ambito incluso: `src/lib/*` (utils, offlineSync, heatmap, csv, smoke, exerciseAssets, mappers, badges) + services (profile, analytics, exercise, log, session, export, notification, sound, garmin Pkce/constants).

Esclusi nativi non unit-testabili in Node: `sqlite.ts`, `supabase.ts`, Auth UI, Sentry.
