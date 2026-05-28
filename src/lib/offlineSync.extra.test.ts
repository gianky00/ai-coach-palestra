import { beforeEach, describe, expect, it, vi } from 'vitest';
import { syncOfflineLogs, saveLogSafely } from './offlineSync';
import { indexedDbService } from './indexedDb';
import { supabase } from './supabase';

vi.mock('./indexedDb');
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(),
      update: vi.fn(),
      select: vi.fn(),
    })),
  },
}));

describe('offlineSync extra coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  });

  it('syncOfflineLogs: handles log sync error code 23503', async () => {
    (indexedDbService.getAllOfflineSessions as any).mockResolvedValue([]);
    (indexedDbService.getAllLogs as any).mockResolvedValue([
      {
        tempId: 't1',
        user_id: 'u1',
        exercise_id: 'e1',
        weight: 60,
        reps: 10,
        rpe: 8,
        created_at: new Date().toISOString(),
        session_id: null,
      },
    ]);

    const mockInsert = vi.fn().mockResolvedValue({
      error: { code: '23503', message: 'foreign key violation' },
    });
    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await syncOfflineLogs();

    // Should delete log from IndexedDB if it's an unrecoverable error
    expect(indexedDbService.deleteLog).toHaveBeenCalledWith('t1');
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('syncOfflineLogs: handles generic exception during log sync', async () => {
    (indexedDbService.getAllOfflineSessions as any).mockResolvedValue([]);
    (indexedDbService.getAllLogs as any).mockResolvedValue([
      {
        tempId: 't1',
        user_id: 'u1',
        exercise_id: 'e1',
        weight: 60,
        reps: 10,
        rpe: 8,
        created_at: new Date().toISOString(),
        session_id: null,
      },
    ]);

    const mockInsert = vi.fn().mockImplementation(() => {
      throw new Error('Sync failed');
    });
    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await syncOfflineLogs();

    expect(consoleWarnSpy).toHaveBeenCalledWith('Network error sync log:', expect.any(Error));
    consoleWarnSpy.mockRestore();
  });

  it('saveLogSafely: handles missing session_id (should still try to save online if online)', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'l1' }, error: null }),
      }),
    });
    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    const res = await saveLogSafely({
      user_id: 'u1',
      exercise_id: 'e1',
      session_id: null, // No session
      weight: 50,
      reps: 10,
      rpe: 8,
    });

    expect(res.error).toBeNull();
    expect(res.isOffline).toBe(false);
  });
});
