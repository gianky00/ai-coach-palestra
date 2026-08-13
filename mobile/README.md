# KineFit Mobile

UI React Native (bare) + progetto **Android Studio / Gradle versionato** in [`android/`](android/).  
**Metro** serve il bundle JS.

## Setup

```powershell
cd mobile
npm install
Copy-Item .env.example .env
```

Dalla root repo (ogni sessione):

```powershell
npm run metro            # terminale dedicato — obbligatorio per JS
npm run android:studio   # apri android/ → Run ▶
```

Dettaglio device (Pixel 9A, JDK 17, …): [SETUP_ANDROID.md](SETUP_ANDROID.md).

## Comandi (da mobile/)

```powershell
npm run metro          # bundler per Studio Run / install
npm run typecheck
npm test
npm run test:coverage
npm run e2e            # Maestro → ../.maestro/flows
```

Anche: [VERIFY.md](VERIFY.md), [android/README.md](android/README.md).

## Convenzioni

1. Offline-first via `saveLogSafely` / `startWorkoutSafely`
2. Haptic via `hapticService`
3. Safe area su tutte le view principali
4. Non cancellare `android/` — è il prodotto nativo (Studio + Gradle)
