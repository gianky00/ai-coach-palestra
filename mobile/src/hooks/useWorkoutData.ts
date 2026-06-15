import { addEventListener, fetch as fetchNetInfo } from '@react-native-community/netinfo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '../hooks/useAuth';
import { endWorkoutSafely, startWorkoutSafely, syncOfflineLogs } from '../lib/offlineSync';
import { sqliteService } from '../lib/sqlite';
import { DAYS, getDateForSelectedDay } from '../lib/utils';
import { exerciseService } from '../services/exerciseService';
import { logService } from '../services/logService';
import { profileService } from '../services/profileService';
import { sessionService } from '../services/sessionService';
import { useStore } from '../store/useStore';

export const useWorkoutData = (selectedDay?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    setActiveSession,
    setOfflineQueueCount,
    setShowSummary,
    setLastWorkoutSummary,
    activeSession: globalActiveSession,
  } = useStore();

  const currentDay = selectedDay || DAYS[new Date().getDay()];

  useEffect(() => {
    const checkQueue = async () => {
      const count = await sqliteService.getQueueCount();
      setOfflineQueueCount(count);

      const state = await fetchNetInfo();
      if (state.isConnected && count > 0) {
        await syncOfflineLogs();
        const updatedCount = await sqliteService.getQueueCount();
        setOfflineQueueCount(updatedCount);
        queryClient.invalidateQueries({ queryKey: ['logs'] });
        queryClient.invalidateQueries({ queryKey: ['exercises'] });
      }
    };

    checkQueue();

    const unsubscribe = addEventListener((state) => {
      if (state.isConnected) checkQueue();
    });

    const interval = setInterval(checkQueue, 10000);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [setOfflineQueueCount, queryClient]);

  const {
    data: exercises = [],
    isLoading: loadingEx,
    refetch: refetchEx,
  } = useQuery({
    queryKey: ['exercises', user?.id, currentDay],
    queryFn: async () => {
      const { data } = await exerciseService.fetchExercisesByDay(user!.id, currentDay);
      return data || [];
    },
    enabled: !!user,
  });

  const {
    data: logs = [],
    isLoading: loadingLogs,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ['logs', currentDay],
    queryFn: async () => {
      const targetDate = getDateForSelectedDay(currentDay);
      const { data } = await logService.fetchTotalLogsByDate(targetDate);
      const offlineLogs = await sqliteService.getAllLogs();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const startOfDayIso = startOfDay.toISOString();
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      const endOfDayIso = endOfDay.toISOString();
      const targetOffline = offlineLogs.filter(
        (l) => l.created_at >= startOfDayIso && l.created_at <= endOfDayIso,
      );
      return [...(data || []), ...targetOffline];
    },
    enabled: !!user,
  });

  const { data: activeSessionData } = useQuery({
    queryKey: ['session', 'active'],
    queryFn: async () => {
      const state = await fetchNetInfo();
      let activeSession = null;

      const offlineSessions = await sqliteService.getAllOfflineSessions();
      const localActive = offlineSessions.find((s) => !s.end_time);

      if (localActive) {
        activeSession = localActive;
      } else if (state.isConnected) {
        const { data } = await sessionService.fetchActiveSession();
        if (data) activeSession = data;
      }

      if (activeSession) setActiveSession(activeSession.id);
      else setActiveSession(null);
      return activeSession;
    },
    enabled: !!user,
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

  const setCounts: Record<string, number> = {};
  let totalVolume = 0;

  logs.forEach((l) => {
    totalVolume += (l.weight || 0) * (l.reps || 0);
    setCounts[l.exercise_id] = (setCounts[l.exercise_id] || 0) + 1;
  });

  const processedExercises = exercises.map((ex) => ({
    ...ex,
    sets_done: setCounts[ex.id] || 0,
    completed: (setCounts[ex.id] || 0) >= (ex.target_sets || 0),
  }));

  const startWorkoutMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await startWorkoutSafely(user!.id);
      if (error) throw error;
      return data;
    },
    onSuccess: (data: { id: string }) => {
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
        prsCount: 0,
      };

      const { error } = await endWorkoutSafely(sessionId, user!.id, endTime.toISOString());
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
    startWorkout: startWorkoutMutation.mutate,
    endWorkout: (sid: string) => {
      endWorkoutMutation.mutate(sid);
    },
    fetchData,
    progresso:
      globalActiveSession && processedExercises.length > 0
        ? (processedExercises.filter((ex) => ex.completed).length / processedExercises.length) * 100
        : 0,
    setProgress: globalActiveSession ? setProgressVal : 0,
    volumeProgress: globalActiveSession ? volumeProgressVal : 0,
  };
};
