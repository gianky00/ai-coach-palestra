import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WorkoutSummary {
  totalVolume: number;
  setsDone: number;
  durationMins: number;
  prsCount: number;
}

interface AppState {
  activeSession: string | null;
  setActiveSession: (id: string | null) => void;

  // Sync
  offlineQueueCount: number;
  setOfflineQueueCount: (count: number) => void;

  // Summary
  showSummary: boolean;
  setShowSummary: (show: boolean) => void;
  lastWorkoutSummary: WorkoutSummary | null;
  setLastWorkoutSummary: (summary: WorkoutSummary | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      activeSession: null,
      setActiveSession: (id) => set({ activeSession: id }),

      offlineQueueCount: 0,
      setOfflineQueueCount: (count) => set({ offlineQueueCount: count }),

      showSummary: false,
      setShowSummary: (show) => set({ showSummary: show }),
      lastWorkoutSummary: null,
      setLastWorkoutSummary: (summary) => set({ lastWorkoutSummary: summary }),
    }),
    {
      name: 'kinefit-storage',
      partialize: (state) => ({
        activeSession: state.activeSession,
        lastWorkoutSummary: state.lastWorkoutSummary,
      }),
    },
  ),
);
