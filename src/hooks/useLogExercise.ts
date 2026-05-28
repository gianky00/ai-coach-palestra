import confetti from 'canvas-confetti';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { getExerciseAsset, getMuscleGroupFallback } from '../lib/exerciseAssets';
import { getOfflineLogsForExercise, removeOfflineLog, saveLogSafely } from '../lib/offlineSync';
import { logService } from '../services/logService';
import { soundService } from '../services/soundService';
import type { Exercise } from '../types';

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
  const [currentExLogs, setCurrentExLogs] = useState<
    Array<{
      id?: string;
      tempId?: string;
      weight: number;
      reps: number;
      rpe: number;
      set_type?: 'W' | 'S' | 'F';
      exercise_id: string;
    }>
  >([]);
  const [personalRecord, setPersonalRecord] = useState<{ weight: number; reps: number } | null>(
    null,
  );
  const [lastSessionLog, setLastSessionLog] = useState<{
    weight: number;
    reps: number;
    created_at: string;
  } | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState(selectedEx.target_reps);
  const [rpe, setRpe] = useState('8');
  const [setType, setSetType] = useState<'W' | 'S' | 'F'>('S');
  const [showPlateCalc, setShowPlateCalc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [imageErrorExName, setImageErrorExName] = useState<string | null>(null);

  const imgSrc =
    imageErrorExName === selectedEx.name
      ? getMuscleGroupFallback(selectedEx.muscle_group)
      : getExerciseAsset(selectedEx.name);

  const fetchInitialData = useCallback(async () => {
    const { data: todayLogs } = await logService.fetchTodayLogsForExercise(selectedEx.id);
    const offlineLogs = await getOfflineLogsForExercise(selectedEx.id);
    const allTodayLogs = todayLogs
      ? ([...todayLogs, ...offlineLogs] as Array<{
          id?: string;
          tempId?: string;
          weight: number;
          reps: number;
          rpe: number;
          set_type?: 'W' | 'S' | 'F';
          exercise_id: string;
        }>)
      : offlineLogs;
    setCurrentExLogs(allTodayLogs);

    const { data: pr } = await logService.fetchPersonalRecord(selectedEx.id);
    if (pr) setPersonalRecord(pr);

    const { data: lastLog } = await logService.fetchLastSessionLog(selectedEx.id);
    if (lastLog) {
      setLastSessionLog(lastLog as { weight: number; reps: number; created_at: string });
    }

    if (allTodayLogs.length > 0) {
      const lastSet = allTodayLogs[allTodayLogs.length - 1];
      setWeight(lastSet.weight.toString());
      setReps(lastSet.reps.toString());
    } else if (lastLog) {
      setWeight(lastLog.weight.toString());
      setReps(lastLog.reps.toString());
    } else if (pr) {
      setWeight(pr.weight.toString());
      setReps(pr.reps.toString());
    }
  }, [selectedEx]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) {
        fetchInitialData();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [selectedEx, fetchInitialData]);

  const triggerCelebration = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 3000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const handleSaveLog = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    soundService.playClick();
    const weightVal = parseFloat(weight);
    const repsVal = parseInt(reps);
    const rpeVal = parseInt(rpe);

    if (isNaN(weightVal) || weightVal < 0) {
      toast.error('Inserisci un peso valido');
      setIsSubmitting(false);
      return;
    }
    if (isNaN(repsVal) || repsVal <= 0) {
      toast.error('Ripetizioni non valide');
      setIsSubmitting(false);
      return;
    }

    try {
      const { error, isOffline } = await saveLogSafely({
        user_id: user.id,
        exercise_id: selectedEx.id,
        session_id: activeSession,
        weight: weightVal,
        reps: repsVal,
        rpe: rpeVal,
        set_type: setType,
      });

      if (error) {
        toast.error('Errore durante il salvataggio');
      } else {
        const isPR =
          !personalRecord ||
          weightVal > personalRecord.weight ||
          (weightVal === personalRecord.weight && repsVal > personalRecord.reps);

        if (isPR) {
          soundService.playSuccess();
          setTimeout(() => soundService.playSuccess(), 350);
          triggerCelebration();
          toast.success('🏆 NUOVO RECORD PERSONALE!', { icon: '🔥', duration: 4000 });
        } else {
          soundService.playSuccess();
          if (!isOffline) toast.success('Set salvato!');
        }

        onSuccess(selectedEx.rest_time || 90);
        fetchInitialData();
      }
    } catch (e) {
      console.error(e);
      toast.error('Errore durante il salvataggio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: string | undefined) => {
    if (!id) return;
    soundService.playClick();
    if (id.length > 20) {
      await removeOfflineLog(id);
      toast.success('Set offline rimosso');
      onSuccess();
      fetchInitialData();
      return;
    }

    if (!window.confirm('Vuoi eliminare questo set?')) return;
    soundService.playClick();
    const { error } = await logService.deleteLog(id);
    if (!error) {
      toast.success('Set eliminato');
      onSuccess();
      fetchInitialData();
    }
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
    setSetType,
    showPlateCalc,
    setShowPlateCalc,
    isSubmitting,
    showGuide,
    setShowGuide,
    imgSrc,
    setImageErrorExName,
    handleSaveLog,
    handleDeleteLog,
  };
};
