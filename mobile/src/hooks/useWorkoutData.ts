import NetInfo from '@react-native-community/netinfo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '../lib/AuthProvider';
import { endWorkoutSafely, syncOfflineLogs } from '../lib/offlineSync';
import { startWorkoutSafely } from '../lib/offlineSync';
import { sqliteService } from '../lib/sqlite';
import { DAYS } from '../lib/utils';
import { exerciseService } from '../services/exerciseService';
import { logService } from '../services/logService';
import { profileService } from '../services/profileService';
import { sessionService } from '../services/sessionService';
import { useStore } from '../store/useStore';

export const useWorkoutData = (selectedDay?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setActiveSession, setOfflineQueueCount, setShowSummary, setLastWorkoutSummary } =
    useStore();

  const currentDay = selectedDay || DAYS[new Date().getDay()];

  // Sync Monitoring
  useEffect(() => {
    const checkQueue = async () => {
      const count = await sqliteService.getQueueCount();
      setOfflineQueueCount(count);

      const state = await NetInfo.fetch();
      if (state.isConnected && count > 0) {
        await syncOfflineLogs();
        const updatedCount = await sqliteService.getQueueCount();
        setOfflineQueueCount(updatedCount);
        queryClient.invalidateQueries({ queryKey: ['logs'] });
        queryClient.invalidateQueries({ queryKey: ['exercises'] });
      }
    };

    checkQueue();

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) checkQueue();
    });

    const interval = setInterval(checkQueue, 10000);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [setOfflineQueueCount, queryClient]);

  // Queries
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
    queryKey: ['logs', 'today'], // Manteniamo i log di OGGI per il volume
    queryFn: async () => {
      const { data } = await logService.fetchTodayTotalLogs();
      return data || [];
    },
    enabled: !!user,
  });

  const { data: activeSessionData } = useQuery({
    queryKey: ['session', 'active'],
    queryFn: async () => {
      const { data } = await sessionService.fetchActiveSession();
      if (data) setActiveSession(data.id);
      return data;
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

  // Combined refresh function
  const fetchData = async () => {
    await Promise.all([refetchEx(), refetchLogs(), refetchSettings()]);
  };

  // Calculations
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

  // Mutations
  const startWorkoutMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await startWorkoutSafely(user!.id);
      if (error) throw error;
      return data;
    },
    onSuccess: (data: { id: string }) => {
      setActiveSession(data.id);
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
    activeSession: activeSessionData?.id || null,
    startWorkout: startWorkoutMutation.mutate,
    endWorkout: (sid: string) => {
      endWorkoutMutation.mutate(sid);
    },
    fetchData,
    progresso:
      activeSessionData?.id && processedExercises.length > 0
        ? (processedExercises.filter((ex) => ex.completed).length / processedExercises.length) * 100
        : 0,
    setProgress: activeSessionData?.id ? setProgressVal : 0,
    volumeProgress: activeSessionData?.id ? volumeProgressVal : 0,
  };
};
