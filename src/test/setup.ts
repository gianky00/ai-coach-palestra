import '@testing-library/jest-dom';

import { vi } from 'vitest';

// Mock per navigator.vibrate
if (typeof navigator !== 'undefined') {
  navigator.vibrate = vi.fn();
}

// Mock per AudioContext
class AudioContextMock {
  createOscillator = vi.fn(() => ({
    type: '',
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }));
  createGain = vi.fn(() => ({
    gain: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
  }));
  destination = {};
  currentTime = 0;
}

Object.defineProperty(window, 'AudioContext', {
  value: AudioContextMock,
  writable: true,
  configurable: true,
});

Object.defineProperty(window, 'webkitAudioContext', {
  value: AudioContextMock,
  writable: true,
  configurable: true,
});
