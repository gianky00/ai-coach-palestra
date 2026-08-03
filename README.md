# KineFit Premium Elite

[![CI/CD Quality & Build Check](https://github.com/Coemi/appPalestra/actions/workflows/ci.yml/badge.svg)](https://github.com/Coemi/appPalestra/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-1.0.9-blue.svg)](mobile/package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Expo SDK 54](https://img.shields.io/badge/Expo-SDK%2054-000020.svg)](https://expo.dev)

**KineFit** è un'app mobile professionale per il tracciamento degli allenamenti in palestra, con architettura **offline-first** e backend **Supabase**.

## Funzionalità

- **Scheda giornaliera** — esercizi per giorno della settimana, progresso set/volume
- **Log set** — peso, reps, RPE, cedimento automatico, fast-log, record personali
- **Timer recupero** — floating timer globale con regolazione ±15s
- **Storico** — sessioni passate con dettaglio per esercizio
- **Analytics** — heatmap muscolare + grafico volume settimanale
- **Offline-first** — SQLite locale con sync automatico a Supabase
- **Profilo** — peso corporeo, impostazioni persistenti

## Stack tecnologico

| Layer          | Tecnologia                                   |
| -------------- | -------------------------------------------- |
| Mobile         | React Native 0.81 + Expo SDK 54 + TypeScript |
| State          | Zustand + TanStack Query                     |
| Storage locale | expo-sqlite                                  |
| Backend        | Supabase (Auth, PostgreSQL, RLS)             |
| Test           | Vitest                                       |
| CI             | ESLint, Prettier, Typecheck, Vitest          |

## Struttura progetto

```
ai-coach-palestra/
├── mobile/                 # App Expo (prodotto attivo)
│   ├── src/
│   │   ├── components/     # Views, modals, UI
│   │   ├── hooks/          # useWorkoutData, useLogExercise
│   │   ├── lib/            # sqlite, offlineSync, supabase
│   │   ├── services/       # Accesso dati Supabase
│   │   └── store/          # Zustand
│   ├── __tests__/          # Test unitari Vitest
│   └── app.config.ts       # Config Expo + env
├── supabase/               # Migrazioni DB
├── docs/                   # Documentazione
└── scripts/                # Release, utility
```

## Installazione e sviluppo

### Prerequisiti

- Node.js 20+
- Expo Go (per test su device) o Android Studio / Xcode

### Setup

```bash
# 1. Dipendenze root (tooling)
npm install

# 2. Dipendenze mobile
npm run mobile:install

# 3. Configura Supabase
cp mobile/.env.example mobile/.env
# Modifica mobile/.env con le tue chiavi Supabase

# 4. Avvia Expo
npm run mobile:dev
```

### Comandi principali

| Comando                | Descrizione                          |
| ---------------------- | ------------------------------------ |
| `npm run mobile:dev`   | Avvia Expo dev server                |
| `npm run validate`     | Typecheck + test unitari             |
| `npm run lint`         | ESLint                               |
| `npm run format:check` | Prettier check                       |
| `npm run mobile:build` | Build APK via EAS (preview)          |
| `npm run db:gen-types` | Rigenera tipi TypeScript da Supabase |

## Configurazione Supabase

Le chiavi **non** sono più hardcoded nel codice. Usa variabili d'ambiente:

```env
# mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Per build EAS in produzione, configura i secret nel dashboard Expo o in `eas.json`.

## Test

```bash
npm run validate              # typecheck + test
npm run mobile:test             # solo Vitest
npm run mobile:test:coverage    # Vitest con coverage report
cd mobile && npm run test:watch # watch mode
cd mobile && npm run e2e        # Maestro E2E (richiede device + credenziali)
```

### Pre-release produzione

Prima di pubblicare su Play Store / App Store:

1. Esegui la [checklist store](docs/STORE_SUBMISSION.md)
2. Applica le migrazioni Supabase (`supabase db push` o dashboard)
3. Configura secret EAS: Supabase, Sentry, Garmin (opzionale)
4. Testa offline in modalità aereo su device reale
5. Verifica RLS con utente di test secondario

## Automazione

- **Conventional Commits** via `commitlint`
- **Git hooks** via Husky (pre-commit lint, pre-push validate)
- **Release** via `npm run release` (semantic versioning)

## Documentazione

- [Audit e piano miglioramenti](docs/AUDIT_E_PIANO_MIGLIORAMENTI.md)
- [Manutenzione e SRP](docs/MANUTENZIONE_SRP.md)
- [Checklist pubblicazione store](docs/STORE_SUBMISSION.md)
- [Linee guida test](docs/TESTING_GUIDELINES.md)
- [Maestro E2E](.maestro/README.md)
- [README mobile](mobile/README.md)

---

_KineFit — Powering your growth with precision._
