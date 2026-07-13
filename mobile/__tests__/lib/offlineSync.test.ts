import { beforeEach, describe, expect, it, vi } from 'vitest';

const { netInfoFetch, sqliteService, supabaseFrom } = vi.hoisted(() => ({
  netInfoFetch: vi.fn(),
  sqliteService: {
    getAllDeletedLogs: vi.fn(),
    removeDeletedLog: vi.fn(),
    getAllOfflineSessions: vi.fn(),
    deleteOfflineSession: vi.fn(),
    getAllLogs: vi.fn(),
    deleteLog: vi.fn(),
    addLog: vi.fn(),
    addOfflineSession: vi.fn(),
    getOfflineSession: vi.fn(),
    addDeletedLog: vi.fn(),
  },
  supabaseFrom: vi.fn(),
}));

vi.mock('@react-native-community/netinfo', () => ({
  fetch: netInfoFetch,
}));

vi.mock('../../src/lib/sqlite', () => ({ sqliteService }));

vi.mock('../../src/lib/supabase', () => ({
  supabase: { from: supabaseFrom },
}));

import {
  __resetSyncStateForTests,
  deleteLogSafely,
  saveLogSafely,
  syncOfflineLogs,
} from '../../src/lib/offlineSync';

const online = () => netInfoFetch.mockResolvedValue({ isConnected: true });
const offline = () => netInfoFetch.mockResolvedValue({ isConnected: false });

const mockDeleteChain = (error: null | { code?: string } = null) => ({
  eq: vi.fn().mockResolvedValue({ error }),
});

const mockUpsert = (error: null | { code?: string } = null) => vi.fn().mockResolvedValue({ error });

describe('syncOfflineLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetSyncStateForTests();
    sqliteService.getAllDeletedLogs.mockResolvedValue([]);
    sqliteService.getAllOfflineSessions.mockResolvedValue([]);
    sqliteService.getAllLogs.mockResolvedValue([]);
  });

  it('skips when offline', async () => {
    offline();
    await syncOfflineLogs();
    expect(supabaseFrom).not.toHaveBeenCalled();
  });

  it('syncs pending logs when online', async () => {
    online();
    sqliteService.getAllLogs.mockResolvedValue([
      {
        tempId: 'temp-1',
        id: 'log-1',
        user_id: 'u1',
        exercise_id: 'ex1',
        session_id: 's1',
        weight: 100,
        reps: 5,
        rpe: 8,
        set_type: 'S',
        created_at: '2026-07-13T10:00:00Z',
      },
    ]);

    const upsert = mockUpsert(null);
    supabaseFrom.mockReturnValue({ upsert, delete: () => mockDeleteChain() });

    await syncOfflineLogs();

    expect(upsert).toHaveBeenCalled();
    expect(sqliteService.deleteLog).toHaveBeenCalledWith('temp-1');
  });

  it('removes synced deleted logs', async () => {
    online();
    sqliteService.getAllDeletedLogs.mockResolvedValue(['deleted-1']);
    supabaseFrom.mockReturnValue({
      delete: () => mockDeleteChain(null),
      upsert: mockUpsert(),
    });

    await syncOfflineLogs();

    expect(sqliteService.removeDeletedLog).toHaveBeenCalledWith('deleted-1');
  });
});

describe('saveLogSafely', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetSyncStateForTests();
  });

  it('queues log when offline', async () => {
    offline();

    const result = await saveLogSafely({
      user_id: 'u1',
      exercise_id: 'ex1',
      session_id: 's1',
      weight: 80,
      reps: 8,
      rpe: 7,
      set_type: 'S',
    });

    expect(sqliteService.addLog).toHaveBeenCalled();
    expect(result.isOffline).toBe(true);
    expect(supabaseFrom).not.toHaveBeenCalled();
  });

  it('upserts and clears sqlite when online', async () => {
    online();
    const upsert = mockUpsert(null);
    supabaseFrom.mockReturnValue({ upsert });

    const result = await saveLogSafely({
      user_id: 'u1',
      exercise_id: 'ex1',
      session_id: 's1',
      weight: 80,
      reps: 8,
      rpe: 7,
      set_type: 'S',
    });

    expect(upsert).toHaveBeenCalled();
    expect(sqliteService.deleteLog).toHaveBeenCalled();
    expect(result.isOffline).toBe(false);
  });
});

describe('deleteLogSafely', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetSyncStateForTests();
  });

  it('queues deletion when offline', async () => {
    offline();

    const result = await deleteLogSafely('temp-1', 'real-1');

    expect(sqliteService.deleteLog).toHaveBeenCalledWith('temp-1');
    expect(sqliteService.addDeletedLog).toHaveBeenCalledWith('real-1');
    expect(result.isOffline).toBe(true);
  });

  it('deletes remotely when online', async () => {
    online();
    supabaseFrom.mockReturnValue({ delete: () => mockDeleteChain(null) });

    await deleteLogSafely('temp-1', 'real-1');

    expect(sqliteService.addDeletedLog).not.toHaveBeenCalled();
  });
});
