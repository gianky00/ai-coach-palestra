# 🛡️ KineFit Premium Elite

[![CI/CD Quality & Build Check](https://github.com/Coemi/appPalestra/actions/workflows/ci.yml/badge.svg)](https://github.com/Coemi/appPalestra/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-2.0.1-blue.svg)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-orange.svg)](https://vitejs.dev/guide/features.html#pwa)

**KineFit** è un'applicazione professionale per il tracciamento degli allenamenti, progettata con un'estetica **Premium Elite** e un'architettura **PWA** ad alte prestazioni. 

## 🚀 Funzionalità Esclusive (V3.0)

-   **Interactive Muscle Heatmap:** Visualizzazione dinamica dei muscoli coinvolti nell'allenamento.
-   **Barbell Visualizer:** Calcolo visivo immediato dei dischi necessari sul bilanciere.
-   **Advanced Analytics:** Grafici interattivi con Recharts per analizzare volume e intensità.
-   **Offline First:** Sincronizzazione automatica tramite **IndexedDB** per allenarsi anche senza connessione.
-   **Premium UI:** Design minimalista "Space Grey" con animazioni fluide tramite Framer Motion.

## 🛠️ Stack Tecnologico

-   **Frontend:** React 19 + TypeScript + Vite
-   **State Management:** Zustand (Leggero e performante)
-   **Visualizzazione Dati:** Recharts
-   **Animazioni:** Framer Motion
-   **Storage Locale:** IndexedDB (via Dexie/custom wrapper)
-   **Backend:** Supabase (Auth, DB, RLS)
-   **Testing:** Vitest + React Testing Library

## 🤖 Automazione & Versioning

Il progetto utilizza un sistema di versioning standardizzato:
-   **Conventional Commits:** Validazione dei commit tramite `commitlint`.
-   **Git Hooks:** Automazione tramite `husky` (pre-commit linting, pre-push validation).
-   **Automated Release:** Script `release.js` per gestione semantica della versione e changelog automatico.

## 📦 Installazione & Sviluppo

```bash
# Installa le dipendenze
npm install

# Avvia in modalità sviluppo
npm run dev

# Esegui la validazione completa (Test, Lint, Typecheck)
npm run validate

# Crea una nuova versione
npm run release
```

---
*KineFit - Powering your growth with precision.*
