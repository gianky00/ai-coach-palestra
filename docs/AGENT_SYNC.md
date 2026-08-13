# AGENT_SYNC — live coordination for parallel agents

> Keep this short. Append checklist entries; don't rewrite history.

## Bug policy

**Fix immediately. Never leave known fails.** If you find a broken test, smoke failure, or emulator flake you can reproduce — fix it in the same turn or hand off with a concrete fix path. Do not park red suites.

## Current architecture

- **Bare React Native + Android Studio** (no Expo runtime / managed workflow)
- Mobile app under `mobile/`; Android builds via Gradle / Android Studio
- Env prefix: `KINEFIT_*` (not Expo public vars)

## Active workstreams

| Stream                     | Focus                                                       |
| -------------------------- | ----------------------------------------------------------- |
| **Expo purge**             | Remove Expo leftovers; no restore of Expo tooling           |
| **Exhaustive emulator UI** | Full UI smoke / Maestro / emulator coverage on **Pixel_9a** |
| **New features**           | Product work on bare RN stack                               |

## Rules (do not violate)

1. **No Expo restore** — do not reintroduce Expo CLI, Expo modules, or managed workflow
2. **`KINEFIT_*` env** — use project env naming; keep `.env.example` aligned
3. **Preserve smoke `testID`s** — do not rename/remove IDs used by Maestro / UI smoke
4. **Emulator target: Pixel_9a** — default AVD for UI / suite runs

## Checklist template (append below)

```
### YYYY-MM-DD — <agent role>
- Files touched: …
- Bugs fixed: … (or "none")
- Notes / blockers: …
```

---

## Log

<!-- Agents: append newest entry at the bottom -->

### 2026-08-13 — sync bootstrap

- Files touched: `docs/AGENT_SYNC.md`
- Bugs fixed: none
- Notes: protocol created for parallel agents (Expo purge | emulator UI | features)

### 2026-08-13 — new features (product)

- Files touched: `mobile/src/lib/restPresets.ts`, `mobile/src/lib/streak.ts`, `mobile/src/lib/exerciseFilter.ts`, `mobile/src/hooks/useHabitStreak.ts`, `mobile/src/services/sessionNotesService.ts`, `mobile/src/components/ui/FloatingTimer.tsx`, `mobile/src/components/modals/LogExerciseModal.tsx`, `mobile/src/components/modals/SessionDetailsModal.tsx`, `mobile/src/components/views/OggiView.tsx`, `mobile/src/components/views/ProfileView.tsx`, `mobile/src/components/views/HistoryView.tsx`, `mobile/src/hooks/useLogExercise.ts`, `mobile/src/services/exportService.ts`, `mobile/__tests__/lib/{restPresets,streak,exerciseFilter}.test.ts`, `mobile/__tests__/services/sessionNotesService.test.ts`, `mobile/__tests__/views/viewContracts.test.ts`, `docs/AGENT_SYNC.md`
- Bugs fixed: FloatingTimer presets wiped by sibling UI agent — restored with `timer-rest-presets` + kept `timer-minus-15`/`timer-plus-15`/`timer-close`/`timer-display`; streak `weekCount` for prior-week Sunday already corrected in tree (`expect 0`)
- Notes / blockers: Features offline-first (notes AsyncStorage; streak merges SQLite+remote). New smoke testIDs: `oggi-streak-chip`, `oggi-exercise-search`, `oggi-empty-state`, `oggi-session-note-input`, `oggi-session-note-save`, `profile-streak-chip`, `history-empty-state`, `log-rest-presets`, `log-pr-toast`, `timer-rest-presets`, `timer-rest-preset-60|90|120|180`. Emulator B: log a set → PR toast + rest chips; start timer → preset row; empty day → CTA; active session → note field; Profile/Oggi streak chip. Env: `KINEFIT_*` only. typecheck+198 vitest green. No Expo.

### 2026-08-13 — Expo purge

- Files touched: `.env.example`, `mobile/.env.example`, `mobile/src/platform/constants.ts`, `mobile/src/platform/index.ts`, `mobile/src/platform/{audio,notifications,sqlite,statusBar}.*`, `mobile/__tests__/platform/constants.test.ts`, `mobile/__tests__/services/garminService.test.ts`, `README.md`, `GEMINI.md`, `mobile/{README,SETUP_ANDROID,VERIFY}.md`, `mobile/android/README.md`, `docs/{AUDIT_E_PIANO_MIGLIORAMENTI,MANUTENZIONE_SRP,STORE_SUBMISSION,TESTING_GUIDELINES}.md`, `docs/archive/MOBILE_ROADMAP.md`, `.maestro/README.md`, `.gitignore`, `mobile/.gitignore`, `.prettierignore`, `.github/dependabot.yml`, `scripts/android/prebuild-android.ps1`, `scripts/run_quality_checks.py`, `docs/AGENT_SYNC.md`
- Bugs fixed (working tree, for features WIP — not all in purge commit): `LogExerciseModal` missing `isSmokeFixtureExercise` import; lint `set-state-in-effect` on smoke deep-links (`OggiView`/`HistoryView`/`ProfileView`) + PR toast reset + `AuthProvider` catch → render-time / `queueMicrotask` patterns
- Notes: removed `EXPO_PUBLIC_*` fallback; env is `KINEFIT_*` only; deleted `mobile/.expo`; purge commit excludes features/streak/smoke WIP; `python scripts/run_quality_checks.py --quick --no-advisory` PASS locally with WIP present
