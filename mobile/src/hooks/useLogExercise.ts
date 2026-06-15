import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { deleteLogSafely, saveLogSafely, startWorkoutSafely } from '../lib/offlineSync';
import { sqliteService } from '../lib/sqlite';
import { DAYS, getDateForSelectedDay, getStartOfDay } from '../lib/utils';
import { logService } from '../services/logService';
import { hapticService } from '../services/soundService';
import { useStore } from '../store/useStore';
import type { Exercise, OfflineLog } from '../types';

interface UseLogExerciseProps {
  user: { id: string } | null;
  selectedEx: Exercise;
  activeSession: string | null;
  selectedDay?: string;
  onSuccess: (timerSecs?: number) => void;
}

export const useLogExercise = ({
  user,
  selectedEx,
  activeSession,
  selectedDay,
  onSuccess,
}: UseLogExerciseProps) => {
  const queryClient = useQueryClient();
  const [currentExLogs, setCurrentExLogs] = useState<OfflineLog[]>([]);
  const [personalRecord, setPersonalRecord] = useState<{ weight: number; reps: number } | null>(
    null,
  );
  const [lastSessionLogs, setLastSessionLogs] = useState<
    {
      weight: number;
      reps: number;
      created_at: string;
      set_type: string;
      rpe: number;
    }[]
  >([]);

  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState(selectedEx.target_reps || '10');
  const [rpe, setRpe] = useState('8');
  const [manualSetType, setManualSetType] = useState<'S' | 'F' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const autoFailure = (() => {
    const target = parseInt(selectedEx.target_reps, 10) || 0;
    const current = parseInt(reps, 10) || 0;
    return target > 0 && current >= target;
  })();

  const setType = manualSetType ?? (autoFailure ? 'F' : 'S');

  const fetchInitialData = useCallback(async () => {
    if (!user || !selectedEx.id) return;

    try {
      const targetDate = selectedDay ? getDateForSelectedDay(selectedDay) : new Date();
      const startOfDayIso = getStartOfDay(targetDate).toISOString();

      const targetEnd = new Date(targetDate);
      targetEnd.setHours(23, 59, 59, 999);
      const endOfDayIso = targetEnd.toISOString();

      const { data: todayLogs } = await logService.fetchLogsForExerciseByDate(
        selectedEx.id,
        targetDate,
      );
      const offlineLogs = await sqliteService.getAllLogs();
      const currentOffline = offlineLogs.filter(
        (l) =>
          l.exercise_id === selectedEx.id &&
          l.created_at >= startOfDayIso &&
          l.created_at <= endOfDayIso,
      );

      const allTodayLogs = [...(todayLogs || []), ...currentOffline];
      setCurrentExLogs(allTodayLogs as OfflineLog[]);

      const { data: pr } = await logService.fetchPersonalRecord(selectedEx.id);
      if (pr) setPersonalRecord(pr);

      const { data: lastLogs } = await logService.fetchLastSessionLogs(selectedEx.id);
      if (lastLogs && lastLogs.length > 0) {
        setLastSessionLogs(
          lastLogs as {
            weight: number;
            reps: number;
            created_at: string;
            set_type: string;
            rpe: number;
          }[],
        );
      } else {
        setLastSessionLogs([]);
      }

      if (allTodayLogs.length > 0) {
        const lastSet = allTodayLogs[allTodayLogs.length - 1];
        setWeight(lastSet.weight?.toString() || '');
        setReps(lastSet.reps?.toString() || '');
      } else if (lastLogs && lastLogs.length > 0) {
        const lastLog = lastLogs[lastLogs.length - 1];
        setWeight(lastLog.weight.toString());
        setReps(lastLog.reps.toString());
      } else if (pr) {
        setWeight(pr.weight.toString());
        setReps(pr.reps.toString());
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  }, [selectedEx, user, selectedDay]);

  useEffect(() => {
    (async () => {
      await fetchInitialData();
    })();
  }, [fetchInitialData]);

  const handleSaveLog = async (customData?: Partial<OfflineLog>) => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);

    const weightVal = customData?.weight ?? parseFloat(weight);
    const repsVal = customData?.reps ?? parseInt(reps, 10);
    const rpeVal = customData?.rpe ?? parseInt(rpe, 10);
    const typeVal = customData?.set_type ?? setType;

    if (isNaN(weightVal) || isNaN(repsVal)) {
      Alert.alert('Errore', 'Inserisci peso e ripetizioni validi');
      setIsSubmitting(false);
      return;
    }

    let finalSessionId = activeSession;
    const customDate = selectedDay ? getDateForSelectedDay(selectedDay) : new Date();

    const isToday = !selectedDay || selectedDay === DAYS[new Date().getDay()];

    if (!finalSessionId && isToday) {
      try {
        const { data } = await startWorkoutSafely(user.id, customDate);
        finalSessionId = data.id;
        useStore.getState().setActiveSession(finalSessionId);
      } catch (e) {
        console.warn('Auto-start session failed', e);
      }
    }

    try {
      const { error } = await saveLogSafely(
        {
          user_id: user.id,
          exercise_id: selectedEx.id,
          session_id: finalSessionId,
          weight: weightVal,
          reps: repsVal,
          rpe: rpeVal,
          set_type: typeVal,
        },
        customDate,
      );

      if (error) {
        Alert.alert('Errore', 'Impossibile salvare il set');
      } else {
        const isPR =
          personalRecord &&
          (weightVal > personalRecord.weight ||
            (weightVal === personalRecord.weight && repsVal > personalRecord.reps));

        if (isPR) {
          hapticService.heavy();
          Alert.alert('🔥 NUOVO RECORD!', `Hai superato il tuo limite!`);
        } else {
          hapticService.success();
        }

        queryClient.invalidateQueries({ queryKey: ['logs'] });
        queryClient.invalidateQueries({ queryKey: ['sessions'] });
        queryClient.invalidateQueries({ queryKey: ['analytics'] });

        onSuccess(selectedEx.rest_time || 90);
        await fetchInitialData();
        setManualSetType(null);
      }
    } catch (err) {
      console.error('Error saving log:', err);
      Alert.alert('Errore', 'Si è verificato un problema imprevisto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fastLogLast = async () => {
    if (currentExLogs.length > 0) {
      const last = currentExLogs[currentExLogs.length - 1];
      await handleSaveLog({
        weight: last.weight,
        reps: last.reps,
        rpe: last.rpe,
        set_type: last.set_type as 'S' | 'F',
      });
    }
  };

  const handleDeleteLog = async (log: OfflineLog) => {
    hapticService.medium();
    Alert.alert('Elimina Set', 'Vuoi davvero eliminare questo set?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          await deleteLogSafely(log.tempId, log.id);
          hapticService.success();
          await fetchInitialData();
          onSuccess();
        },
      },
    ]);
  };

  return {
    currentExLogs,
    personalRecord,
    lastSessionLogs,
    weight,
    setWeight,
    reps,
    setReps,
    rpe,
    setRpe,
    setType,
    setSetType: setManualSetType,
    isSubmitting,
    handleSaveLog,
    fastLogLast,
    handleDeleteLog,
  };
};
