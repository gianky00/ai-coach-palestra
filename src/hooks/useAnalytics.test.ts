import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { analyticsService } from '../services/analyticsService';
import { historyService } from '../services/historyService';
import { profileService } from '../services/profileService';
import { useAnalytics } from './useAnalytics';

// Mock dei servizi
vi.mock('../services/analyticsService');
vi.mock('../services/profileService');
vi.mock('../services/historyService');
vi.mock('../lib/utils', () => ({
  calculateE1RM: (w: number, r: number) => Math.round(w * (1 + r / 30)),
  DAYS: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'],
}));

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load analytics data correctly', async () => {
    const mockLogs = [
      {
        weight: 100,
        reps: 10,
        created_at: '2026-05-20T10:00:00Z',
        exercises: { name: 'Panca Piana', muscle_group: 'Petto' },
      },
      {
        weight: 110,
        reps: 10,
        created_at: '2026-05-21T10:00:00Z',
        exercises: { name: 'Panca Piana', muscle_group: 'Petto' },
      },
    ];

    const mockWeight = [
      { weight: 80, created_at: '2026-05-01T10:00:00Z' },
      { weight: 82, created_at: '2026-05-28T10:00:00Z' },
    ];

    vi.mocked(analyticsService.fetchSessionsCount).mockResolvedValue(10);
    vi.mocked(analyticsService.fetchAllLogsWithExercise).mockResolvedValue(mockLogs);
    vi.mocked(profileService.fetchWeightHistory).mockResolvedValue(mockWeight);
    vi.mocked(historyService.fetchExerciseOptions).mockResolvedValue([
      { id: '1', name: 'Panca Piana' },
    ]);
    vi.mocked(historyService.fetchExerciseProgression).mockResolvedValue(mockLogs);

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.totalSessions).toBe(10);
    // Volume: (100*10) + (110*10) = 2100
    expect(result.current.totalVolume).toBe(2100);
    // PR: Primo log (133 e1RM) + Secondo log (147 e1RM) = 2 PR
    expect(result.current.totalPRs).toBe(2);
    expect(result.current.muscleDistribution).toEqual([{ name: 'Petto', value: 2 }]);
    expect(result.current.bodyWeight).toBe('82');
    expect(result.current.weightDeltaWeekly).toBeDefined();
    expect(result.current.progression).toHaveLength(2);
  });

  it('should calculate weight deltas correctly', async () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const mockWeight = [
      { weight: 85, created_at: oneMonthAgo.toISOString() },
      { weight: 82, created_at: oneWeekAgo.toISOString() },
      { weight: 80, created_at: now.toISOString() },
    ];

    vi.mocked(profileService.fetchWeightHistory).mockResolvedValue(mockWeight);
    vi.mocked(analyticsService.fetchSessionsCount).mockResolvedValue(0);
    vi.mocked(analyticsService.fetchAllLogsWithExercise).mockResolvedValue([]);
    vi.mocked(historyService.fetchExerciseOptions).mockResolvedValue([]);

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.bodyWeight).toBe('80');
    expect(result.current.weightDeltaWeekly).toBe(-2);
    expect(result.current.weightDeltaMonthly).toBe(-5);
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(analyticsService.fetchSessionsCount).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.totalSessions).toBe(0);
    expect(result.current.totalVolume).toBe(0);
  });

  it('should update progression when selectedExId changes', async () => {
    const mockExOptions = [
      { id: '1', name: 'Ex 1' },
      { id: '2', name: 'Ex 2' },
    ];
    vi.mocked(analyticsService.fetchSessionsCount).mockResolvedValue(0);
    vi.mocked(analyticsService.fetchAllLogsWithExercise).mockResolvedValue([]);
    vi.mocked(profileService.fetchWeightHistory).mockResolvedValue([]);
    vi.mocked(historyService.fetchExerciseOptions).mockResolvedValue(mockExOptions);
    vi.mocked(historyService.fetchExerciseProgression).mockResolvedValue([]);

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.setSelectedExId('2');
    });

    await waitFor(() => {
      expect(historyService.fetchExerciseProgression).toHaveBeenCalledWith('Ex 2');
    });
  });
});
