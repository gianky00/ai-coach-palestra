# KineFit — Premium Elite Workout Tracker

KineFit è un'app Android per il tracciamento allenamenti (offline-first + Supabase).  
Flusso ufficiale: **Android Studio + Gradle + Metro** — non Expo Go, non EAS.

## Stack

- **Build ufficiale:** Android Studio su `mobile/android` (Gradle, versionato)
- **UI:** React Native + TypeScript; **Metro** per il bundle JS
- **Backend:** Supabase (RLS)
- **Offline:** SQLite + sync
- **State:** Zustand + TanStack Query

## Struttura

- `/mobile/android` — progetto Android Studio (**versionato**, apri qui)
- `/mobile/src` — UI / logica RN
- `/scripts/android` — assemble, verify UI, gate A–H
- Setup device: [`mobile/SETUP_ANDROID.md`](mobile/SETUP_ANDROID.md) · verify: [`mobile/VERIFY.md`](mobile/VERIFY.md)

## Convenzioni

1. Offline via `saveLogSafely` / `startWorkoutSafely`
2. Run/debug solo via Studio/Gradle + Metro (niente Expo Go / EAS)
3. Test Vitest per logica pura; smoke adb via deep-link `kinefit://smoke/...`

## Comandi

```powershell
npm run metro             # bundler JS (obbligatorio con Studio Run)
npm run android:studio    # apri mobile/android
npm run android:assemble  # APK debug Gradle
npm run gate              # A–E
npm run verify:ui         # smoke adb
```

## Config

Copia `mobile/.env.example` → `mobile/.env` (Supabase).  
I prefissi `EXPO_PUBLIC_*` sono solo naming env del client RN — non implicano Expo Go.
