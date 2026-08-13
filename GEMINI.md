# KineFit — Premium Elite Workout Tracker

KineFit è un'app Android per il tracciamento allenamenti (offline-first + Supabase).

## Stack

- **Build ufficiale:** Android Studio su `mobile/android` (Gradle)
- **UI:** React Native + TypeScript (Metro bundler)
- **Backend:** Supabase (RLS)
- **Offline:** SQLite + sync
- **State:** Zustand + TanStack Query

## Struttura

- `/mobile/android` — progetto Android Studio (**versionato**, apri qui)
- `/mobile/src` — UI / logica RN
- `/scripts/android` — assemble, verify UI, gate A–H

## Convenzioni

1. Offline via `saveLogSafely` / `startWorkoutSafely`
2. Non usare Expo Go / EAS come flusso quotidiano
3. Test Vitest per logica pura; smoke adb via deep-link `kinefit://smoke/...`

## Comandi

```powershell
npm run metro             # bundler JS (serve a Studio Run)
npm run android:studio    # apri mobile/android
npm run android:assemble  # APK debug
npm run gate              # A–E
npm run verify:ui         # smoke adb
```

## Config

Copia `mobile/.env.example` → `mobile/.env` (Supabase).
