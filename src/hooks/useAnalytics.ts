import { useCallback, useEffect, useState } from 'react';

import { calculateE1RM } from '../lib/utils';
import { analyticsService } from '../services/analyticsService';
import { historyService } from '../services/historyService';
import { profileService } from '../services/profileService';
import type { ExerciseOption, ProgressionData } from '../types';

export const useAnalytics = () => {
  const [loading, setLoading] = useState(true);

  // Dati Globali KPI
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalPRs, setTotalPRs] = useState(0);

  // Modulo 1: Biometria
  const [weightHistory, setWeightHistory] = useState<
    { date: string; weight: number; timestamp: number }[]
  >([]);
  const [bodyWeight, setBodyWeight] = useState('');
  const [weightDeltaWeekly, setWeightDeltaWeekly] = useState<number | null>(null);
  const [weightDeltaMonthly, setWeightDeltaMonthly] = useState<number | null>(null);

  // Modulo 2: Distribuzione Muscolare
  const [muscleDistribution, setMuscleDistribution] = useState<{ name: string; value: number }[]>(
    [],
  );

  // Modulo 3: Progressione Forza
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [selectedExId, setSelectedExId] = useState<string>('');
  const [progression, setProgression] = useState<ProgressionData[]>([]);

  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);

    try {
      // 1. Carica le sessioni totali
      const sessionsCount = await analyticsService.fetchSessionsCount();
      setTotalSessions(sessionsCount);

      // 2. Carica tutti i log di allenamento per il volume, i PR e la distribuzione muscolare
      const allLogs = await analyticsService.fetchAllLogsWithExercise();

      // Calcola Volume Totale e PR storici
      let volCumulato = 0;
      const exMaxE1rm: Record<string, number> = {};
      let prCounter = 0;
      const muscleSets: Record<string, number> = {};

      // Ordina i log per data crescente per tracciare i PR storici in ordine cronologico
      const sortedLogs = [...allLogs].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

      sortedLogs.forEach((log) => {
        volCumulato += log.weight * log.reps;

        if (log.exercises) {
          const exName = log.exercises.name;
          const muscleGroup = log.exercises.muscle_group || 'Altro';

          // Incrementa contatore serie per gruppo muscolare
          muscleSets[muscleGroup] = (muscleSets[muscleGroup] || 0) + 1;

          // Calcola l'e1RM del set corrente
          const currentE1RM = calculateE1RM(log.weight, log.reps);

          // Verifica se è un Record Personale (e1RM più alto di sempre per questo esercizio fino ad ora)
          if (!exMaxE1rm[exName]) {
            exMaxE1rm[exName] = currentE1RM;
            prCounter += 1; // Il primo sollevamento è un PR di partenza
          } else if (currentE1RM > exMaxE1rm[exName]) {
            exMaxE1rm[exName] = currentE1RM;
            prCounter += 1; // Nuovo record stabilito!
          }
        }
      });

      setTotalVolume(volCumulato);
      setTotalPRs(prCounter);

      // Formatta la distribuzione per il PieChart
      const formattedMuscleData = Object.keys(muscleSets)
        .map((key) => ({
          name: key,
          value: muscleSets[key],
        }))
        .sort((a, b) => b.value - a.value);

      setMuscleDistribution(formattedMuscleData);

      // 3. Carica Storico Peso (Biometria)
      const weightData = await profileService.fetchWeightHistory();
      if (weightData.length > 0) {
        const formattedWeight = weightData.map((b) => ({
          date: new Date(b.created_at).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short',
          }),
          weight: b.weight,
          timestamp: new Date(b.created_at).getTime(),
        }));
        setWeightHistory(formattedWeight);

        const latestWeight = weightData[weightData.length - 1].weight;
        setBodyWeight(latestWeight.toString());

        // Calcola i delta settimanali e mensili
        const nowMs = new Date().getTime();
        const oneWeekAgoMs = nowMs - 7 * 24 * 60 * 60 * 1000;
        const oneMonthAgoMs = nowMs - 30 * 24 * 60 * 60 * 1000;

        // Cerca il peso più vicino a 7 giorni fa
        const weightWeeklyRef = formattedWeight.reduce(
          (prev, curr) =>
            Math.abs(curr.timestamp - oneWeekAgoMs) < Math.abs(prev.timestamp - oneWeekAgoMs)
              ? curr
              : prev,
          formattedWeight[0],
        );

        // Cerca il peso più vicino a 30 giorni fa
        const weightMonthlyRef = formattedWeight.reduce(
          (prev, curr) =>
            Math.abs(curr.timestamp - oneMonthAgoMs) < Math.abs(prev.timestamp - oneMonthAgoMs)
              ? curr
              : prev,
          formattedWeight[0],
        );

        if (formattedWeight.length > 1) {
          setWeightDeltaWeekly(latestWeight - weightWeeklyRef.weight);
          setWeightDeltaMonthly(latestWeight - weightMonthlyRef.weight);
        }
      }

      // 4. Carica la lista degli esercizi per il dropdown della progressione
      const exData = await historyService.fetchExerciseOptions();
      setExercises(exData);
      if (exData.length > 0 && !selectedExId) {
        setSelectedExId(exData[0].id);
      }
    } catch (error) {
      console.error('Errore durante il caricamento dei dati di analisi:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedExId]);

  // Carica i dati all'avvio
  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) {
        loadAnalyticsData();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [loadAnalyticsData]);

  // Gestione del caricamento della progressione per l'esercizio selezionato
  const fetchProgression = useCallback(async () => {
    if (!selectedExId) return;

    const exName = exercises.find((e) => e.id === selectedExId)?.name;
    if (!exName) return;

    const logs = await historyService.fetchExerciseProgression(exName);

    if (logs) {
      const dailyMap: Record<string, ProgressionData> = {};

      logs.forEach((l: { weight: number; reps: number; created_at: string }) => {
        const d = new Date(l.created_at).toLocaleDateString('it-IT', {
          day: '2-digit',
          month: 'short',
        });
        const e1rm = calculateE1RM(l.weight, l.reps);

        if (!dailyMap[d] || e1rm > dailyMap[d].e1rm) {
          dailyMap[d] = {
            date: d,
            e1rm: e1rm,
            weight: l.weight,
          };
        }
      });

      setProgression(Object.values(dailyMap));
    }
  }, [selectedExId, exercises]);

  // Ricarica la progressione quando cambia l'esercizio selezionato
  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active && selectedExId) {
        fetchProgression();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [selectedExId, fetchProgression]);

  return {
    loading,
    totalSessions,
    totalVolume,
    totalPRs,
    weightHistory,
    bodyWeight,
    weightDeltaWeekly,
    weightDeltaMonthly,
    muscleDistribution,
    exercises,
    selectedExId,
    setSelectedExId,
    progression,
    loadAnalyticsData,
  };
};
