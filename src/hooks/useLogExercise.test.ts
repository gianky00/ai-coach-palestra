/* eslint-disable @typescript-eslint/no-explicit-any */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { removeOfflineLog, saveLogSafely } from '../lib/offlineSync';
import { logService } from '../services/logService';
import { soundService } from '../services/soundService';
import { useLogExercise } from './useLogExercise';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock soundService
vi.mock('../services/soundService', () => ({
  soundService: {
    playClick: vi.fn(),
    playSuccess: vi.fn(),
  },
}));

// Mock exerciseAssets
vi.mock('../lib/exerciseAssets', () => ({
  getExerciseAsset: vi.fn(() => 'exercise-img-url'),
  getMuscleGroupFallback: vi.fn(() => 'fallback-img-url'),
}));

// Mock offlineSync
vi.mock('../lib/offlineSync', () => ({
  getOfflineLogsForExercise: vi.fn(async () => []),
  removeOfflineLog: vi.fn(async () => {}),
  saveLogSafely: vi.fn(async () => ({ error: null, isOffline: false })),
}));

// Mock logService
vi.mock('../services/logService', () => ({
  logService: {
    fetchTodayLogsForExercise: vi.fn(async () => ({ data: [], error: null })),
    fetchPersonalRecord: vi.fn(async () => ({ data: null, error: null })),
    fetchLastSessionLog: vi.fn(async () => ({ data: null, error: null })),
    deleteLog: vi.fn(async () => ({ error: null })),
  },
}));

describe('useLogExercise Hook', () => {
  const mockUser = { id: 'user-123' };
  const mockSelectedEx = {
    id: 'ex-1',
    name: 'Panca Piana',
    muscle_group: 'Petto',
    target_reps: '10',
    target_sets: 3,
    training_day: 'Lunedi',
    rest_time: 90,
  };
  const mockActiveSession = 'session-123';
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and load initial data correctly', async () => {
    const mockTodayLogs = [
      { id: 'log-1', weight: 80, reps: 10, rpe: 8, set_type: 'S', exercise_id: 'ex-1' },
    ];
    const mockPR = { weight: 90, reps: 8 };
    const mockLastLog = { weight: 75, reps: 10, created_at: '2026-05-20T10:00:00Z' };

    vi.mocked(logService.fetchTodayLogsForExercise).mockResolvedValue({
      data: mockTodayLogs,
      error: null,
    } as any);
    vi.mocked(logService.fetchPersonalRecord).mockResolvedValue({
      data: mockPR,
      error: null,
    } as any);
    vi.mocked(logService.fetchLastSessionLog).mockResolvedValue({
      data: mockLastLog,
      error: null,
    } as any);

    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() =>
        useLogExercise({
          user: mockUser,
          selectedEx: mockSelectedEx,
          activeSession: mockActiveSession,
          onSuccess: mockOnSuccess,
        }),
      );
    });

    const { result } = renderResult;

    expect(logService.fetchTodayLogsForExercise).toHaveBeenCalledWith('ex-1');
    expect(logService.fetchPersonalRecord).toHaveBeenCalledWith('ex-1');
    expect(logService.fetchLastSessionLog).toHaveBeenCalledWith('ex-1');

    expect(result.current.currentExLogs).toEqual(mockTodayLogs);
    expect(result.current.personalRecord).toEqual(mockPR);
    expect(result.current.lastSessionLog).toEqual(mockLastLog);
    // Deve impostare il peso basato sull'ultimo set di oggi
    expect(result.current.weight).toBe('80');
    expect(result.current.reps).toBe('10');
  });

  it('should fallback to last log if no logs are registered today', async () => {
    vi.mocked(logService.fetchTodayLogsForExercise).mockResolvedValue({
      data: [],
      error: null,
    } as any);
    const mockLastLog = { weight: 75, reps: 10, created_at: '2026-05-20T10:00:00Z' };
    vi.mocked(logService.fetchLastSessionLog).mockResolvedValue({
      data: mockLastLog,
      error: null,
    } as any);

    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() =>
        useLogExercise({
          user: mockUser,
          selectedEx: mockSelectedEx,
          activeSession: mockActiveSession,
          onSuccess: mockOnSuccess,
        }),
      );
    });

    const { result } = renderResult;
    expect(result.current.weight).toBe('75');
    expect(result.current.reps).toBe('10');
  });

  it('should fallback to PR if no logs are registered today and no last session log exists', async () => {
    vi.mocked(logService.fetchTodayLogsForExercise).mockResolvedValue({
      data: [],
      error: null,
    } as any);
    vi.mocked(logService.fetchLastSessionLog).mockResolvedValue({
      data: null,
      error: null,
    } as any);
    const mockPR = { weight: 90, reps: 8 };
    vi.mocked(logService.fetchPersonalRecord).mockResolvedValue({
      data: mockPR,
      error: null,
    } as any);

    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() =>
        useLogExercise({
          user: mockUser,
          selectedEx: mockSelectedEx,
          activeSession: mockActiveSession,
          onSuccess: mockOnSuccess,
        }),
      );
    });

    const { result } = renderResult;
    expect(result.current.weight).toBe('90');
    expect(result.current.reps).toBe('8');
  });

  it('should handle save log validation for invalid weight and reps', async () => {
    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() =>
        useLogExercise({
          user: mockUser,
          selectedEx: mockSelectedEx,
          activeSession: mockActiveSession,
          onSuccess: mockOnSuccess,
        }),
      );
    });

    const { result } = renderResult;

    // Peso vuoto/non valido
    act(() => {
      result.current.setWeight('');
    });
    await act(async () => {
      await result.current.handleSaveLog();
    });
    expect(saveLogSafely).not.toHaveBeenCalled();

    // Ripetizioni non valide
    act(() => {
      result.current.setWeight('80');
      result.current.setReps('0');
    });
    await act(async () => {
      await result.current.handleSaveLog();
    });
    expect(saveLogSafely).not.toHaveBeenCalled();
  });

  it('should save log safely and trigger PR celebrations if a new record is hit', async () => {
    const mockPR = { weight: 80, reps: 8 };
    vi.mocked(logService.fetchPersonalRecord).mockResolvedValue({
      data: mockPR,
      error: null,
    } as any);
    vi.mocked(saveLogSafely).mockResolvedValue({
      error: null,
      isOffline: false,
      data: { id: 'new-log-123' },
    } as any);

    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() =>
        useLogExercise({
          user: mockUser,
          selectedEx: mockSelectedEx,
          activeSession: mockActiveSession,
          onSuccess: mockOnSuccess,
        }),
      );
    });

    const { result } = renderResult;

    // Nuovo record: peso maggiore
    act(() => {
      result.current.setWeight('85');
      result.current.setReps('8');
      result.current.setRpe('9');
    });

    await act(async () => {
      await result.current.handleSaveLog();
    });

    expect(saveLogSafely).toHaveBeenCalledWith({
      user_id: 'user-123',
      exercise_id: 'ex-1',
      session_id: 'session-123',
      weight: 85,
      reps: 8,
      rpe: 9,
      set_type: 'S',
    });

    expect(soundService.playSuccess).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalledWith(90);
  });

  it('should handle deletion of offline logs without prompt', async () => {
    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() =>
        useLogExercise({
          user: mockUser,
          selectedEx: mockSelectedEx,
          activeSession: mockActiveSession,
          onSuccess: mockOnSuccess,
        }),
      );
    });

    const { result } = renderResult;

    // Un id lungo (>20 caratteri) simula un uuid offline
    await act(async () => {
      await result.current.handleDeleteLog('temp-uuid-long-string-identifier-999');
    });

    expect(removeOfflineLog).toHaveBeenCalledWith('temp-uuid-long-string-identifier-999');
    expect(soundService.playClick).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('should delete online logs after user confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() =>
        useLogExercise({
          user: mockUser,
          selectedEx: mockSelectedEx,
          activeSession: mockActiveSession,
          onSuccess: mockOnSuccess,
        }),
      );
    });

    const { result } = renderResult;

    // Id corto per record online
    await act(async () => {
      await result.current.handleDeleteLog('log-online-1');
    });

    expect(window.confirm).toHaveBeenCalled();
    expect(logService.deleteLog).toHaveBeenCalledWith('log-online-1');
    expect(mockOnSuccess).toHaveBeenCalled();
  });
});
