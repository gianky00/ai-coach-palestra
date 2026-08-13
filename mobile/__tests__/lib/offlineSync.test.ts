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

vi.mock('../../src/lib/syncTelemetry', () => ({
  addSyncFailureBreadcrumb: vi.fn(),
  addSyncSummaryBreadcrumb: vi.fn(),
}));

import {
  __resetSyncStateForTests,
  deleteLogSafely,
  endWorkoutSafely,
  isDuplicateConflict,
  isSyncWriteOk,
  saveLogSafely,
  startWorkoutSafely,
  syncOfflineLogs,
} from '../../src/lib/offlineSync';

const online = () =>
  netInfoFetch.mockResolvedValue({ isConnected: true, isInternetReachable: true });
const offline = () =>
  netInfoFetch.mockResolvedValue({ isConnected: false, isInternetReachable: false });
const uncertain = () =>
  netInfoFetch.mockResolvedValue({ isConnected: null, isInternetReachable: null });

const mockDeleteChain = (error: null | { code?: string; message?: string } = null) => ({
  eq: vi.fn().mockResolvedValue({ error }),
});

const mockUpsert = (error: null | { code?: string; message?: string } = null) =>
  vi.fn().mockResolvedValue({ error });

describe('isDuplicateConflict / isSyncWriteOk', () => {
  it('treats 23505 as ok', () => {
    expect(isDuplicateConflict({ code: '23505' })).toBe(true);
    expect(isDuplicateConflict({ code: '23503' })).toBe(false);
    expect(isSyncWriteOk(null)).toBe(true);
    expect(isSyncWriteOk({ code: '23505' })).toBe(true);
    expect(isSyncWriteOk({ code: 'xx' })).toBe(false);
  });
});

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

  it('treats null NetInfo as online', async () => {
    uncertain();
    const result = await syncOfflineLogs();
    expect(result).toEqual({ synced: 0, failed: 0 });
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

  it('skips re-upload of tombstoned deleted ids', async () => {
    online();
    sqliteService.getAllDeletedLogs.mockResolvedValue(['log-dead']);
    sqliteService.getAllLogs.mockResolvedValue([
      {
        tempId: 'temp-dead',
        id: 'log-dead',
        user_id: 'u1',
        exercise_id: 'ex1',
        session_id: null,
        weight: 1,
        reps: 1,
        rpe: 5,
        set_type: 'S',
        created_at: '2026-07-13T10:00:00Z',
      },
    ]);

    const upsert = mockUpsert(null);
    supabaseFrom.mockReturnValue({
      delete: () => mockDeleteChain(null),
      upsert,
    });

    await syncOfflineLogs();
    expect(sqliteService.removeDeletedLog).toHaveBeenCalledWith('log-dead');
    expect(sqliteService.deleteLog).toHaveBeenCalledWith('temp-dead');
    expect(upsert).not.toHaveBeenCalled();
  });

  it('removes synced deleted logs and counts failures', async () => {
    online();
    sqliteService.getAllDeletedLogs.mockResolvedValue(['deleted-1', 'deleted-2']);
    let n = 0;
    supabaseFrom.mockReturnValue({
      delete: () => mockDeleteChain(n++ === 0 ? null : { message: 'fail' }),
      upsert: mockUpsert(),
    });

    const result = await syncOfflineLogs();
    expect(sqliteService.removeDeletedLog).toHaveBeenCalledWith('deleted-1');
    expect(result.failed).toBeGreaterThanOrEqual(1);
  });

  it('syncs offline sessions (incl. 23505)', async () => {
    online();
    sqliteService.getAllOfflineSessions.mockResolvedValue([
      { id: 's1', user_id: 'u1', start_time: 't', end_time: null },
    ]);
    const upsert = mockUpsert({ code: '23505', message: 'dup' });
    supabaseFrom.mockReturnValue({ upsert, delete: () => mockDeleteChain() });

    const result = await syncOfflineLogs();
    expect(sqliteService.deleteOfflineSession).toHaveBeenCalledWith('s1');
    expect(result.synced).toBeGreaterThanOrEqual(1);
  });

  it('riprova log con FK 23503 senza session_id', async () => {
    online();
    sqliteService.getAllLogs.mockResolvedValue([
      {
        tempId: 'temp-fk',
        id: 'log-fk',
        user_id: 'u1',
        exercise_id: 'ex1',
        session_id: 'missing',
        weight: 50,
        reps: 8,
        rpe: 7,
        set_type: 'S',
        created_at: '2026-07-13T10:00:00Z',
      },
    ]);

    const upsert = vi
      .fn()
      .mockResolvedValueOnce({ error: { code: '23503', message: 'fk' } })
      .mockResolvedValueOnce({ error: null });
    supabaseFrom.mockReturnValue({ upsert, delete: () => mockDeleteChain() });

    const result = await syncOfflineLogs();
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(sqliteService.deleteLog).toHaveBeenCalledWith('temp-fk');
    expect(result.synced).toBe(1);
  });

  it('non strippa session_id se sessione fallita in questo pass', async () => {
    online();
    sqliteService.getAllOfflineSessions.mockResolvedValue([
      { id: 's-fail', user_id: 'u1', start_time: 't', end_time: null },
    ]);
    sqliteService.getAllLogs.mockResolvedValue([
      {
        tempId: 'temp-wait',
        id: 'log-wait',
        user_id: 'u1',
        exercise_id: 'ex1',
        session_id: 's-fail',
        weight: 50,
        reps: 8,
        rpe: 7,
        set_type: 'S',
        created_at: '2026-07-13T10:00:00Z',
      },
    ]);

    // Distinguish by table
    supabaseFrom.mockImplementation((table: string) => {
      if (table === 'workout_sessions') {
        return { upsert: vi.fn().mockResolvedValue({ error: { code: '42000', message: 'boom' } }) };
      }
      return {
        upsert: vi.fn().mockResolvedValue({ error: { code: '23503', message: 'fk' } }),
        delete: () => mockDeleteChain(),
      };
    });

    const result = await syncOfflineLogs();
    expect(result.failed).toBeGreaterThanOrEqual(2);
    expect(sqliteService.deleteLog).not.toHaveBeenCalledWith('temp-wait');
  });

  it('session upsert failure incrementa failed', async () => {
    online();
    sqliteService.getAllOfflineSessions.mockResolvedValue([
      { id: 's-fail', user_id: 'u1', start_time: 't', end_time: null },
    ]);
    supabaseFrom.mockReturnValue({
      upsert: mockUpsert({ code: '42000', message: 'boom' }),
      delete: () => mockDeleteChain(),
    });
    const result = await syncOfflineLogs();
    expect(result.failed).toBeGreaterThanOrEqual(1);
    expect(sqliteService.deleteOfflineSession).not.toHaveBeenCalled();
  });

  it('log upsert failure senza FK incrementa failed', async () => {
    online();
    sqliteService.getAllLogs.mockResolvedValue([
      {
        tempId: 't-fail',
        id: 'l-fail',
        user_id: 'u1',
        exercise_id: 'ex',
        session_id: null,
        weight: 1,
        reps: 1,
        rpe: 5,
        set_type: 'S',
        created_at: '2026-07-13T10:00:00Z',
      },
    ]);
    supabaseFrom.mockReturnValue({
      upsert: mockUpsert({ code: 'xx', message: 'nope' }),
      delete: () => mockDeleteChain(),
    });
    const result = await syncOfflineLogs();
    expect(result.failed).toBe(1);
  });
});

describe('saveLogSafely / deleteLogSafely', () => {
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
    expect(result.isOffline).toBe(true);
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
    expect(result.isOffline).toBe(false);
    expect(sqliteService.deleteLog).toHaveBeenCalled();
  });

  it('treats 23505 as success on saveLogSafely', async () => {
    online();
    const upsert = mockUpsert({ code: '23505', message: 'dup' });
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
    expect(result.isOffline).toBe(false);
    expect(sqliteService.deleteLog).toHaveBeenCalled();
  });

  it('resta offline se upsert online fallisce', async () => {
    online();
    supabaseFrom.mockReturnValue({ upsert: mockUpsert({ message: 'fail' }) });
    const result = await saveLogSafely({
      user_id: 'u1',
      exercise_id: 'ex1',
      session_id: 's1',
      weight: 80,
      reps: 8,
      rpe: 7,
      set_type: 'S',
    });
    expect(result.isOffline).toBe(true);
  });

  it('delete senza realId solo locale', async () => {
    await deleteLogSafely('temp-only');
    expect(sqliteService.addDeletedLog).not.toHaveBeenCalled();
  });

  it('queues deletion when offline', async () => {
    offline();
    const result = await deleteLogSafely('temp-1', 'real-1');
    expect(result.isOffline).toBe(true);
  });

  it('deletes remotely when online', async () => {
    online();
    supabaseFrom.mockReturnValue({ delete: () => mockDeleteChain(null) });
    await deleteLogSafely('temp-1', 'real-1');
    expect(sqliteService.addDeletedLog).not.toHaveBeenCalled();
  });
});

describe('startWorkoutSafely / endWorkoutSafely', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetSyncStateForTests();
    sqliteService.getAllLogs.mockResolvedValue([]);
    sqliteService.getOfflineSession.mockResolvedValue(null);
  });

  it('start offline crea sessione locale', async () => {
    offline();
    const result = await startWorkoutSafely('u1');
    expect(sqliteService.addOfflineSession).toHaveBeenCalled();
    expect(result.isOffline).toBe(true);
    expect(result.data.user_id).toBe('u1');
  });

  it('non muta dateOverride (evita created_at a mezzanotte nel caller)', async () => {
    offline();
    const override = new Date(2026, 7, 13, 15, 30, 0);
    const beforeMs = override.getTime();
    const result = await startWorkoutSafely('u1', override);
    expect(override.getTime()).toBe(beforeMs);
    expect(override.getHours()).toBe(15);
    expect(result.data.start_time).toBe(new Date(2026, 7, 13, 15, 30, 0).toISOString());
  });

  it('start online inserisce e ripulisce locale', async () => {
    online();
    const insert = vi.fn().mockResolvedValue({ error: null });
    const updateEq = vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    supabaseFrom.mockImplementation((table: string) => {
      if (table === 'workout_sessions') return { insert };
      return { update: vi.fn().mockReturnValue({ eq: updateEq }) };
    });

    const result = await startWorkoutSafely('u1');
    expect(insert).toHaveBeenCalled();
    expect(sqliteService.deleteOfflineSession).toHaveBeenCalled();
    expect(result.isOffline).toBe(false);
  });

  it('start aggancia orphan logs del giorno', async () => {
    offline();
    sqliteService.getAllLogs.mockResolvedValue([
      {
        tempId: 'o1',
        id: 'o1',
        user_id: 'u1',
        exercise_id: 'ex',
        session_id: null,
        weight: 1,
        reps: 1,
        rpe: 5,
        set_type: 'S',
        created_at: new Date().toISOString(),
      },
    ]);
    await startWorkoutSafely('u1');
    expect(sqliteService.addLog).toHaveBeenCalled();
  });

  it('end aggiorna sessione offline esistente', async () => {
    offline();
    sqliteService.getOfflineSession.mockResolvedValue({
      id: 's1',
      user_id: 'u1',
      start_time: 't0',
      end_time: null,
    });
    const result = await endWorkoutSafely('s1', 'u1', 't1');
    expect(sqliteService.addOfflineSession).toHaveBeenCalledWith(
      expect.objectContaining({ end_time: 't1' }),
    );
    expect(result.isOffline).toBe(true);
  });

  it('end online aggiorna remoto', async () => {
    online();
    sqliteService.getOfflineSession.mockResolvedValue(null);
    const eq = vi.fn().mockResolvedValue({ error: null });
    supabaseFrom.mockReturnValue({ update: vi.fn().mockReturnValue({ eq }) });
    const result = await endWorkoutSafely('s1', 'u1', 't1', 't0');
    expect(eq).toHaveBeenCalledWith('id', 's1');
    expect(sqliteService.deleteOfflineSession).toHaveBeenCalledWith('s1');
    expect(result.isOffline).toBe(false);
  });

  it('end offline senza existing crea sessione con startTime', async () => {
    offline();
    sqliteService.getOfflineSession.mockResolvedValue(null);
    await endWorkoutSafely('s9', 'u1', 't1', 't0');
    expect(sqliteService.addOfflineSession).toHaveBeenCalledWith(
      expect.objectContaining({ id: 's9', start_time: 't0', end_time: 't1' }),
    );
  });
});
