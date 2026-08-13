import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SyncFeedback } from '../lib/syncFeedback';
import { WorkoutSummary } from '../types';

interface AppState {
  activeSession: string | null;
  offlineQueueCount: number;
  /** Last partial/failed sync feedback for Oggi/Profile banners (not persisted). */
  lastSyncFeedback: SyncFeedback | null;
  showSummary: boolean;
  lastWorkoutSummary: WorkoutSummary | null;
  sessionPrCount: number;
  hapticsEnabled: boolean;
  timerAutoStart: boolean;
  notificationsEnabled: boolean;
  timerSoundEnabled: boolean;

  setActiveSession: (id: string | null) => void;
  setOfflineQueueCount: (count: number) => void;
  setLastSyncFeedback: (feedback: SyncFeedback | null) => void;
  setShowSummary: (show: boolean) => void;
  setLastWorkoutSummary: (summary: WorkoutSummary | null) => void;
  incrementSessionPrCount: () => void;
  resetSessionPrCount: () => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setTimerAutoStart: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setTimerSoundEnabled: (enabled: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      activeSession: null,
      offlineQueueCount: 0,
      lastSyncFeedback: null,
      showSummary: false,
      lastWorkoutSummary: null,
      sessionPrCount: 0,
      hapticsEnabled: true,
      timerAutoStart: true,
      notificationsEnabled: true,
      timerSoundEnabled: true,

      setActiveSession: (id) => set({ activeSession: id }),
      setOfflineQueueCount: (count) => set({ offlineQueueCount: count }),
      setLastSyncFeedback: (feedback) => set({ lastSyncFeedback: feedback }),
      setShowSummary: (show) => set({ showSummary: show }),
      setLastWorkoutSummary: (summary) => set({ lastWorkoutSummary: summary }),
      incrementSessionPrCount: () => set((s) => ({ sessionPrCount: s.sessionPrCount + 1 })),
      resetSessionPrCount: () => set({ sessionPrCount: 0 }),
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
      setTimerAutoStart: (enabled) => set({ timerAutoStart: enabled }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setTimerSoundEnabled: (enabled) => set({ timerSoundEnabled: enabled }),
    }),
    {
      name: 'kinefit-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeSession: state.activeSession,
        lastWorkoutSummary: state.lastWorkoutSummary,
        hapticsEnabled: state.hapticsEnabled,
        timerAutoStart: state.timerAutoStart,
        notificationsEnabled: state.notificationsEnabled,
        timerSoundEnabled: state.timerSoundEnabled,
      }),
    },
  ),
);
