import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTimer } from './useTimer';

describe('useTimer Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with provided value', () => {
    const { result } = renderHook(() => useTimer(90));
    expect(result.current.timer).toBe(90);
    expect(result.current.timerActive).toBe(false);
  });

  it('should start the timer correctly', () => {
    const { result } = renderHook(() => useTimer(0));
    act(() => {
      result.current.startTimer(60);
    });
    expect(result.current.timer).toBe(60);
    expect(result.current.timerActive).toBe(true);
  });

  it('should decrement every second', () => {
    const { result } = renderHook(() => useTimer(10));
    act(() => {
      result.current.setTimerActive(true);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.timer).toBe(9);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.timer).toBe(7);
  });

  it('should stop when reaching zero', () => {
    const { result } = renderHook(() => useTimer(2));
    act(() => {
      result.current.setTimerActive(true);
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.timer).toBe(0);
    expect(result.current.timerActive).toBe(false);
  });

  it('should reset the timer', () => {
    const { result } = renderHook(() => useTimer(60));
    act(() => {
      result.current.startTimer(60);
    });
    act(() => {
      result.current.resetTimer(30);
    });
    expect(result.current.timer).toBe(30);
    expect(result.current.timerActive).toBe(false);
  });
});
