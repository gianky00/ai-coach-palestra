import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sqliteService, initDb, notes } = vi.hoisted(() => {
  const noteStore = new Map<string, string>();
  return {
    initDb: vi.fn(async () => ({})),
    sqliteService: {
      getAllOfflineSessions: vi.fn(),
      getAllLogs: vi.fn(),
      deleteOfflineSession: vi.fn(),
      deleteLog: vi.fn(),
      addOfflineSession: vi.fn(),
      addLog: vi.fn(),
    },
    notes: {
      store: noteStore,
      getNote: vi.fn(async (id: string) => noteStore.get(id) ?? ''),
      setNote: vi.fn(async (id: string, note: string) => {
        noteStore.set(id, note.trim());
      }),
      clearNote: vi.fn(async (id: string) => {
        noteStore.delete(id);
      }),
    },
  };
});

vi.mock('../../src/lib/sqlite', () => ({ initDb, sqliteService }));

vi.mock('../../src/services/sessionNotesService', () => ({
  sessionNotesService: {
    getNote: notes.getNote,
    setNote: notes.setNote,
    clearNote: notes.clearNote,
  },
}));

vi.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    default: {
      getItem: vi.fn(async (k: string) => store.get(k) ?? null),
      setItem: vi.fn(async (k: string, v: string) => {
        store.set(k, v);
      }),
      removeItem: vi.fn(async (k: string) => {
        store.delete(k);
      }),
      multiRemove: vi.fn(async (keys: string[]) => {
        for (const k of keys) store.delete(k);
      }),
      clear: vi.fn(async () => {
        store.clear();
      }),
      __store: store,
    },
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearSmokeFixtures,
  clearSmokeSeed,
  fetchSmokeHistorySessions,
  isSmokeSeeded,
  loadSmokeSeedExercises,
  seedSmokeFixtures,
  seedSmokeWorkouts,
  SMOKE_EXERCISE_CATALOG,
  SMOKE_EXERCISES_KEY,
  SMOKE_SEED_FLAG_KEY,
} from '../../src/lib/smokeSeed';

describe('smokeSeed persistence helpers', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    notes.store.clear();
    await AsyncStorage.clear();
    sqliteService.getAllOfflineSessions.mockResolvedValue([]);
    sqliteService.getAllLogs.mockResolvedValue([]);
    sqliteService.deleteOfflineSession.mockResolvedValue(undefined);
    sqliteService.deleteLog.mockResolvedValue(undefined);
    sqliteService.addOfflineSession.mockResolvedValue(undefined);
    sqliteService.addLog.mockResolvedValue(undefined);
  });

  it('isSmokeSeeded / loadSmokeSeedExercises handle flag and corrupt JSON', async () => {
    expect(await isSmokeSeeded()).toBe(false);
    expect(await loadSmokeSeedExercises()).toEqual([]);

    await AsyncStorage.setItem(SMOKE_SEED_FLAG_KEY, '1');
    expect(await isSmokeSeeded()).toBe(true);

    await AsyncStorage.setItem(SMOKE_EXERCISES_KEY, 'not-json');
    expect(await loadSmokeSeedExercises()).toEqual([]);

    await AsyncStorage.setItem(SMOKE_EXERCISES_KEY, JSON.stringify([{ id: 'smoke-x' }]));
    expect(await loadSmokeSeedExercises()).toEqual([{ id: 'smoke-x' }]);
  });

  it('seedSmokeWorkouts writes sessions/logs/notes and aliases work', async () => {
    const result = await seedSmokeWorkouts({
      days: 3,
      sets: 2,
      now: new Date(2026, 7, 13, 12, 0, 0),
    });

    expect(initDb).toHaveBeenCalled();
    expect(result.sessions).toBeGreaterThan(0);
    expect(result.logs).toBeGreaterThan(0);
    expect(result.exercises).toBe(SMOKE_EXERCISE_CATALOG.length);
    expect(result.notes).toBeGreaterThan(0);
    expect(sqliteService.addOfflineSession).toHaveBeenCalled();
    expect(sqliteService.addLog).toHaveBeenCalled();
    expect(await isSmokeSeeded()).toBe(true);
    expect((await loadSmokeSeedExercises()).length).toBe(SMOKE_EXERCISE_CATALOG.length);

    expect(seedSmokeFixtures).toBe(seedSmokeWorkouts);
    expect(clearSmokeFixtures).toBe(clearSmokeSeed);
  });

  it('clearSmokeSeed removes only smoke fixtures and notes', async () => {
    sqliteService.getAllOfflineSessions.mockResolvedValue([
      { id: 'smoke-seed-sess-0', user_id: 'smoke-user' },
      { id: 'real-sess', user_id: 'u1' },
    ]);
    sqliteService.getAllLogs.mockResolvedValue([
      {
        tempId: 'smoke-seed-log-0-x-s1',
        id: 'smoke-seed-log-0-x-s1',
        session_id: 'smoke-seed-sess-0',
        user_id: 'smoke-user',
      },
      { tempId: 'real-log', id: 'real-log', session_id: 'real-sess', user_id: 'u1' },
    ]);
    notes.store.set('smoke-seed-sess-0', 'keep clearing');
    await AsyncStorage.setItem(SMOKE_SEED_FLAG_KEY, '1');
    await AsyncStorage.setItem(SMOKE_EXERCISES_KEY, '[]');

    const cleared = await clearSmokeSeed();
    expect(cleared.clearedSessions).toBe(1);
    expect(cleared.clearedLogs).toBe(1);
    expect(sqliteService.deleteOfflineSession).toHaveBeenCalledWith('smoke-seed-sess-0');
    expect(sqliteService.deleteLog).toHaveBeenCalledWith('smoke-seed-log-0-x-s1');
    expect(notes.clearNote).toHaveBeenCalledWith('smoke-seed-sess-0');
    expect(await isSmokeSeeded()).toBe(false);
  });

  it('fetchSmokeHistorySessions returns closed smoke sessions newest-first', async () => {
    sqliteService.getAllOfflineSessions.mockResolvedValue([
      {
        id: 'smoke-seed-sess-0',
        user_id: 'smoke-user',
        start_time: '2026-08-10T18:00:00.000Z',
        end_time: '2026-08-10T19:00:00.000Z',
      },
      {
        id: 'smoke-seed-sess-1',
        user_id: 'smoke-user',
        start_time: '2026-08-12T18:00:00.000Z',
        end_time: '2026-08-12T19:00:00.000Z',
      },
      {
        id: 'smoke-open',
        user_id: 'smoke-user',
        start_time: '2026-08-13T18:00:00.000Z',
        end_time: null,
      },
      {
        id: 'real',
        user_id: 'u1',
        start_time: '2026-08-11T18:00:00.000Z',
        end_time: '2026-08-11T19:00:00.000Z',
      },
    ]);
    sqliteService.getAllLogs.mockResolvedValue([
      { session_id: 'smoke-seed-sess-1', weight: 80, reps: 8 },
      { session_id: 'smoke-seed-sess-1', weight: 82.5, reps: 6 },
      { session_id: 'real', weight: 100, reps: 5 },
    ]);

    const rows = await fetchSmokeHistorySessions();
    expect(rows.map((r) => r.id)).toEqual(['smoke-seed-sess-1', 'smoke-seed-sess-0']);
    expect(rows[0]?.training_logs).toEqual([
      { weight: 80, reps: 8 },
      { weight: 82.5, reps: 6 },
    ]);
  });
});
