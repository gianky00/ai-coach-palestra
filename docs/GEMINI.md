# KineFit — Guida operativa agenti (ops)

**Non** è la knowledge base architetturale. Il grafo vivo è **`wiki/kinefit/INDEX.md`** (boot: `AGENTS.md` → `wiki/INDEX.md` → wiki/kinefit).

Questo file resta per: **env**, **comandi PowerShell**, **checklist qualità**, link a runbook in `/docs`.

> Entry: [`AGENTS.md`](../AGENTS.md) · Hub: [`wiki/INDEX.md`](../wiki/INDEX.md) · Wiki codice: [`wiki/kinefit/INDEX.md`](../wiki/kinefit/INDEX.md) · Note mobile: [`mobile/GEMINI.md`](../mobile/GEMINI.md) · Split: [`wiki/kinefit/workflows/docs_vs_wiki.md`](../wiki/kinefit/workflows/docs_vs_wiki.md)

---

## Dove trovare cosa

| Bisogno                              | Dove                                                               |
| ------------------------------------ | ------------------------------------------------------------------ |
| Architettura, offline, moduli, smoke | [`wiki/kinefit/INDEX.md`](../wiki/kinefit/INDEX.md)                |
| Note + inventario file               | [`mobile/GEMINI.md`](../mobile/GEMINI.md)                          |
| Diario parallel agents               | [`AGENT_SYNC.md`](AGENT_SYNC.md)                                   |
| Setup device                         | [`../mobile/SETUP_ANDROID.md`](../mobile/SETUP_ANDROID.md)         |
| Verify UI                            | [`../mobile/VERIFY.md`](../mobile/VERIFY.md)                       |
| Store                                | [`STORE_SUBMISSION.md`](STORE_SUBMISSION.md)                       |
| Testing                              | [`TESTING_GUIDELINES.md`](TESTING_GUIDELINES.md)                   |
| SRP principi                         | [`MANUTENZIONE_SRP.md`](MANUTENZIONE_SRP.md) · mappa Garmin → wiki |

---

## Variabili d'ambiente

Copia `mobile/.env.example` → `mobile/.env`. Prefisso pubblico: **`KINEFIT_*`**.

| Variabile                    | Uso                                                      |
| ---------------------------- | -------------------------------------------------------- |
| `KINEFIT_SUPABASE_URL`       | URL progetto Supabase                                    |
| `KINEFIT_SUPABASE_ANON_KEY`  | Anon key client                                          |
| `KINEFIT_SENTRY_DSN`         | Error tracking (opzionale)                               |
| `KINEFIT_GARMIN_CLIENT_ID`   | OAuth Garmin client (opzionale)                          |
| `KINEFIT_PRIVACY_POLICY_URL` | URL privacy hostata (opzionale; vuoto = no row settings) |

Legacy: `platform/constants.ts` può ancora dual-read `EXPO_PUBLIC_*` per migrazione locale. Preferire solo `KINEFIT_*`. Non reintrodurre Expo.

---

## Comandi

```powershell
npm install
npm run mobile:install
Copy-Item mobile\.env.example mobile\.env

npm run metro             # bundler JS (obbligatorio con Studio Run)
npm run android:studio    # apre mobile/android
npm run android:assemble  # APK debug Gradle
npm run gate              # A–E
npm run gate:all          # A–H
npm run verify:ui         # smoke adb (Pixel_9a)
npm run validate          # typecheck + Vitest
npm run quality           # run_quality_checks.py --quick
npm run wiki:inventory    # rigenera inventario mobile/GEMINI.md
npm run wiki:check        # inventory --check + contract sync
npm run wiki:test         # domain resolve (Gate F)
```

---

## Checklist qualità

1. Boot wiki letto.
2. Diff minimo; freeze syncFeedback / testID / no Expo.
3. Vitest sul perimetro se esiste.
4. Wiki-sync se contratto toccato; `npm run wiki:inventory` se cambiano TS sotto `mobile/src` o `supabase/functions`.
5. `python scripts/run_quality_checks.py` (Gate F include wiki).

Gate detail: [`wiki/kinefit/workflows/quality_gates.md`](../wiki/kinefit/workflows/quality_gates.md).
