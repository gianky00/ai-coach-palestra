/**
 * Pure SQLite DDL for the offline queue (no op-sqlite — safe for Vitest).
 * Mirrors hot paths: workouts / sets / history (user + time, session, exercise).
 */

export const SQLITE_DB_NAME = 'kinefit_local.db';

export const SQLITE_PRAGMA_STATEMENTS = ['PRAGMA journal_mode = WAL'] as const;

export const SQLITE_TABLE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS offline_logs (
        tempId TEXT PRIMARY KEY NOT NULL,
        id TEXT,
        user_id TEXT NOT NULL,
        exercise_id TEXT NOT NULL,
        session_id TEXT,
        weight REAL,
        reps INTEGER,
        rpe INTEGER,
        set_type TEXT,
        created_at TEXT NOT NULL
      )`,
  `CREATE TABLE IF NOT EXISTS offline_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        is_new INTEGER NOT NULL
      )`,
  `CREATE TABLE IF NOT EXISTS offline_deleted_logs (
        id TEXT PRIMARY KEY NOT NULL
      )`,
] as const;

/** Idempotent indexes for Oggi day filters, sync queue order, History/session, PR/exercise. */
export const SQLITE_INDEX_STATEMENTS = [
  'CREATE INDEX IF NOT EXISTS idx_offline_logs_user_created ON offline_logs (user_id, created_at)',
  'CREATE INDEX IF NOT EXISTS idx_offline_logs_exercise_created ON offline_logs (exercise_id, created_at)',
  'CREATE INDEX IF NOT EXISTS idx_offline_logs_session ON offline_logs (session_id)',
  'CREATE INDEX IF NOT EXISTS idx_offline_logs_created_at ON offline_logs (created_at)',
  'CREATE INDEX IF NOT EXISTS idx_offline_logs_remote_id ON offline_logs (id)',
  'CREATE INDEX IF NOT EXISTS idx_offline_sessions_user_start ON offline_sessions (user_id, start_time)',
] as const;

export function buildSqliteInitStatements(): string[] {
  return [...SQLITE_PRAGMA_STATEMENTS, ...SQLITE_TABLE_STATEMENTS, ...SQLITE_INDEX_STATEMENTS];
}

/** Single execAsync blob (statements separated by `;`). */
export function buildSqliteInitSql(): string {
  return `${buildSqliteInitStatements().join(';\n')};`;
}
