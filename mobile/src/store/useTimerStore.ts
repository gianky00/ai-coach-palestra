import { create } from 'zustand';

import { notificationService } from '../services/notificationService';

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

  startTimer: (seconds) => {
    void notificationService.scheduleTimerEnd(seconds);
    set({
      isActive: true,
      timeLeft: seconds,
      initialTime: seconds,
      targetTime: Date.now() + seconds * 1000,
    });
  },

  stopTimer: () => {
    void notificationService.cancelTimerEnd();
    set({ isActive: false, timeLeft: 0, targetTime: null });
  },

  tick: () => {
    const state = get();
    if (!state.isActive || !state.targetTime) return;

    const now = Date.now();
    const remainingMs = state.targetTime - now;

    if (remainingMs <= 0) {
      void notificationService.cancelTimerEnd();
      set({ isActive: false, timeLeft: 0, targetTime: null });
    } else {
      const timeLeft = Math.ceil(remainingMs / 1000);
      if (timeLeft !== state.timeLeft) {
        set({ timeLeft });
      }
    }
  },

  adjustTime: (seconds) => {
    const state = get();
    if (!state.isActive || !state.targetTime) return;

    const newTarget = state.targetTime + seconds * 1000;
    const remainingMs = newTarget - Date.now();

    if (remainingMs <= 0) {
      void notificationService.cancelTimerEnd();
      set({ isActive: false, timeLeft: 0, targetTime: null });
    } else {
      const secs = Math.ceil(remainingMs / 1000);
      void notificationService.scheduleTimerEnd(secs);
      set({ targetTime: newTarget, timeLeft: secs });
    }
  },
}));
