import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '../components';
import * as offlineSync from '../lib/offlineSync';
import { useStore } from '../store/useStore';
import { useWorkoutData } from './useWorkoutData';

// Mock dependencies
vi.mock('@tanstack/react-query');
vi.mock('../components', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../store/useStore');
vi.mock('../lib/offlineSync');
vi.mock('react-hot-toast');

describe('useWorkoutData', () => {
  const mockUser = { id: 'user-123' };
  const mockQueryClient = {
    invalidateQueries: vi.fn(),
  };

  const mockStore = {
    setActiveSession: vi.fn(),
    setOfflineQueueCount: vi.fn(),
    setShowSummary: vi.fn(),
    setLastWorkoutSummary: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
    vi.mocked(useQueryClient).mockReturnValue(mockQueryClient as any);
    vi.mocked(useStore).mockReturnValue(mockStore as any);

    // Default mock for queries
    vi.mocked(useQuery).mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'exercises')
        return { data: [], isLoading: false, refetch: vi.fn() } as any;
      if (queryKey[0] === 'logs') return { data: [], isLoading: false, refetch: vi.fn() } as any;
      if (queryKey[0] === 'session')
        return { data: null, isLoading: false, refetch: vi.fn() } as any;
      return { data: undefined } as any;
    });

    vi.mocked(useMutation).mockReturnValue({ mutate: vi.fn() } as any);
    vi.mocked(offlineSync.getOfflineQueueCount).mockResolvedValue(0);
  });

  it('calculates total volume and processed exercises correctly', async () => {
    const mockExercises = [
      { id: 'ex1', name: 'Bench', target_sets: 3 },
      { id: 'ex2', name: 'Squat', target_sets: 2 },
    ];
    const mockLogs = [
      { exercise_id: 'ex1', weight: 100, reps: 10 }, // 1000
      { exercise_id: 'ex1', weight: 100, reps: 10 }, // 1000
      { exercise_id: 'ex1', weight: 100, reps: 10 }, // 1000 -> ex1 completed
      { exercise_id: 'ex2', weight: 150, reps: 5 }, // 750
    ];

    vi.mocked(useQuery).mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'exercises')
        return { data: mockExercises, isLoading: false, refetch: vi.fn() } as any;
      if (queryKey[0] === 'logs')
        return { data: mockLogs, isLoading: false, refetch: vi.fn() } as any;
      if (queryKey[0] === 'session') return { data: { id: 's1' }, isLoading: false } as any;
      return {} as any;
    });

    const { result } = renderHook(() => useWorkoutData());

    expect(result.current.totalVolume).toBe(3750);
    expect(result.current.exercises[0].sets_done).toBe(3);
    expect(result.current.exercises[0].completed).toBe(true);
    expect(result.current.exercises[1].sets_done).toBe(1);
    expect(result.current.exercises[1].completed).toBe(false);

    // Progresso: 1 completed out of 2 = 50%
    expect(result.current.progresso).toBe(50);
    // setProgress: 4 logs / 5 target sets = 80%
    expect(result.current.setProgress).toBe(80);
  });

  it('handles startWorkout interaction', () => {
    const mutateSpy = vi.fn();
    vi.mocked(useMutation).mockImplementation(() => {
      // Simulo che il primo useMutation nel file sia quello per startWorkout
      // In realtà dovremmo essere più precisi se ce ne sono molti
      return { mutate: mutateSpy } as any;
    });

    const { result } = renderHook(() => useWorkoutData());
    result.current.startWorkout();
    expect(mutateSpy).toHaveBeenCalled();
  });

  it('handles endWorkout with confirmation', () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    const mutateSpy = vi.fn();

    // Mock the second useMutation call (endWorkout)
    let callCount = 0;
    vi.mocked(useMutation).mockImplementation(() => {
      callCount++;
      if (callCount === 2) return { mutate: mutateSpy } as any;
      return { mutate: vi.fn() } as any;
    });

    vi.mocked(useQuery).mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'session') return { data: { id: 's1' } } as any;
      return { data: [] } as any;
    });

    const { result } = renderHook(() => useWorkoutData());
    result.current.endWorkout();

    expect(window.confirm).toHaveBeenCalled();
    expect(mutateSpy).toHaveBeenCalledWith('s1');
  });

  it('monitors offline queue and triggers sync', async () => {
    vi.mocked(offlineSync.getOfflineQueueCount).mockResolvedValueOnce(5).mockResolvedValue(0);
    vi.stubGlobal('navigator', { onLine: true });

    renderHook(() => useWorkoutData());

    await waitFor(() => {
      expect(offlineSync.syncOfflineLogs).toHaveBeenCalled();
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['logs'] });
    });
  });
});
