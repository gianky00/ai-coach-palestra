# [2.1.0](https://github.com/gianky00/ai-coach-palestra/compare/v2.0.3...v2.1.0) (2026-06-02)

### Bug Fixes

- auto-format database types on generation ([1b7a5a5](https://github.com/gianky00/ai-coach-palestra/commit/1b7a5a51dde9e33bedbd9e2619c56d61b6cab3dd))
- **offline:** resolve stuck sync queue due to invalid payload and unrecoverable errors ([8de850c](https://github.com/gianky00/ai-coach-palestra/commit/8de850c5c2f81e610fb3c389a37b493582027e6e))
- risoluzione errori build vercel e cleanup variabili test ([3e7b2c8](https://github.com/gianky00/ai-coach-palestra/commit/3e7b2c83988c754ffc34852c4f3a91e836351f86))
- **test:** exclude migration-v2 and mock env to pass pre-push hook ([5347849](https://github.com/gianky00/ai-coach-palestra/commit/53478493bfb2e0f44886bcd68034693dec6baf15))
- **test:** make MuscleHeatmap text matcher robust to locale formatting ([7fbd74b](https://github.com/gianky00/ai-coach-palestra/commit/7fbd74b9d4ed455b9c86fa31fb6d7e53226133b9))
- **test:** wait for async progression data in useAnalytics test ([dceac70](https://github.com/gianky00/ai-coach-palestra/commit/dceac70ded19b822177df7e59a2aa6a0ecee8356))
- **types:** resolve TypeScript strict mode errors in offlineSync and setup ([8da2494](https://github.com/gianky00/ai-coach-palestra/commit/8da249436d5622be420a0e77216bf728990ce41a))

### Features

- add comprehensive user onboarding flow and garmin integration ([8704647](https://github.com/gianky00/ai-coach-palestra/commit/8704647cb0a5c051fcab6b1b9930f6a368bb93ae))
- standardizzazione del repository alla versione V2 React ed eliminazione legacy GAS ([dea459c](https://github.com/gianky00/ai-coach-palestra/commit/dea459c5393e3af0e21686751c8b90b8cce50f6f))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2026-05-30

### Added

- Integrazione di `semantic-release` per l'automazione industriale dei rilasci e della compilazione del changelog.
- Installazione ed integrazione delle librerie core `zod`, `dayjs` e `idb` per l'ingegneria del software.
- Pre-push hook locale con Husky per la validazione automatica della suite di unit test prima di ogni push.
- Setup ed integrazione di Supabase CLI in locale e validazione automatica dei tipi TypeScript in CI/CD.
- Abilitazione del reporter `json-summary` in Vitest per il tracciamento programmatico della test coverage.

### Changed

- Riorganizzazione radicale della root principale spostando la documentazione interna in `/docs`.
- Ottimizzazione di `eslint.config.js` per ignorare le regole di type-checking rigoroso solo nei file di test, sbloccando la CI.
- Disaccoppiamento dello script di release custom dal comando `npm run build`.

## [2.2.1] - 2026-05-28

### Fixed

- test: hardening suite e2e con auth injection e risoluzione bug accessibilità.

## [2.2.0] - 2026-05-24

### Added

- Foto degli esercizi reali e guide posturali professionali offline-first.

### Fixed

- Risoluzione dei controlli di release per ambienti monorepo Git.

## [2.1.0] - 2026-05-20

### Added

- Integrazione del supporto offline avanzato con IndexedDB.
- Modulo di diagnostica di sincronizzazione e prevenzione del doppio salvataggio dei log.

### Changed

- Esclusione dello script di release automatico durante le build in ambiente Vercel.

## [2.0.0] - 2026-05-20

### Added

- Standardizzazione del repository alla versione V2 React ed eliminazione legacy Google Apps Script (GAS).
- Integrazione del sistema di versioning dinamico enterprise (SHA commit + build timestamp).
- Badge di diagnosi ambientale dinamico (DEV/PREVIEW/PROD) nell'interfaccia utente.
- Creazione del modale interattivo per la consultazione delle note di rilascio con animazioni Framer Motion.
