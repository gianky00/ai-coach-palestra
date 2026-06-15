import { create } from 'zustand';

interface TimerState {
  isActive: boolean;
  timeLeft: number;
  initialTime: number;
  targetTime: number | null;

  startTimer: (seconds: number) => void;
  stopTimer: () => void;
  tick: () => void;
  adjustTime: (seconds: number) => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isActive: false,
  timeLeft: 0,
  initialTime: 0,
  targetTime: null,

  startTimer: (seconds) =>
    set({
      isActive: true,
      timeLeft: seconds,
      initialTime: seconds,
      targetTime: Date.now() + seconds * 1000,
    }),
  stopTimer: () => set({ isActive: false, timeLeft: 0, targetTime: null }),
  tick: () => {
    const state = get();
    if (!state.isActive || !state.targetTime) return;

    const now = Date.now();
    const remainingMs = state.targetTime - now;

    if (remainingMs <= 0) {
      set({ isActive: false, timeLeft: 0, targetTime: null });
    } else {
      set({ timeLeft: Math.ceil(remainingMs / 1000) });
    }
  },
  adjustTime: (seconds) => {
    const state = get();
    if (!state.isActive || !state.targetTime) return;

    const newTarget = state.targetTime + seconds * 1000;
    const remainingMs = newTarget - Date.now();

    if (remainingMs <= 0) {
      set({ isActive: false, timeLeft: 0, targetTime: null });
    } else {
      set({ targetTime: newTarget, timeLeft: Math.ceil(remainingMs / 1000) });
    }
  },
}));
