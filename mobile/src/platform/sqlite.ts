/**
 * Platform facade: SQLite.
 * Backend: @op-engineering/op-sqlite, shaped like the former expo-sqlite async API
 * so `@/lib/sqlite` keeps using execAsync / runAsync / getAllAsync / getFirstAsync.
 */
import { type DB, openAsync, type Scalar } from '@op-engineering/op-sqlite';

export type SQLiteDatabase = {
  execAsync: (sql: string) => Promise<void>;
  runAsync: (sql: string, params?: Scalar[]) => Promise<void>;
  getAllAsync: <T>(sql: string, params?: Scalar[]) => Promise<T[]>;
  getFirstAsync: <T>(sql: string, params?: Scalar[]) => Promise<T | null>;
};

function wrapDb(db: DB): SQLiteDatabase {
  return {
    async execAsync(sql: string) {
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      for (const statement of statements) {
        await db.execute(statement);
      }
    },
    async runAsync(sql: string, params: Scalar[] = []) {
      await db.execute(sql, params);
    },
    async getAllAsync<T>(sql: string, params: Scalar[] = []) {
      const result = await db.execute(sql, params);
      return (result.rows ?? []) as T[];
    },
    async getFirstAsync<T>(sql: string, params: Scalar[] = []) {
      const result = await db.execute(sql, params);
      const row = result.rows?.[0];
      return (row as T | undefined) ?? null;
    },
  };
}

export async function openDatabaseAsync(name: string): Promise<SQLiteDatabase> {
  const db = await openAsync({ name });
  return wrapDb(db);
}
