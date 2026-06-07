import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { hapticService } from '../../services/soundService';
import { saveLogSafely } from '../lib/offlineSync';
import { sqliteService } from '../lib/sqlite';
import { logService } from '../services/logService';
import type { Exercise, OfflineLog } from '../types';

interface UseLogExerciseProps {
  user: { id: string } | null;
  selectedEx: Exercise;
  activeSession: string | null;
  onSuccess: (timerSecs?: number) => void;
}

export const useLogExercise = ({
  user,
  selectedEx,
  activeSession,
  onSuccess,
}: UseLogExerciseProps) => {
  const [currentExLogs, setCurrentExLogs] = useState<OfflineLog[]>([]);
  const [personalRecord, setPersonalRecord] = useState<{ weight: number; reps: number } | null>(
    null,
  );
  const [lastSessionLog, setLastSessionLog] = useState<{
    weight: number;
    reps: number;
    created_at: string;
  } | null>(null);

  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState(selectedEx.target_reps || '10');
  const [rpe, setRpe] = useState('8');
  const [manualSetType, setManualSetType] = useState<'S' | 'F' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- LOGICA AUTO-CEDIMENTO DERIVATA (Evita il warning setState in Effect) ---
  const autoFailure = (() => {
    const target = parseInt(selectedEx.target_reps, 10) || 0;
    const current = parseInt(reps, 10) || 0;
    return target > 0 && current >= target;
  })();

  const setType = manualSetType ?? (autoFailure ? 'F' : 'S');

  const fetchInitialData = useCallback(async () => {
    if (!user || !selectedEx.id) return;

    try {
      const { data: todayLogs } = await logService.fetchTodayLogsForExercise(selectedEx.id);
      const offlineLogs = await sqliteService.getAllLogs();
      const currentOffline = offlineLogs.filter((l) => l.exercise_id === selectedEx.id);

      const allTodayLogs = [...(todayLogs || []), ...currentOffline];
      setCurrentExLogs(allTodayLogs as OfflineLog[]);

      const { data: pr } = await logService.fetchPersonalRecord(selectedEx.id);
      if (pr) setPersonalRecord(pr);

      const { data: lastLog } = await logService.fetchLastSessionLog(selectedEx.id);
      if (lastLog) {
        setLastSessionLog(lastLog as { weight: number; reps: number; created_at: string });
      }

      if (allTodayLogs.length > 0) {
        const lastSet = allTodayLogs[allTodayLogs.length - 1];
        setWeight(lastSet.weight?.toString() || '');
        setReps(lastSet.reps?.toString() || '');
      } else if (lastLog) {
        setWeight(lastLog.weight.toString());
        setReps(lastLog.reps.toString());
      } else if (pr) {
        setWeight(pr.weight.toString());
        setReps(pr.reps.toString());
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  }, [selectedEx, user]);

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

    try {
      const { error } = await saveLogSafely({
        user_id: user.id,
        exercise_id: selectedEx.id,
        session_id: activeSession,
        weight: weightVal,
        reps: repsVal,
        rpe: rpeVal,
        set_type: typeVal,
      });

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

        onSuccess(selectedEx.rest_time || 90);
        await fetchInitialData();
        setManualSetType(null); // Reset dopo il salvataggio
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

  const handleDeleteLog = async (tempId: string) => {
    hapticService.medium();
    Alert.alert('Elimina Set', 'Vuoi davvero eliminare questo set?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          await sqliteService.deleteLog(tempId);
          await fetchInitialData();
          onSuccess();
        },
      },
    ]);
  };

  return {
    currentExLogs,
    personalRecord,
    lastSessionLog,
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
