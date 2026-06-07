import { create } from 'zustand';

interface TimerState {
  isActive: boolean;
  timeLeft: number;
  initialTime: number;

  startTimer: (seconds: number) => void;
  stopTimer: () => void;
  tick: () => void;
  adjustTime: (seconds: number) => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isActive: false,
  timeLeft: 0,
  initialTime: 0,

  startTimer: (seconds) => set({ isActive: true, timeLeft: seconds, initialTime: seconds }),
  stopTimer: () => set({ isActive: false, timeLeft: 0 }),
  tick: () => {
    const current = get().timeLeft;
    if (current <= 1) {
      set({ isActive: false, timeLeft: 0 });
    } else {
      set({ timeLeft: current - 1 });
    }
  },
  adjustTime: (seconds) => {
    const current = get().timeLeft;
    const next = Math.max(0, current + seconds);
    set({ timeLeft: next, isActive: next > 0 });
  },
}));
