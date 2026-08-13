import { describe, expect, it } from 'vitest';

import {
  buildSqliteInitSql,
  buildSqliteInitStatements,
  SQLITE_DB_NAME,
  SQLITE_INDEX_STATEMENTS,
  SQLITE_PRAGMA_STATEMENTS,
  SQLITE_TABLE_STATEMENTS,
} from '../../src/lib/sqliteSchema';

describe('sqliteSchema', () => {
  it('names the local offline DB', () => {
    expect(SQLITE_DB_NAME).toBe('kinefit_local.db');
  });

  it('enables WAL and creates all offline tables', () => {
    expect(SQLITE_PRAGMA_STATEMENTS).toContain('PRAGMA journal_mode = WAL');
    const joined = SQLITE_TABLE_STATEMENTS.join('\n');
    expect(joined).toContain('CREATE TABLE IF NOT EXISTS offline_logs');
    expect(joined).toContain('CREATE TABLE IF NOT EXISTS offline_sessions');
    expect(joined).toContain('CREATE TABLE IF NOT EXISTS offline_deleted_logs');
    expect(joined).toContain('tempId TEXT PRIMARY KEY');
    expect(joined).toContain('user_id TEXT NOT NULL');
    expect(joined).toContain('created_at TEXT NOT NULL');
  });

  it('defines idempotent indexes for workouts/sets/history paths', () => {
    expect(SQLITE_INDEX_STATEMENTS.length).toBeGreaterThanOrEqual(5);
    for (const stmt of SQLITE_INDEX_STATEMENTS) {
      expect(stmt).toMatch(/^CREATE INDEX IF NOT EXISTS idx_/);
    }
    const joined = SQLITE_INDEX_STATEMENTS.join('\n');
    expect(joined).toContain('idx_offline_logs_user_created');
    expect(joined).toContain('idx_offline_logs_exercise_created');
    expect(joined).toContain('idx_offline_logs_session');
    expect(joined).toContain('idx_offline_logs_created_at');
    expect(joined).toContain('idx_offline_logs_remote_id');
    expect(joined).toContain('idx_offline_sessions_user_start');
    expect(joined).toContain('ON offline_logs (user_id, created_at)');
    expect(joined).toContain('ON offline_sessions (user_id, start_time)');
  });

  it('builds init SQL that is safe to re-run', () => {
    const statements = buildSqliteInitStatements();
    expect(statements[0]).toBe('PRAGMA journal_mode = WAL');
    expect(statements.some((s) => s.includes('offline_logs'))).toBe(true);
    expect(statements.some((s) => s.startsWith('CREATE INDEX IF NOT EXISTS'))).toBe(true);

    const sql = buildSqliteInitSql();
    expect(sql.endsWith(';')).toBe(true);
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS offline_logs');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_offline_logs_user_created');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_offline_sessions_user_start');
    // No DROP — must not wipe smoke seed / existing queue
    expect(sql.toUpperCase()).not.toContain('DROP TABLE');
    expect(sql.toUpperCase()).not.toContain('DROP INDEX');
  });
});
