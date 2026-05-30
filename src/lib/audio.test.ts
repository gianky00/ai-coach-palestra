import { beforeEach, describe, expect, it, vi } from 'vitest';

import { playTimerEndSound } from './audio';

describe('audio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should play sound using AudioContext', () => {
    const mockSetValueAtTime = vi.fn();
    const mockConnect = vi.fn();
    const mockStart = vi.fn();
    const mockStop = vi.fn();

    const mockOscillator = {
      type: '',
      frequency: { setValueAtTime: mockSetValueAtTime },
      connect: mockConnect,
      start: mockStart,
      stop: mockStop,
    };

    const mockGain = {
      gain: { setValueAtTime: mockSetValueAtTime },
      connect: mockConnect,
    };

    const MockAudioContext = vi.fn().mockImplementation(() => ({
      currentTime: 100,
      createOscillator: vi.fn().mockReturnValue(mockOscillator),
      createGain: vi.fn().mockReturnValue(mockGain),
      destination: {},
    }));

    window.AudioContext = MockAudioContext as any;

    playTimerEndSound();

    expect(MockAudioContext).toHaveBeenCalledTimes(1);
    expect(mockOscillator.type).toBe('sine');
    expect(mockSetValueAtTime).toHaveBeenCalledWith(880, 100);
    expect(mockSetValueAtTime).toHaveBeenCalledWith(0.1, 100);
    expect(mockConnect).toHaveBeenCalledTimes(2);
    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(mockStop).toHaveBeenCalledWith(100.5);
  });

  it('should fallback to webkitAudioContext if AudioContext is not available', () => {
    const mockSetValueAtTime = vi.fn();
    const mockConnect = vi.fn();
    const mockStart = vi.fn();
    const mockStop = vi.fn();

    const mockOscillator = {
      type: '',
      frequency: { setValueAtTime: mockSetValueAtTime },
      connect: mockConnect,
      start: mockStart,
      stop: mockStop,
    };

    const mockGain = {
      gain: { setValueAtTime: mockSetValueAtTime },
      connect: mockConnect,
    };

    const MockAudioContext = vi.fn().mockImplementation(() => ({
      currentTime: 100,
      createOscillator: vi.fn().mockReturnValue(mockOscillator),
      createGain: vi.fn().mockReturnValue(mockGain),
      destination: {},
    }));

    // @ts-ignore
    delete window.AudioContext;
    (window as any).webkitAudioContext = MockAudioContext;

    playTimerEndSound();

    expect(MockAudioContext).toHaveBeenCalledTimes(1);
  });

  it('should catch and log errors', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // @ts-ignore
    delete window.AudioContext;
    // @ts-ignore
    delete window.webkitAudioContext;

    playTimerEndSound();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Audio error', expect.any(Error));
  });
});
