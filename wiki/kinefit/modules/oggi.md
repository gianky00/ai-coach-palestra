# Modulo Oggi

Sorgenti: `mobile/src/components/views/OggiView.tsx`, `mobile/src/hooks/useLogExercise.ts`, `mobile/src/hooks/useWorkoutData.ts`, `mobile/src/services/logService.ts`.

## Ruolo

Scheda giornaliera: esercizi del giorno, log set (peso/reps/RPE), timer recupero, streak, nota sessione, coda offline.

## Entrypoint

- View: `OggiView`
- Hooks: `useLogExercise`, `useWorkoutData`, `useHabitStreak`
- Lib: `exerciseFilter` (`normalizeSearchText`), `restPresets`, `streak`
- Offline: `saveLogSafely` / `startWorkoutSafely` via `useLogExercise`

## Freeze

TestID smoke (non rinominare): `oggi-streak-chip`, `oggi-exercise-search`, `oggi-empty-state`, `oggi-empty-add-cta`, `oggi-session-note-input`, `oggi-session-note-save`, `oggi-offline-banner`, `log-rest-presets`, `log-pr-toast`, `timer-rest-presets`, `timer-minus-15`, `timer-plus-15`, `timer-close`, `timer-display`.

## Smoke

- Deep-link: `kinefit://smoke/tabs?tab=oggi`
- Vitest: `exerciseFilter`, `restPresets`, `streak`, `useLogExercise` dove presenti
- Verify: `npm run verify:ui:ops`

## Collegamenti

- [[kinefit/architecture/offline_sync|Offline Sync]]
- [[kinefit/modules/smoke|Smoke]]
- [[kinefit/INDEX|Grafo]]
