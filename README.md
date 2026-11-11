# KineFit — Offline-First Mobile Workout & Performance Tracker

[![CI/CD Quality & Build Check](https://github.com/gianky00/ai-coach-palestra/actions/workflows/ci.yml/badge.svg)](https://github.com/gianky00/ai-coach-palestra/actions/workflows/ci.yml)
![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?style=flat-square&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Backend-Supabase%20PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)

**KineFit** è un'applicazione mobile cross-platform per la pianificazione, il tracciamento e l'analisi delle sessioni di allenamento, progettata con un'architettura **Offline-First** su database locale **SQLite** e sincronizzazione bidirezionale verso **Supabase (PostgreSQL + Row Level Security)**.

---

## Caratteristiche Tecniche e Funzionali

- **Motore Offline-First (`offlineSync.ts` & `sqlite.ts`):** Persistenza immediata in locale tramite `expo-sqlite` per garantire operatività completa anche in assenza di rete, con coda di sincronizzazione automatica e risoluzione dei conflitti non appena la connessione torna disponibile.
- **Gestione Scheda & Fast-Logging:** Tracciamento in tempo reale di carichi, ripetizioni, RPE, cedimento muscolare e record personali (PR), con calcolatore dischi integrato (`PlateCalculator.tsx`).
- **Floating Recovery Timer:** Timer di recupero globale persistente tra le schermate con regolazione rapida (`±15s`) e notifiche sonore.
- **Performance Analytics & Muscle Heatmap:** Analisi grafica del volume settimanale per distretto muscolare (`MuscleHeatmap.tsx`) e storico dettagliato delle sessioni.
- **Sicurezza Dati:** Autenticazione gestita con **Supabase Auth** e politiche **Row-Level Security (RLS)** a livello di database PostgreSQL (`database/supabase_rls_policies.sql`).

---

## Stack Tecnologico

| Layer | Tecnologia |
| :--- | :--- |
| **Mobile Framework** | React Native 0.81 + Expo SDK 54 + TypeScript |
| **State Management** | Zustand + TanStack React Query |
| **Local Persistence** | `expo-sqlite` (Offline Queue & Local Cache) |
| **Cloud Backend** | Supabase (PostgreSQL, Auth, Row-Level Security) |
| **Testing & QA** | Vitest (Unit & Sync Engine Tests), Maestro (E2E Mobile Flows) |
| **CI/CD & Tooling** | GitHub Actions, ESLint, Prettier, Husky, Commitlint, Semantic Release |

---

## Struttura del Progetto

```text
ai-coach-palestra/
├── mobile/                     # Applicazione mobile React Native / Expo
│   ├── src/
│   │   ├── components/         # Modals, UI widgets (MuscleHeatmap, PlateCalculator, Timer)
│   │   ├── hooks/              # Custom hooks per gestione workout e sincronizzazione
│   │   ├── lib/                # Motore SQLite locale, offlineSync e client Supabase
│   │   ├── services/           # Layer di accesso ai servizi backend
│   │   └── store/              # Stato globale Zustand
│   ├── __tests__/              # Suite di test unitari Vitest (sync, mappers, services)
│   └── app.config.ts           # Configurazione dinamica Expo
├── database/                   # Policy SQL e migrazioni Supabase RLS
├── .maestro/                   # Flussi di test End-to-End (Maestro)
└── docs/                       # Documentazione tecnica e linee guida di test
```

---

## Installazione e Sviluppo

### Setup Locale

```bash
# 1. Installazione dipendenze di root (tooling e git hooks)
npm install

# 2. Installazione dipendenze dell'app mobile
npm run mobile:install

# 3. Configurazione variabili d'ambiente
cp mobile/.env.example mobile/.env
# Inserire EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env

# 4. Avvio del server di sviluppo Expo
npm run mobile:dev
```

### Qualità del Codice e Test

```bash
npm run validate                # Typecheck TypeScript + Test unitari Vitest
npm run lint                    # Analisi statica ESLint
npm run mobile:test:coverage    # Esecuzione Vitest con report di coverage
```

---

## Autore
Sviluppato da **Giancarlo Allegretti**.
