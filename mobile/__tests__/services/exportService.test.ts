import { beforeEach, describe, expect, it, vi } from 'vitest';

const { writeAsStringAsync, isAvailableAsync, shareAsync, alert, fetchSessions } = vi.hoisted(
  () => ({
    writeAsStringAsync: vi.fn(),
    isAvailableAsync: vi.fn(),
    shareAsync: vi.fn(),
    alert: vi.fn(),
    fetchSessions: vi.fn(),
  }),
);

vi.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///cache/',
  EncodingType: { UTF8: 'utf8' },
  writeAsStringAsync,
}));

vi.mock('expo-sharing', () => ({
  isAvailableAsync,
  shareAsync,
}));

vi.mock('react-native', () => ({
  Alert: { alert },
}));

vi.mock('../../src/services/sessionService', () => ({
  sessionService: { fetchSessionsWithStats: fetchSessions },
}));

import { exportService } from '../../src/services/exportService';

describe('exportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    writeAsStringAsync.mockResolvedValue(undefined);
    shareAsync.mockResolvedValue(undefined);
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
    const csv = writeAsStringAsync.mock.calls[0][1] as string;
    expect(csv).toContain('Sessione ID');
    expect(csv).toContain('"Panca, flat"');
    expect(csv).toContain('s2');
    expect(shareAsync).toHaveBeenCalled();
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
