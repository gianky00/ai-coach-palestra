import * as SQLite from 'expo-sqlite';

import type { OfflineLog, WorkoutSession } from '../types';

const DB_NAME = 'kinefit_local.db';

interface LogRow {
  tempId: string;
  id: string | null;
  user_id: string;
  exercise_id: string;
  session_id: string | null;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  set_type: string | null;
  created_at: string;
}

interface SessionRow {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  is_new: number;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;
let isInitializing = false;

export const initDb = async () => {
  if (dbInstance) return dbInstance;
  if (isInitializing) {
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return dbInstance!;
  }

  isInitializing = true;
  try {
    console.log('[SQLite] Avvio inizializzazione database...');
    const db = await SQLite.openDatabaseAsync(DB_NAME);

    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS offline_logs (
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
      );
      CREATE TABLE IF NOT EXISTS offline_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        is_new INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS offline_deleted_logs (
        id TEXT PRIMARY KEY NOT NULL
      );
    `);

    dbInstance = db;
    console.log('[SQLite] Database inizializzato con successo.');
    return db;
  } catch (error) {
    console.error('[SQLite] Errore fatale durante initDb:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
};

const getDb = async () => {
  if (!dbInstance) return await initDb();
  return dbInstance;
};

export const sqliteService = {
  async addLog(log: OfflineLog): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO offline_logs (tempId, id, user_id, exercise_id, session_id, weight, reps, rpe, set_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        log.tempId,
        log.id || null,
        log.user_id,
        log.exercise_id,
        log.session_id || null,
        log.weight,
        log.reps,
        log.rpe,
        log.set_type,
        log.created_at,
      ],
    );
  },

  async getAllLogs(): Promise<OfflineLog[]> {
    const db = await getDb();
    const result = await db.getAllAsync<LogRow>(
      'SELECT * FROM offline_logs ORDER BY created_at ASC',
    );
    return result.map((row) => ({
      ...row,
      weight: row.weight ?? 0,
      reps: row.reps ?? 0,
      rpe: row.rpe ?? 0,
      set_type: row.set_type ?? 'S',
      session_id: row.session_id,
      id: row.id ?? undefined,
    }));
  },

  async deleteLog(tempId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM offline_logs WHERE tempId = ?', [tempId]);
  },

  async addDeletedLog(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('INSERT OR IGNORE INTO offline_deleted_logs (id) VALUES (?)', [id]);
  },

  async getAllDeletedLogs(): Promise<string[]> {
    const db = await getDb();
    const result = await db.getAllAsync<{ id: string }>('SELECT id FROM offline_deleted_logs');
    return result.map((r) => r.id);
  },

  async removeDeletedLog(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM offline_deleted_logs WHERE id = ?', [id]);
  },

  async addOfflineSession(session: WorkoutSession): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO offline_sessions (id, user_id, start_time, end_time, is_new) VALUES (?, ?, ?, ?, ?)',
      [
        session.id,
        session.user_id,
        session.start_time,
        session.end_time || null,
        session.is_new ? 1 : 0,
      ],
    );
  },

  async getOfflineSession(id: string): Promise<WorkoutSession | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<SessionRow>('SELECT * FROM offline_sessions WHERE id = ?', [
      id,
    ]);
    if (!row) return null;
    return {
      ...row,
      is_new: row.is_new === 1,
    };
  },

  async getAllOfflineSessions(): Promise<WorkoutSession[]> {
    const db = await getDb();
    const result = await db.getAllAsync<SessionRow>('SELECT * FROM offline_sessions');
    return result.map((row) => ({
      ...row,
      is_new: row.is_new === 1,
    }));
  },

  async deleteOfflineSession(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM offline_sessions WHERE id = ?', [id]);
  },

  async getQueueCount(): Promise<number> {
    try {
      const db = await getDb();
      const rowLogs = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM offline_logs',
      );
      const rowSess = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM offline_sessions',
      );
      const rowDel = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM offline_deleted_logs',
      );
      return (rowLogs?.count || 0) + (rowSess?.count || 0) + (rowDel?.count || 0);
    } catch (err) {
      console.warn('[SQLite] Errore durante getQueueCount (probabilmente DB non pronto):', err);
      return 0;
    }
  },
};
