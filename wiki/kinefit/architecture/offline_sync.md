# Offline Sync

Sorgenti: `mobile/src/lib/offlineSync.ts`, `mobile/src/lib/syncFeedback.ts`, `mobile/src/components/ui/SyncFailBanner.tsx`, `mobile/src/hooks/useWorkoutData.ts`.

## Ruolo

Coda offline SQLite → upsert/delete su Supabase quando la rete è disponibile. Feedback utente via banner (ok / partial / failed) senza UI dentro i service.

## Entrypoint

- `startWorkoutSafely(userId, dateOverride?)` — crea/riprende sessione offline-safe
- `saveLogSafely(...)` — salva set in coda locale + tenta sync
- `deleteLogSafely(...)` — tombstone + sync delete
- `endWorkoutSafely(...)` — chiude sessione
- `syncOfflineLogs()` → `{ synced, failed }`
- `buildSyncFeedback` / `mapSyncFeedback` — copy italiano banner
- `buildOfflineQueueCopy` — copy coda «in coda offline — tocca per sincronizzare»
- Store: `lastSyncFeedback` / `setLastSyncFeedback` su AppState (`useStore`)
- UI: `SyncFailBanner` + wiring in `useWorkoutData` / `OggiView` / `ProfileView`

## Freeze

Non cancellare né sovrascrivere via:

- `mobile/src/lib/syncFeedback.ts`
- `mobile/src/components/ui/SyncFailBanner.tsx`
- `mobile/__tests__/lib/syncFeedback.test.ts`
- `setLastSyncFeedback` / `lastSyncFeedback` su `useStore`
- wiring `mapSyncFeedback` in `useWorkoutData`

Se mancano nel working tree: `git checkout HEAD --` su quei path. Mai `git rm`.

## Smoke

- Vitest: `mobile/__tests__/lib/syncFeedback.test.ts`
- UI: banner `oggi-offline-banner` / SyncFailBanner testID preservati dagli smoke

## Collegamenti

- [[kinefit/architecture/sqlite_schema|SQLite Schema]]
- [[kinefit/modules/oggi|Oggi]]
- [[kinefit/INDEX|Grafo]]
