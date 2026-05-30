import { beforeEach, describe, expect, it, vi } from 'vitest';

import { soundService } from './soundService';

describe('soundService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    soundService.ctx = null;
  });

  const setupMockAudioContext = () => {
    const mockSetValueAtTime = vi.fn();
    const mockExponentialRamp = vi.fn();
    const mockLinearRamp = vi.fn();
    const mockConnect = vi.fn();
    const mockStart = vi.fn();
    const mockStop = vi.fn();
    const mockResume = vi.fn();

    const mockOscillator = {
      type: '',
      frequency: {
        setValueAtTime: mockSetValueAtTime,
        exponentialRampToValueAtTime: mockExponentialRamp,
      },
      connect: mockConnect,
      start: mockStart,
      stop: mockStop,
    };

    const mockGain = {
      gain: {
        setValueAtTime: mockSetValueAtTime,
        exponentialRampToValueAtTime: mockExponentialRamp,
        linearRampToValueAtTime: mockLinearRamp,
      },
      connect: mockConnect,
    };

    const mockFilter = {
      type: '',
      frequency: { setValueAtTime: mockSetValueAtTime },
      connect: mockConnect,
    };

    const MockAudioContext = vi.fn().mockImplementation(() => ({
      currentTime: 100,
      state: 'running',
      resume: mockResume,
      createOscillator: vi.fn().mockReturnValue(mockOscillator),
      createGain: vi.fn().mockReturnValue(mockGain),
      createBiquadFilter: vi.fn().mockReturnValue(mockFilter),
      destination: {},
    }));

    window.AudioContext = MockAudioContext as any;

    return {
      MockAudioContext,
      mockOscillator,
      mockGain,
      mockFilter,
      mockResume,
    };
  };

  it('should initialize and play click sound', () => {
    const { MockAudioContext, mockOscillator } = setupMockAudioContext();

    soundService.playClick();

    expect(MockAudioContext).toHaveBeenCalledTimes(1);
    expect(mockOscillator.type).toBe('sine');
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  it('should initialize and play success sound', () => {
    const { MockAudioContext, mockOscillator } = setupMockAudioContext();

    soundService.playSuccess();

    expect(MockAudioContext).toHaveBeenCalledTimes(1);
    expect(mockOscillator.type).toBe('triangle');
    // 5 notes are played
    expect(mockOscillator.start).toHaveBeenCalledTimes(5);
  });

  it('should initialize and play timer complete sound', () => {
    const { MockAudioContext, mockOscillator } = setupMockAudioContext();

    soundService.playTimerComplete();

    expect(MockAudioContext).toHaveBeenCalledTimes(1);
    expect(mockOscillator.type).toBe('sine');
    // 2 beeps
    expect(mockOscillator.start).toHaveBeenCalledTimes(2);
  });

  it('should resume context if suspended', () => {
    const { MockAudioContext, mockResume } = setupMockAudioContext();
    // Override state to suspended
    window.AudioContext = vi.fn().mockImplementation(() => {
      const ctx = new MockAudioContext();
      ctx.state = 'suspended';
      return ctx;
    }) as any;

    soundService.playClick();
    expect(mockResume).toHaveBeenCalled();
  });

  it('should handle errors gracefully', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-ignore
    delete window.AudioContext;
    // @ts-ignore
    delete window.webkitAudioContext;

    soundService.playClick();
    soundService.playSuccess();
    soundService.playTimerComplete();

    expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
    consoleWarnSpy.mockRestore();
  });
});
