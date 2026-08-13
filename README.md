# KineFit Premium Elite

[![CI/CD Quality & Build Check](https://github.com/Coemi/appPalestra/actions/workflows/ci.yml/badge.svg)](https://github.com/Coemi/appPalestra/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-1.0.9-blue.svg)](mobile/package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Android Studio](https://img.shields.io/badge/Android%20Studio-Gradle-3DDC84.svg)](mobile/SETUP_ANDROID.md)

**KineFit** è un'app Android per il tracciamento allenamenti in palestra (offline-first + Supabase).  
**Percorso ufficiale: bare React Native + Android Studio + Gradle** su [`mobile/android`](mobile/android), con **Metro** per il bundle JS.

## Funzionalità

- **Scheda giornaliera** — esercizi per giorno, progresso set/volume
- **Log set** — peso, reps, RPE, cedimento, fast-log, PR
- **Timer recupero** — floating timer ±15s
- **Storico / Analytics / Profilo**
- **Offline-first** — SQLite + sync Supabase

## Stack

| Layer          | Tecnologia                                                        |
| -------------- | ----------------------------------------------------------------- |
| UI / logica    | React Native 0.81 + TypeScript                                    |
| Native         | Progetto Gradle versionato in `mobile/android`                    |
| JS bundle      | **Metro** (`npm run metro`) — richiesto con Run ▶ / install debug |
| Build / deploy | **Android Studio** + Gradle (`assembleDebug` / `bundleRelease`)   |
| State          | Zustand + TanStack Query                                          |
| Storage        | SQLite locale                                                     |
| Backend        | Supabase (Auth, PostgreSQL, RLS)                                  |
| Qualità        | Vitest, Maestro, gate A–H, verify UI adb (emulatore Pixel 9A)     |

## Struttura

```
ai-coach-palestra/
├── mobile/
│   ├── android/            # ★ Apri QUI in Android Studio (versionato)
│   ├── src/                # UI React Native
│   ├── __tests__/
│   ├── SETUP_ANDROID.md
│   └── VERIFY.md
├── scripts/android/        # assemble, install, verify_ui, gate A–H
├── .maestro/
├── supabase/
└── docs/
```

## Setup

```powershell
npm install
npm run mobile:install
Copy-Item mobile\.env.example mobile\.env
# valorizza KINEFIT_SUPABASE_* in mobile\.env

npm run android:studio   # apre mobile/android
npm run metro            # terminale separato — bundler JS
```

Poi in Android Studio: device → **Run ▶**.

## Comandi

| Comando                    | Descrizione                     |
| -------------------------- | ------------------------------- |
| `npm run metro`            | Bundler JS (serve a Studio Run) |
| `npm run android:studio`   | Apri progetto in Android Studio |
| `npm run android:assemble` | APK debug Gradle                |
| `npm run android:install`  | installDebug su device          |
| `npm run gate`             | Gate A–E (come CI)              |
| `npm run gate:all`         | A–H incluso assemble + UI       |
| `npm run verify:ui`        | Smoke adb (zero login)          |
| `npm run validate`         | Typecheck + Vitest              |

## Config Supabase

```env
# mobile/.env
KINEFIT_SUPABASE_URL=https://your-project.supabase.co
KINEFIT_SUPABASE_ANON_KEY=your-anon-key
```

## Test

```powershell
npm run gate
npm run verify:ui
cd mobile; npm run e2e   # Maestro + account test
```

Vedi [mobile/SETUP_ANDROID.md](mobile/SETUP_ANDROID.md), [mobile/VERIFY.md](mobile/VERIFY.md), [docs/TESTING_GUIDELINES.md](docs/TESTING_GUIDELINES.md).

## Store

Build release firmata da Android Studio (`bundleRelease`) — checklist [docs/STORE_SUBMISSION.md](docs/STORE_SUBMISSION.md).

## Documentazione

- [Setup Android Studio](mobile/SETUP_ANDROID.md)
- [VERIFY](mobile/VERIFY.md)
- [Store](docs/STORE_SUBMISSION.md)
- [Testing](docs/TESTING_GUIDELINES.md)
- [README android](mobile/android/README.md)

---

_KineFit — Powering your growth with precision._
