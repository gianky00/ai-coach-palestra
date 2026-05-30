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
