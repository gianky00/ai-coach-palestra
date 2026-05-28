import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { analyticsService } from '../services/analyticsService';
import { historyService } from '../services/historyService';
import { profileService } from '../services/profileService';
import { useAnalytics } from './useAnalytics';

vi.mock('../services/analyticsService', () => ({
  analyticsService: {
    fetchSessionsCount: vi.fn(),
    fetchAllLogsWithExercise: vi.fn(),
  },
}));

vi.mock('../services/profileService', () => ({
  profileService: {
    fetchWeightHistory: vi.fn(),
  },
}));

vi.mock('../services/historyService', () => ({
  historyService: {
    fetchExerciseOptions: vi.fn(),
    fetchExerciseProgression: vi.fn(),
  },
}));

describe('useAnalytics Hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize and load analytics data successfully', async () => {
    vi.mocked(analyticsService.fetchSessionsCount).mockResolvedValue(5);
    vi.mocked(analyticsService.fetchAllLogsWithExercise).mockResolvedValue([
      {
        weight: 80,
        reps: 8,
        created_at: '2026-05-20T10:00:00Z',
        exercises: { name: 'Panca Piana', muscle_group: 'Petto' },
      },
      {
        weight: 90,
        reps: 5,
        created_at: '2026-05-21T10:00:00Z',
        exercises: { name: 'Panca Piana', muscle_group: 'Petto' },
      },
    ]);
    vi.mocked(profileService.fetchWeightHistory).mockResolvedValue([
      { weight: 75, created_at: '2026-05-15T10:00:00Z' },
      { weight: 76, created_at: '2026-05-22T10:00:00Z' },
    ]);
    vi.mocked(historyService.fetchExerciseOptions).mockResolvedValue([
      { id: 'ex-1', name: 'Panca Piana' },
    ]);

    const { result } = renderHook(() => useAnalytics());

    // Aspetta che il caricamento finisca
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.totalSessions).toBe(5);
    expect(result.current.totalVolume).toBe(80 * 8 + 90 * 5); // 1090
    expect(result.current.totalPRs).toBe(2);
    expect(result.current.bodyWeight).toBe('76');
    expect(result.current.muscleDistribution).toEqual([{ name: 'Petto', value: 2 }]);
  });
});
