import { beforeEach, describe, expect, it } from 'vitest';

import { useStore } from './useStore';

describe('Zustand Global Store', () => {
  beforeEach(() => {
    useStore.setState({
      activeSession: null,
      offlineQueueCount: 0,
      showSummary: false,
      lastWorkoutSummary: null,
    });
  });

  it('should set active session correctly', () => {
    useStore.getState().setActiveSession('session-123');
    expect(useStore.getState().activeSession).toBe('session-123');
  });

  it('should set offline queue count correctly', () => {
    useStore.getState().setOfflineQueueCount(5);
    expect(useStore.getState().offlineQueueCount).toBe(5);
  });

  it('should toggle summary modal visibility', () => {
    useStore.getState().setShowSummary(true);
    expect(useStore.getState().showSummary).toBe(true);
  });

  it('should store last workout summary correctly', () => {
    const summary = {
      totalVolume: 5000,
      setsDone: 12,
      durationMins: 45,
      prsCount: 2,
    };
    useStore.getState().setLastWorkoutSummary(summary);
    expect(useStore.getState().lastWorkoutSummary).toEqual(summary);
  });
});
