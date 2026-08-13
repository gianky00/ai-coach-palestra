import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  writeAsStringAsync,
  isAvailableAsync,
  shareAsync,
  alert,
  fetchSessions,
  getAllOfflineSessions,
  getAllLogs,
  fetchExercisesByIds,
} = vi.hoisted(() => ({
  writeAsStringAsync: vi.fn(),
  isAvailableAsync: vi.fn(),
  shareAsync: vi.fn(),
  alert: vi.fn(),
  fetchSessions: vi.fn(),
  getAllOfflineSessions: vi.fn(),
  getAllLogs: vi.fn(),
  fetchExercisesByIds: vi.fn(),
}));

vi.mock('../../src/platform/filesystem', () => ({
  cacheDirectory: 'file:///cache/',
  EncodingType: { UTF8: 'utf8' },
  writeAsStringAsync,
}));

vi.mock('../../src/platform/sharing', () => ({
  isAvailableAsync,
  shareAsync,
}));

vi.mock('react-native', () => ({
  Alert: { alert },
}));

vi.mock('../../src/services/sessionService', () => ({
  sessionService: { fetchSessionsWithStats: fetchSessions },
}));

vi.mock('../../src/services/exerciseService', () => ({
  exerciseService: { fetchExercisesByIds },
}));

vi.mock('../../src/lib/sqlite', () => ({
  sqliteService: {
    getAllOfflineSessions,
    getAllLogs,
  },
}));

import { toLocalDateKey } from '../../src/lib/utils';
import { exportService } from '../../src/services/exportService';

describe('exportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    writeAsStringAsync.mockResolvedValue(undefined);
    shareAsync.mockResolvedValue(undefined);
    getAllOfflineSessions.mockResolvedValue([]);
    getAllLogs.mockResolvedValue([]);
    fetchExercisesByIds.mockResolvedValue({ data: [], error: null });
  });

  it('alert se nessuna sessione', async () => {
    fetchSessions.mockResolvedValue([]);
    await exportService.exportSessionsToCsv();
    expect(alert).toHaveBeenCalledWith('Nessun dato', expect.any(String));
    expect(writeAsStringAsync).not.toHaveBeenCalled();
  });

  it('scrive CSV e usa share quando disponibile', async () => {
    isAvailableAsync.mockResolvedValue(true);
    fetchSessions.mockResolvedValue([
      {
        id: 's1',
        start_time: '2026-08-12T10:00:00.000Z',
        end_time: '2026-08-12T11:00:00.000Z',
        training_logs: [
          { weight: 100, reps: 5, exercises: { name: 'Panca, flat', muscle_group: 'Petto' } },
        ],
      },
      {
        id: 's2',
        start_time: '2026-08-11T10:00:00.000Z',
        end_time: null,
        training_logs: [],
      },
    ]);

    await exportService.exportSessionsToCsv();

    expect(writeAsStringAsync).toHaveBeenCalled();
    const uri = writeAsStringAsync.mock.calls[0][0] as string;
    expect(uri).toContain(`kinefit-export-${toLocalDateKey(new Date())}.csv`);
    const csv = writeAsStringAsync.mock.calls[0][1] as string;
    expect(csv).toContain('Sessione ID');
    expect(csv).toContain('"Panca, flat"');
    expect(csv).toContain('s2');
    expect(shareAsync).toHaveBeenCalled();
  });

  it('arricchisce log offline con nome esercizio da catalogo', async () => {
    isAvailableAsync.mockResolvedValue(true);
    fetchSessions.mockResolvedValue([]);
    getAllOfflineSessions.mockResolvedValue([
      {
        id: 'off-1',
        user_id: 'u1',
        start_time: '2026-08-13T18:00:00.000Z',
        end_time: '2026-08-13T19:00:00.000Z',
      },
    ]);
    getAllLogs.mockResolvedValue([
      {
        tempId: 't1',
        user_id: 'u1',
        exercise_id: 'ex-real',
        session_id: 'off-1',
        weight: 90,
        reps: 4,
        rpe: 8,
        set_type: 'S',
        created_at: '2026-08-13T18:10:00.000Z',
      },
    ]);
    fetchExercisesByIds.mockResolvedValue({
      data: [{ id: 'ex-real', name: 'Panca piana', muscle_group: 'Petto' }],
      error: null,
    });

    await exportService.exportSessionsToCsv();

    expect(fetchExercisesByIds).toHaveBeenCalledWith(['ex-real']);
    const csv = writeAsStringAsync.mock.calls[0][1] as string;
    expect(csv).toContain('Panca piana');
    expect(csv).toContain('Petto');
    expect(csv).not.toContain('N/A');
  });

  it('usa smoke catalog quando lookup esercizi fallisce', async () => {
    isAvailableAsync.mockResolvedValue(true);
    fetchSessions.mockResolvedValue([]);
    getAllOfflineSessions.mockResolvedValue([
      {
        id: 'off-smoke',
        user_id: 'smoke-user',
        start_time: '2026-08-13T18:00:00.000Z',
        end_time: '2026-08-13T19:00:00.000Z',
      },
    ]);
    getAllLogs.mockResolvedValue([
      {
        tempId: 't1',
        user_id: 'smoke-user',
        exercise_id: 'smoke-seed-ex-bench',
        session_id: 'off-smoke',
        weight: 100,
        reps: 5,
        rpe: 7,
        set_type: 'S',
        created_at: '2026-08-13T18:10:00.000Z',
      },
    ]);
    fetchExercisesByIds.mockRejectedValue(new Error('offline'));

    await exportService.exportSessionsToCsv();

    const csv = writeAsStringAsync.mock.calls[0][1] as string;
    expect(csv).toContain('Smoke Bench');
    expect(csv).toContain('Petto');
  });

  it('alert path quando share non disponibile', async () => {
    isAvailableAsync.mockResolvedValue(false);
    fetchSessions.mockResolvedValue([
      {
        id: 's1',
        start_time: '2026-08-12T10:00:00.000Z',
        end_time: null,
        training_logs: [{ weight: 50, reps: 10, exercises: null }],
      },
    ]);

    await exportService.exportSessionsToCsv();
    expect(alert).toHaveBeenCalledWith(
      'Export completato',
      expect.stringContaining('kinefit-export'),
    );
  });
});
