import '@testing-library/jest-dom';

import { vi } from 'vitest';

process.env['VITE_SUPABASE_URL'] = 'http://localhost';
process.env['VITE_SUPABASE_ANON_KEY'] = 'mock';

// Mock per navigator.vibrate
if (typeof navigator !== 'undefined') {
  navigator.vibrate = vi.fn();
}

// Mock per AudioContext
class AudioContextMock {
  createOscillator = vi.fn(() => ({
    type: '',
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }));
  createGain = vi.fn(() => ({
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  }));
  createBiquadFilter = vi.fn(() => ({
    type: '',
    frequency: { setValueAtTime: vi.fn() },
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
