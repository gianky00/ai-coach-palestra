# SQLite Schema (coda offline)

Sorgenti: `mobile/src/lib/sqliteSchema.ts`, `mobile/src/lib/sqlite.ts`.

## Ruolo

DDL puro (no op-sqlite) per la coda offline locale. Safe per Vitest. Indici idempotenti (`CREATE INDEX IF NOT EXISTS`), niente DROP.

## Entrypoint

- DB name: `SQLITE_DB_NAME` = `kinefit_local.db`
- PRAGMA: `journal_mode = WAL`
- Tabelle: `offline_logs`, `offline_sessions`, `offline_deleted_logs`
- `buildSqliteInitStatements()` / `buildSqliteInitSql()`
- Runtime: `initDb`, `sqliteService` in `mobile/src/lib/sqlite.ts`

## Freeze

- Non rimuovere le tre tabelle senza piano di migrazione locale + sync.
- Indici: solo `IF NOT EXISTS`; non introdurre DROP sugli indici hot-path.
- Migration Supabase remote restano in `supabase/migrations/` (non duplicate qui come SQL).

## Smoke

- Vitest che tocca schema/init se presenti sotto `mobile/__tests__/lib/`
- Seed smoke scrive fixture con id `smoke-*` (vedi [[kinefit/modules/smoke|Smoke]])

## Collegamenti

- [[kinefit/architecture/offline_sync|Offline Sync]]
- [[kinefit/INDEX|Grafo]]
