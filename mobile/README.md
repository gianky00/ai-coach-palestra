# KineFit Mobile

UI React Native + progetto **Android Studio versionato** in [`android/`](android/).

## Setup

```powershell
cd mobile
npm install
Copy-Item .env.example .env
```

Dalla root repo:

```powershell
npm run metro
npm run android:studio
```

## Comandi (da mobile/)

```powershell
npm run metro          # bundler per Studio Run
npm run typecheck
npm test
npm run test:coverage
npm run e2e            # Maestro → ../.maestro/flows
```

Vedi [SETUP_ANDROID.md](SETUP_ANDROID.md), [VERIFY.md](VERIFY.md), [android/README.md](android/README.md).

## Convenzioni

1. Offline-first via `saveLogSafely` / `startWorkoutSafely`
2. Haptic via `hapticService`
3. Safe area su tutte le view principali
4. Non cancellare `android/` — è il prodotto nativo
