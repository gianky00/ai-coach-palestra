/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OfflineLog, WorkoutSession } from '../types';
import { indexedDbService } from './indexedDb';
import {
  endWorkoutSafely,
  getOfflineLogsForExercise,
  getOfflineQueueCount,
  removeOfflineLog,
  saveLogSafely,
  startWorkoutSafely,
  syncOfflineLogs,
} from './offlineSync';
import { supabase } from './supabase';

// Mock di react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Mock di supabase
vi.mock('./supabase', () => {
  const mockFrom = vi.fn();
  return {
    supabase: {
      from: mockFrom,
    },
  };
});

// Mock di indexedDb
vi.mock('./indexedDb', () => {
  let dbLogs: OfflineLog[] = [];
  let dbSessions: WorkoutSession[] = [];
  return {
    indexedDbService: {
      addLog: vi.fn(async (log: OfflineLog): Promise<void> => {
        dbLogs.push(log);
      }),
      getAllLogs: vi.fn(async (): Promise<OfflineLog[]> => [...dbLogs]),
      getLogsByExercise: vi.fn(
        async (exId: string): Promise<OfflineLog[]> => dbLogs.filter((l) => l.exercise_id === exId),
      ),
      deleteLog: vi.fn(async (tempId: string): Promise<void> => {
        dbLogs = dbLogs.filter((l) => l.tempId !== tempId);
      }),
      clearLogs: vi.fn(async (): Promise<void> => {
        dbLogs = [];
      }),
      getQueueCount: vi.fn(async (): Promise<number> => dbLogs.length),
      addOfflineSession: vi.fn(async (session: WorkoutSession): Promise<void> => {
        dbSessions = dbSessions.filter((s) => s.id !== session.id);
        dbSessions.push(session);
      }),
      getAllOfflineSessions: vi.fn(async (): Promise<WorkoutSession[]> => [...dbSessions]),
      getOfflineSession: vi.fn(async (id: string): Promise<WorkoutSession | null> => {
        return dbSessions.find((s) => s.id === id) || null;
      }),
      deleteOfflineSession: vi.fn(async (id: string): Promise<void> => {
        dbSessions = dbSessions.filter((s) => s.id !== id);
      }),
      clearOfflineSessions: vi.fn(async (): Promise<void> => {
        dbSessions = [];
      }),
    },
  };
});

describe('offlineSync - Unit & Integration Tests', () => {
  let mockSupabaseQuery: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Resettiamo il database IndexedDB in memoria del mock
    await indexedDbService.clearLogs();
    await indexedDbService.clearOfflineSessions();

    // Riconfiguriamo il mock di Supabase di default
    mockSupabaseQuery = {
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockImplementation(async () => ({ data: { id: 'real-id-999' }, error: null })),
      eq: vi.fn().mockReturnThis(),
    };

    vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery as any);
  });

  describe('syncOfflineLogs', () => {
    it('should do nothing if offline', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
      await syncOfflineLogs();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should sync offline sessions and logs online', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

      // Creiamo sessione temporanea in IndexedDB
      const offlineSession: WorkoutSession = {
        id: 'temp-session-id',
        user_id: 'user-123',
        start_time: new Date().toISOString(),
        end_time: null,
        is_new: true,
      };
      await indexedDbService.addOfflineSession(offlineSession);

      // Creiamo un log temporaneo associato a quella sessione
      const offlineLog: OfflineLog = {
        tempId: 'temp-log-id',
        user_id: 'user-123',
        exercise_id: 'ex-1',
        session_id: 'temp-session-id',
        weight: 70,
        reps: 10,
        rpe: 8,
        created_at: new Date().toISOString(),
      };
      await indexedDbService.addLog(offlineLog);

      // Mock di Supabase per gestire l'inserimento sequenziale della sessione e poi del log
      mockSupabaseQuery.insert = vi.fn().mockImplementation((data: any[]) => {
        const isSession = data[0] && 'start_time' in data[0];
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(async () => {
              if (isSession) {
                return { data: { id: 'real-session-999' }, error: null };
              }
              return { data: { id: 'real-log-999' }, error: null };
            }),
          }),
        };
      });

      // Eseguiamo il sync
      await syncOfflineLogs();

      // Verifica che la sessione e il log siano stati inviati su Supabase
      expect(supabase.from).toHaveBeenCalledWith('workout_sessions');
      expect(supabase.from).toHaveBeenCalledWith('training_logs');

      // Verifica che IndexedDB sia stato pulito
      const remainingSessions = await indexedDbService.getAllOfflineSessions();
      expect(remainingSessions.length).toBe(0);
      const remainingLogs = await indexedDbService.getAllLogs();
      expect(remainingLogs.length).toBe(0);
    });

    it('should handle permanent database constraints (23503) by discarding logs', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

      const offlineLog: OfflineLog = {
        tempId: 'temp-log-id',
        user_id: 'user-123',
        exercise_id: 'ex-1',
        session_id: 'invalid-session-id',
        weight: 70,
        reps: 10,
        rpe: 8,
        created_at: new Date().toISOString(),
      };
      await indexedDbService.addLog(offlineLog);

      mockSupabaseQuery.insert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockImplementation(async () => {
            return { data: null, error: { code: '23503', message: 'Foreign key violation' } };
          }),
        }),
      });

      await syncOfflineLogs();

      // Log orfano rimosso a causa di errore 23503
      const remainingLogs = await indexedDbService.getAllLogs();
      expect(remainingLogs.length).toBe(0);
    });
  });

  describe('startWorkoutSafely', () => {
    it('should create an online session when online and supabase succeeds', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

      const result = await startWorkoutSafely('user-123');

      expect(supabase.from).toHaveBeenCalledWith('workout_sessions');
      expect(mockSupabaseQuery.insert).toHaveBeenCalled();
      expect(result.isOffline).toBe(false);
      expect((result.data as any).id).toBe('real-id-999');

      // Verifica che non sia stato salvato in IndexedDB
      const offlineSessions = await indexedDbService.getAllOfflineSessions();
      expect(offlineSessions.length).toBe(0);
    });

    it('should fallback to offline session when navigator is offline', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

      const result = await startWorkoutSafely('user-123');

      expect(supabase.from).not.toHaveBeenCalled();
      expect(result.isOffline).toBe(true);
      expect(result.data.id).toBeDefined(); // UUID generato
      expect((result.data as any).is_new).toBe(true);

      // Verifica salvataggio in IndexedDB
      const offlineSessions = await indexedDbService.getAllOfflineSessions();
      expect(offlineSessions.length).toBe(1);
      expect(offlineSessions[0].id).toBe(result.data.id);
    });
  });

  describe('endWorkoutSafely', () => {
    it('should end session online if the session was created online and network is active', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

      const result = await endWorkoutSafely('online-session-id', 'user-123');

      expect(supabase.from).toHaveBeenCalledWith('workout_sessions');
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          end_time: expect.any(String),
        }),
      );
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', 'online-session-id');
      expect(result.isOffline).toBe(false);
    });

    it('should end session offline if the session was created offline', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

      // Creiamo prima una sessione offline in IndexedDB
      const offlineSession: WorkoutSession = {
        id: 'temp-session-id',
        user_id: 'user-123',
        start_time: new Date().toISOString(),
        end_time: null,
        is_new: true,
      };
      await indexedDbService.addOfflineSession(offlineSession);

      const result = await endWorkoutSafely('temp-session-id', 'user-123');

      // Non deve andare online poiché la sessione d'origine era offline
      expect(supabase.from).not.toHaveBeenCalled();
      expect(result.isOffline).toBe(true);

      // La sessione in IndexedDB deve essere stata aggiornata con l'end_time
      const savedSession = await indexedDbService.getOfflineSession('temp-session-id');
      expect(savedSession?.end_time).not.toBeNull();
    });
  });

  describe('saveLogSafely (Circuit Breaker & Idempotence)', () => {
    it('should save log online when online and supabase succeeds', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

      mockSupabaseQuery.single = vi.fn().mockImplementation(async () => ({
        data: { id: 'log-id-123', weight: 80, reps: 8 },
        error: null,
      }));

      const logData = {
        exercise_id: 'ex-1',
        session_id: 'session-123',
        user_id: 'user-123',
        weight: 80,
        reps: 8,
        rpe: 9,
        set_type: 'S' as any,
      };

      const result = await saveLogSafely(logData);

      expect(supabase.from).toHaveBeenCalledWith('training_logs');
      expect(result.isOffline).toBe(false);
      expect((result.data as any)?.id).toBe('log-id-123');
    });

    it('should handle idempotence with code 23505 (duplicate key) without failing', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

      mockSupabaseQuery.single = vi.fn().mockImplementation(async () => ({
        data: null,
        error: { code: '23505', message: 'Unique constraint violation' },
      }));

      const logData = {
        exercise_id: 'ex-1',
        session_id: 'session-123',
        user_id: 'user-123',
        weight: 80,
        reps: 8,
        rpe: 9,
        set_type: 'S' as any,
      };

      const result = await saveLogSafely(logData);

      expect(result.error).toBeNull();
      expect(result.isOffline).toBe(false);
    });

    it('should trigger Circuit Breaker on repeated network failures', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

      mockSupabaseQuery.single = vi.fn().mockImplementation(async () => ({
        data: null,
        error: { code: '500', message: 'Network Timeout' },
      }));

      const logData = {
        exercise_id: 'ex-1',
        session_id: 'session-123',
        user_id: 'user-123',
        weight: 80,
        reps: 8,
        rpe: 9,
        set_type: 'S' as any,
      };

      // 1° Fallimento
      let result = await saveLogSafely(logData);
      expect(result.isOffline).toBe(true);

      // 2° Fallimento
      result = await saveLogSafely(logData);
      expect(result.isOffline).toBe(true);

      // 3° Fallimento -> Deve far scattare il circuit breaker!
      result = await saveLogSafely(logData);
      expect(result.isOffline).toBe(true);

      // Ora Supabase viene configurato per ritornare successo
      mockSupabaseQuery.single = vi.fn().mockImplementation(async () => ({
        data: { id: 'new-id-123' },
        error: null,
      }));

      // 4° Tentativo: Circuito APERTO, deve andare automaticamente offline
      vi.clearAllMocks();
      vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery as any);

      result = await saveLogSafely(logData);

      expect(supabase.from).not.toHaveBeenCalled();
      expect(result.isOffline).toBe(true);
    });
  });

  describe('Queue and Utilities', () => {
    it('should return correct queue count and let remove offline logs', async () => {
      await indexedDbService.addLog({
        tempId: 'log-1',
        user_id: 'u-1',
        exercise_id: 'ex-1',
        session_id: 'sess-1',
        weight: 50,
        reps: 10,
        rpe: 8,
        created_at: new Date().toISOString(),
      });
      await indexedDbService.addLog({
        tempId: 'log-2',
        user_id: 'u-1',
        exercise_id: 'ex-1',
        session_id: 'sess-1',
        weight: 50,
        reps: 10,
        rpe: 8,
        created_at: new Date().toISOString(),
      });
      await indexedDbService.addOfflineSession({
        id: 'sess-1',
        user_id: 'u-1',
        start_time: new Date().toISOString(),
        end_time: null,
      });

      const count = await getOfflineQueueCount();
      expect(count).toBe(3); // 2 log + 1 sessione

      await removeOfflineLog('log-1');
      const updatedCount = await getOfflineQueueCount();
      expect(updatedCount).toBe(2);
    });

    it('should fetch offline logs by exercise ID', async () => {
      await indexedDbService.addLog({
        tempId: 'log-1',
        exercise_id: 'ex-A',
        user_id: 'u-1',
        session_id: 'sess-1',
        weight: 50,
        reps: 10,
        rpe: 8,
        created_at: new Date().toISOString(),
      });
      await indexedDbService.addLog({
        tempId: 'log-2',
        exercise_id: 'ex-B',
        user_id: 'u-1',
        session_id: 'sess-1',
        weight: 50,
        reps: 10,
        rpe: 8,
        created_at: new Date().toISOString(),
      });

      const logs = await getOfflineLogsForExercise('ex-A');
      expect(logs.length).toBe(1);
      expect(logs[0].tempId).toBe('log-1');
    });
  });

  describe('Error handling and network fallback branches', () => {
    it('syncOfflineLogs: handles general network errors on session insert without crashing', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

      await indexedDbService.addOfflineSession({
        id: 'temp-session-id',
        user_id: 'user-123',
        start_time: new Date().toISOString(),
        end_time: null,
        is_new: true,
      });

      mockSupabaseQuery.insert = vi.fn().mockImplementation(() => {
        throw new Error('Network error mock');
      });

      await syncOfflineLogs();
      const remainingSessions = await indexedDbService.getAllOfflineSessions();
      expect(remainingSessions.length).toBe(1);
    });

    it('syncOfflineLogs: handles general network errors on session update without crashing', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

      await indexedDbService.addOfflineSession({
        id: 'real-session-id',
        user_id: 'user-123',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        is_new: false,
      });

      mockSupabaseQuery.update = vi.fn().mockImplementation(() => {
        throw new Error('Network error mock');
      });

      await syncOfflineLogs();
      const remainingSessions = await indexedDbService.getAllOfflineSessions();
      expect(remainingSessions.length).toBe(1);
    });

    it('syncOfflineLogs: handles session insert error constraints (e.g. 23503)', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

      await indexedDbService.addOfflineSession({
        id: 'temp-session-id',
        user_id: 'user-123',
        start_time: new Date().toISOString(),
        end_time: null,
        is_new: true,
      });

      mockSupabaseQuery.insert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockImplementation(async () => {
            return { data: null, error: { code: '23503' } };
          }),
        }),
      });

      await syncOfflineLogs();
      const remainingSessions = await indexedDbService.getAllOfflineSessions();
      expect(remainingSessions.length).toBe(0);
    });

    it('syncOfflineLogs: handles session update error constraints (e.g. PGRST116)', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

      await indexedDbService.addOfflineSession({
        id: 'real-session-id',
        user_id: 'user-123',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        is_new: false,
      });

      mockSupabaseQuery.update = vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation(async () => {
          return { data: null, error: { code: 'PGRST116' } };
        }),
      });

      await syncOfflineLogs();
      const remainingSessions = await indexedDbService.getAllOfflineSessions();
      expect(remainingSessions.length).toBe(0);
    });

    it('syncOfflineLogs: handles network exception when inserting logs', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

      await indexedDbService.addLog({
        tempId: 'temp-log-id',
        user_id: 'u-1',
        exercise_id: 'ex-1',
        weight: 50,
        reps: 10,
        created_at: new Date().toISOString(),
      });

      mockSupabaseQuery.insert = vi.fn().mockImplementation(() => {
        throw new Error('Network timeout during log insertion');
      });

      await syncOfflineLogs();
      const remainingLogs = await indexedDbService.getAllLogs();
      expect(remainingLogs.length).toBe(1);
    });

    it('startWorkoutSafely: handles network exception and falls back to offline', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
      mockSupabaseQuery.insert = vi.fn().mockImplementation(() => {
        throw new Error('Network failure');
      });

      const res = await startWorkoutSafely('user-123');
      expect(res.isOffline).toBe(true);
      
      const offlineSessions = await indexedDbService.getAllOfflineSessions();
      expect(offlineSessions.length).toBe(1);
    });

    it('endWorkoutSafely: handles network exception and falls back to offline action', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
      mockSupabaseQuery.update = vi.fn().mockImplementation(() => {
        throw new Error('Network failure');
      });

      const res = await endWorkoutSafely('real-session-id', 'user-123');
      expect(res.isOffline).toBe(true);
      
      const offlineSessions = await indexedDbService.getAllOfflineSessions();
      expect(offlineSessions.length).toBe(1);
      expect(offlineSessions[0].id).toBe('real-session-id');
      expect(offlineSessions[0].is_new).toBe(false);
    });

    it('saveLogSafely: saves offline if the session is offline (is_new === true)', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
      
      await indexedDbService.addOfflineSession({
        id: 'temp-session-id',
        user_id: 'u-1',
        start_time: new Date().toISOString(),
        end_time: null,
        is_new: true,
      });

      const res = await saveLogSafely({
        user_id: 'u-1',
        exercise_id: 'ex-1',
        session_id: 'temp-session-id',
        weight: 50,
        reps: 10,
      });

      expect(res.isOffline).toBe(true);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });
});
