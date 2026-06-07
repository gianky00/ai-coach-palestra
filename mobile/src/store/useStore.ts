import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { WorkoutSummary } from '../types';

interface AppState {
  activeSession: string | null;
  offlineQueueCount: number;
  showSummary: boolean;
  lastWorkoutSummary: WorkoutSummary | null;

  setActiveSession: (id: string | null) => void;
  setOfflineQueueCount: (count: number) => void;
  setShowSummary: (show: boolean) => void;
  setLastWorkoutSummary: (summary: WorkoutSummary | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      activeSession: null,
      offlineQueueCount: 0,
      showSummary: false,
      lastWorkoutSummary: null,

      setActiveSession: (id) => set({ activeSession: id }),
      setOfflineQueueCount: (count) => set({ offlineQueueCount: count }),
      setShowSummary: (show) => set({ showSummary: show }),
      setLastWorkoutSummary: (summary) => set({ lastWorkoutSummary: summary }),
    }),
    {
      name: 'kinefit-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeSession: state.activeSession,
        lastWorkoutSummary: state.lastWorkoutSummary,
      }),
    },
  ),
);
