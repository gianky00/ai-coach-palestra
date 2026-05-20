import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

import { useAuth } from '../components/AuthProvider';
import { getOfflineQueueCount, syncOfflineLogs } from '../lib/offlineSync';
import { exerciseService } from '../services/exerciseService';
import { logService } from '../services/logService';
import { sessionService } from '../services/sessionService';
import { useStore } from '../store/useStore';

export const useWorkoutData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setActiveSession, setOfflineQueueCount, setShowSummary, setLastWorkoutSummary } =
    useStore();

  // Sync Monitoring
  useEffect(() => {
    const checkQueue = async () => {
      const count = await getOfflineQueueCount();
      setOfflineQueueCount(count);

      if (navigator.onLine && count > 0) {
        await syncOfflineLogs();
        const updatedCount = await getOfflineQueueCount();
        setOfflineQueueCount(updatedCount);
        // Forza l'aggiornamento dei dati della dashboard per riflettere i nuovi dati sincronizzati
        queryClient.invalidateQueries({ queryKey: ['logs'] });
        queryClient.invalidateQueries({ queryKey: ['exercises'] });
      }
    };

    checkQueue();

    window.addEventListener('online', checkQueue);
    const interval = setInterval(checkQueue, 5000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', checkQueue);
    };
  }, [setOfflineQueueCount, queryClient]);

  // Queries
  const {
    data: exercises = [],
    isLoading: loadingEx,
    refetch: refetchEx,
  } = useQuery({
    queryKey: ['exercises', user?.id],
    queryFn: async () => {
      const { data } = await exerciseService.fetchTodayExercises(user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const {
    data: logs = [],
    isLoading: loadingLogs,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ['logs', 'today'],
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

  // Combined refresh function
  const fetchData = async () => {
    await Promise.all([refetchEx(), refetchLogs()]);
  };

  // Calculations
  const setCounts: Record<string, number> = {};
  let totalVolume = 0;

  logs.forEach((l) => {
    totalVolume += l.weight * l.reps;
    setCounts[l.exercise_id] = (setCounts[l.exercise_id] || 0) + 1;
  });

  const processedExercises = exercises.map((ex) => ({
    ...ex,
    sets_done: setCounts[ex.id] || 0,
    completed: (setCounts[ex.id] || 0) >= ex.target_sets,
  }));

  // Mutations
  const startWorkoutMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await sessionService.startWorkout(user!.id);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setActiveSession(data.id);
      queryClient.invalidateQueries({ queryKey: ['session'] });
      toast.success('Allenamento iniziato!');
    },
  });

  const endWorkoutMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      // Before ending, gather stats for summary
      const startTime = new Date(activeSessionData?.start_time || new Date());
      const endTime = new Date();
      const durationMins = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      const summary = {
        totalVolume,
        setsDone: logs.length,
        durationMins,
        prsCount: 0, // Semplificazione, potrebbe essere calcolato precisamente
      };

      const { error } = await sessionService.endWorkout(sessionId, endTime.toISOString());

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

  return {
    user,
    exercises: processedExercises,
    loading: loadingEx || loadingLogs,
    totalVolume,
    activeSession: activeSessionData?.id || null,
    startWorkout: startWorkoutMutation.mutate,
    endWorkout: () => {
      const sid = activeSessionData?.id;
      if (sid && window.confirm("Terminare l'allenamento?")) {
        endWorkoutMutation.mutate(sid);
      }
    },
    fetchData,
    progresso:
      activeSessionData?.id && processedExercises.length > 0
        ? (processedExercises.filter((ex) => ex.completed).length / processedExercises.length) * 100
        : 0,
  };
};
