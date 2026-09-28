# Architettura Globale di KineFit

Sorgenti: `mobile/App.tsx`, `mobile/src/store/useStore.ts`, `mobile/src/platform/constants.ts`, `mobile/android/`.

## Ruolo

App Android offline-first per tracciare allenamenti in palestra. Flusso ufficiale: **bare React Native + Android Studio + Gradle + Metro** (nessun Expo runtime / managed workflow).

## Entrypoint

- UI shell: `mobile/App.tsx`
- State globale: `mobile/src/store/useStore.ts` (Zustand; include `lastSyncFeedback` / `setLastSyncFeedback`)
- Timer: `mobile/src/store/useTimerStore.ts`
- Query: `mobile/src/lib/queryClient.ts` (TanStack Query)
- Backend: Supabase Auth + PostgreSQL + RLS (`mobile/src/lib/supabase.ts`)
- Native: progetto Gradle versionato in `mobile/android` (aprire qui in Android Studio)
- JS bundle: Metro (`npm run metro`)

## Stack

| Layer       | Tecnologia                                          |
| ----------- | --------------------------------------------------- |
| UI / logica | React Native + TypeScript sotto `mobile/src`        |
| Native      | Gradle in `mobile/android`                          |
| State       | Zustand + TanStack Query                            |
| Offline     | SQLite locale + sync verso Supabase                 |
| Backend     | Supabase (Auth, DB, Edge Functions Garmin)          |
| Qualità     | Vitest, Maestro, gate A–H, verify UI adb (Pixel_9a) |

## Freeze

- Non reintrodurre Expo CLI, moduli Expo o managed workflow.
- Env pubbliche: preferire `KINEFIT_*` (vedi [[kinefit/modules/auth|Auth]]).
- Non spezzare i contratti offline / smoke senza aggiornare i nodi collegati.

## Smoke

- Setup: `mobile/SETUP_ANDROID.md`
- Verify: `mobile/VERIFY.md`
- Comandi ops: `docs/GEMINI.md`

## Collegamenti

- [[kinefit/architecture/offline_sync|Offline Sync]]
- [[kinefit/architecture/sqlite_schema|SQLite Schema]]
- [[kinefit/modules/smoke|Smoke]]
- [[kinefit/INDEX|Grafo]]
