import { addEventListener, fetch as fetchNetInfo } from '@react-native-community/netinfo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { useAuth } from '../hooks/useAuth';
import { endWorkoutSafely, startWorkoutSafely, syncOfflineLogs } from '../lib/offlineSync';
import { useSmokeMode } from '../lib/SmokeContext';
import { isSmokeDataMode, SMOKE_USER_ID } from '../lib/smokeMode';
import { isSmokeFixtureId, loadSmokeSeedExercises } from '../lib/smokeSeed';
import { sqliteService } from '../lib/sqlite';
import { isSyncFailureFeedback, mapSyncFeedback } from '../lib/syncFeedback';
import { DAYS, getDateForSelectedDay, mergeLogsWithoutDuplicates } from '../lib/utils';
import { exerciseService } from '../services/exerciseService';
import { logService } from '../services/logService';
import { profileService } from '../services/profileService';
import { sessionService } from '../services/sessionService';
import { useStore } from '../store/useStore';

const isLikelyOnline = (state: {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}) => state.isConnected !== false && state.isInternetReachable !== false;

export const useWorkoutData = (selectedDay?: string) => {
  const { user } = useAuth();
  const smokeMode = useSmokeMode();
  const smokeData = isSmokeDataMode(smokeMode);
  const queryClient = useQueryClient();
  const setActiveSession = useStore((s) => s.setActiveSession);
  const setOfflineQueueCount = useStore((s) => s.setOfflineQueueCount);
  const setLastSyncFeedback = useStore((s) => s.setLastSyncFeedback);
  const setShowSummary = useStore((s) => s.setShowSummary);
  const setLastWorkoutSummary = useStore((s) => s.setLastWorkoutSummary);
  const globalActiveSession = useStore((s) => s.activeSession);
  const sessionPrCount = useStore((s) => s.sessionPrCount);
  const resetSessionPrCount = useStore((s) => s.resetSessionPrCount);

  const currentDay = selectedDay || DAYS[new Date().getDay()];

  useEffect(() => {
    const checkQueue = async () => {
      try {
        const count = await sqliteService.getQueueCount();
        setOfflineQueueCount(count);

        const state = await fetchNetInfo();
        if (isLikelyOnline(state) && count > 0) {
          const result = await syncOfflineLogs();
          const updatedCount = await sqliteService.getQueueCount();
          setOfflineQueueCount(updatedCount);
          const feedback = mapSyncFeedback({
            synced: result.synced,
            failed: result.failed,
            remaining: updatedCount,
          });
          if (isSyncFailureFeedback(feedback)) {
            setLastSyncFeedback(feedback);
          } else if (result.synced > 0 || updatedCount === 0) {
            setLastSyncFeedback(null);
          }
          queryClient.invalidateQueries({ queryKey: ['logs'] });
          queryClient.invalidateQueries({ queryKey: ['exercises'] });
        }
      } catch (err) {
        console.warn('[Sync] checkQueue failed', err);
      }
    };

    void checkQueue();

    const unsubscribe = addEventListener((state) => {
      if (isLikelyOnline(state)) void checkQueue();
    });

    const interval = setInterval(() => void checkQueue(), 10000);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [setOfflineQueueCount, setLastSyncFeedback, queryClient]);

  const {
    data: exercises = [],
    isLoading: loadingEx,
    refetch: refetchEx,
  } = useQuery({
    queryKey: ['exercises', user?.id, currentDay, smokeData],
    queryFn: async () => {
      if (!user) {
        const seeded = await loadSmokeSeedExercises();
        const day = currentDay.toUpperCase();
        return seeded.filter((e) => (e.training_day || '').toUpperCase() === day);
      }
      const { data } = await exerciseService.fetchExercisesByDay(user.id, currentDay);
      return data || [];
    },
    enabled: !!user || smokeData,
  });

  const {
    data: logs = [],
    isLoading: loadingLogs,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ['logs', user?.id, currentDay, smokeData],
    queryFn: async () => {
      const targetDate = getDateForSelectedDay(currentDay);
      const offlineLogs = await sqliteService.getAllLogs();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const startOfDayIso = startOfDay.toISOString();
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      const endOfDayIso = endOfDay.toISOString();
      const targetOffline = offlineLogs.filter((l) => {
        if (l.created_at < startOfDayIso || l.created_at > endOfDayIso) return false;
        if (!user) {
          return (
            l.user_id === SMOKE_USER_ID ||
            isSmokeFixtureId(l.tempId) ||
            isSmokeFixtureId(l.id) ||
            isSmokeFixtureId(l.session_id)
          );
        }
        return l.user_id === user.id;
      });
      if (!user) return targetOffline;
      const { data } = await logService.fetchTotalLogsByDate(targetDate);
      return mergeLogsWithoutDuplicates(data || [], targetOffline);
    },
    enabled: !!user || smokeData,
  });

  const { data: activeSessionData } = useQuery({
    queryKey: ['session', 'active', user?.id, smokeData],
    queryFn: async () => {
      const state = await fetchNetInfo();
      let activeSession = null;

      const offlineSessions = await sqliteService.getAllOfflineSessions();
      const localActive = offlineSessions.find((s) => {
        if (s.end_time) return false;
        if (!user) return s.user_id === SMOKE_USER_ID || isSmokeFixtureId(s.id);
        return s.user_id === user.id;
      });

      if (localActive) {
        activeSession = localActive;
      } else if (user && state.isConnected) {
        const { data } = await sessionService.fetchActiveSession();
        if (data) activeSession = data;
      }

      if (activeSession) setActiveSession(activeSession.id);
      else setActiveSession(null);
      return activeSession;
    },
    enabled: !!user || smokeData,
  });

  const { data: userSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['user_settings', user?.id],
    queryFn: async () => {
      const data = await profileService.fetchUserSettings();
      return data;
    },
    enabled: !!user,
  });

  const fetchData = async () => {
    await Promise.all([refetchEx(), refetchLogs(), refetchSettings()]);
  };

  const { setCounts, totalVolume } = useMemo(() => {
    const counts: Record<string, number> = {};
    let volume = 0;
    for (const l of logs) {
      volume += (l.weight || 0) * (l.reps || 0);
      counts[l.exercise_id] = (counts[l.exercise_id] || 0) + 1;
    }
    return { setCounts: counts, totalVolume: volume };
  }, [logs]);

  const processedExercises = useMemo(
    () =>
      exercises.map((ex) => ({
        ...ex,
        sets_done: setCounts[ex.id] || 0,
        completed: (setCounts[ex.id] || 0) >= (ex.target_sets || 0),
      })),
    [exercises, setCounts],
  );

  const startWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Utente non autenticato');
      const { data, error } = await startWorkoutSafely(user.id);
      if (error) throw error;
      return data;
    },
    onSuccess: (data: { id: string }) => {
      resetSessionPrCount();
      setActiveSession(data.id);
      queryClient.setQueryData(['session', 'active'], data);
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });

  const endWorkoutMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const startTime = new Date(activeSessionData?.start_time || new Date());
      const endTime = new Date();
      const durationMins = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      const summary = {
        totalVolume,
        setsDone: logs.length,
        durationMins,
        prsCount: sessionPrCount,
      };

      if (!user) throw new Error('Utente non autenticato');
      const { error } = await endWorkoutSafely(
        sessionId,
        user.id,
        endTime.toISOString(),
        activeSessionData?.start_time,
      );
      if (error) throw error;
      return summary;
    },
    onSuccess: (summary) => {
      setLastWorkoutSummary(summary);
      setShowSummary(true);
      setActiveSession(null);
      queryClient.setQueryData(['session', 'active'], null);
      queryClient.invalidateQueries({ queryKey: ['session'] });
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });

  const totalTargetSets = processedExercises.reduce((acc, ex) => acc + (ex.target_sets || 0), 0);
  const setProgressVal = totalTargetSets > 0 ? (logs.length / totalTargetSets) * 100 : 0;
  const volumeProgressVal = Math.min((totalVolume / 3500) * 100, 100);

  return {
    user,
    userSettings,
    exercises: processedExercises,
    loading: loadingEx || loadingLogs,
    totalVolume,
    activeSession: globalActiveSession,
    startWorkout: () => {
      if (startWorkoutMutation.isPending || endWorkoutMutation.isPending) return;
      startWorkoutMutation.mutate();
    },
    endWorkout: (sid: string) => {
      if (startWorkoutMutation.isPending || endWorkoutMutation.isPending) return;
      endWorkoutMutation.mutate(sid);
    },
    workoutActionPending: startWorkoutMutation.isPending || endWorkoutMutation.isPending,
    fetchData,
    progresso:
      globalActiveSession && processedExercises.length > 0
        ? (processedExercises.filter((ex) => ex.completed).length / processedExercises.length) * 100
        : 0,
    setProgress: globalActiveSession ? setProgressVal : 0,
    volumeProgress: globalActiveSession ? volumeProgressVal : 0,
  };
};
