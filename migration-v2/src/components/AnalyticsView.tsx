import { motion } from 'framer-motion';
import {
  Activity,
  Award,
  Dumbbell,
  Flame,
  Minus,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { calculateE1RM } from '../lib/utils';
import { analyticsService } from '../services/analyticsService';
import { historyService } from '../services/historyService';
import { profileService } from '../services/profileService';
import type { ExerciseOption, ProgressionData } from '../types';

// Palette premium per il grafico a ciambella (distribuzione muscolare)
const MUSCLE_COLORS: Record<string, string> = {
  Petto: '#ff4d4d', // Rosso
  Dorso: '#33cc33', // Verde
  Gambe: '#ff9900', // Arancione
  Spalle: '#00ccff', // Ciano
  Bicipiti: '#9933ff', // Viola
  Tricipiti: '#ff3399', // Rosa
  Core: '#ffff00', // Giallo
  Altro: '#888888', // Grigio
};

export const AnalyticsView: React.FC = () => {
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

  if (loading) return <div className="loader-container">Analisi in corso...</div>;

  return (
    <div className="profile-container" style={{ paddingBottom: '90px' }}>
      <div className="section-header">
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity color="var(--accent)" size={24} /> Analisi Performance
        </h2>
      </div>

      {/* KPI CARDS GRID */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="stat-card"
        >
          <div
            className="stat-icon"
            style={{ background: 'rgba(0, 255, 136, 0.1)', color: 'var(--accent)' }}
          >
            <Flame size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-val">
              {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume} kg
            </span>
            <span className="stat-label">Volume Totale</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="stat-card"
        >
          <div
            className="stat-icon"
            style={{ background: 'rgba(0, 204, 255, 0.1)', color: '#00ccff' }}
          >
            <Dumbbell size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-val">{totalSessions}</span>
            <span className="stat-label">Sessioni</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="stat-card"
        >
          <div
            className="stat-icon"
            style={{ background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d' }}
          >
            <Award size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-val">{totalPRs}</span>
            <span className="stat-label">PR Superati</span>
          </div>
        </motion.div>
      </div>

      {/* MODULO 1: BIOMETRIA (COMPOSIZIONE CORPOREA) */}
      <div className="section-header">
        <h2 className="section-title">Composizione Corporea</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="chart-card"
        style={{ marginBottom: '24px' }}
      >
        {weightHistory.length > 0 ? (
          <>
            <div style={{ height: '180px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightHistory}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ccff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00ccff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#666"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: '#00ccff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    name="Peso"
                    stroke="#00ccff"
                    fillOpacity={1}
                    fill="url(#colorWeight)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                textAlign: 'center',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    display: 'block',
                  }}
                >
                  Peso Corrente
                </span>
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: '800',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    marginTop: '4px',
                  }}
                >
                  <Scale size={14} color="#00ccff" /> {bodyWeight} kg
                </span>
              </div>

              <div>
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    display: 'block',
                  }}
                >
                  Delta Settimana
                </span>
                {weightDeltaWeekly !== null ? (
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      color:
                        weightDeltaWeekly > 0
                          ? '#ff4d4d'
                          : weightDeltaWeekly < 0
                            ? '#00ff88'
                            : '#fff',
                    }}
                  >
                    {weightDeltaWeekly > 0 ? (
                      <TrendingUp size={14} />
                    ) : weightDeltaWeekly < 0 ? (
                      <TrendingDown size={14} />
                    ) : (
                      <Minus size={14} />
                    )}
                    {weightDeltaWeekly > 0 ? '+' : ''}
                    {weightDeltaWeekly.toFixed(1)} kg
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      color: 'var(--text-dim)',
                      display: 'block',
                      marginTop: '4px',
                    }}
                  >
                    --
                  </span>
                )}
              </div>

              <div>
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    display: 'block',
                  }}
                >
                  Delta Mese
                </span>
                {weightDeltaMonthly !== null ? (
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      color:
                        weightDeltaMonthly > 0
                          ? '#ff4d4d'
                          : weightDeltaMonthly < 0
                            ? '#00ff88'
                            : '#fff',
                    }}
                  >
                    {weightDeltaMonthly > 0 ? (
                      <TrendingUp size={14} />
                    ) : weightDeltaMonthly < 0 ? (
                      <TrendingDown size={14} />
                    ) : (
                      <Minus size={14} />
                    )}
                    {weightDeltaMonthly > 0 ? '+' : ''}
                    {weightDeltaMonthly.toFixed(1)} kg
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      color: 'var(--text-dim)',
                      display: 'block',
                      marginTop: '4px',
                    }}
                  >
                    --
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <Scale size={32} color="#333" />
            <p style={{ margin: '8px 0 0', fontSize: '13px' }}>
              Inserisci le misurazioni del peso nel profilo.
            </p>
          </div>
        )}
      </motion.div>

      {/* MODULO 2: DISTRIBUZIONE VOLUME MUSCOLARE */}
      <div className="section-header">
        <h2 className="section-title">Distribuzione Lavoro Muscolare</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="chart-card"
        style={{ marginBottom: '24px', padding: '20px 16px' }}
      >
        {muscleDistribution.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ height: '180px', width: '100%', maxWidth: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={muscleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {muscleDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={MUSCLE_COLORS[entry.name] || MUSCLE_COLORS['Altro']}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`${value} serie`, 'Volume lavoro']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* LEGENDA PREMIUM VETRIFICATA */}
            <div
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {muscleDistribution.map((entry) => {
                const total = muscleDistribution.reduce((acc, curr) => acc + curr.value, 0);
                const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(0) : '0';
                const color = MUSCLE_COLORS[entry.name] || MUSCLE_COLORS['Altro'];
                return (
                  <div
                    key={entry.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11px',
                      color: '#fff',
                    }}
                  >
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: color,
                        display: 'inline-block',
                        boxShadow: `0 0 8px ${color}`,
                      }}
                    />
                    <span style={{ fontWeight: '500', flex: 1 }}>{entry.name}</span>
                    <span style={{ color: 'var(--text-dim)', fontWeight: '700' }}>
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <Activity size={32} color="#333" />
            <p style={{ margin: '8px 0 0', fontSize: '13px' }}>
              Completa gli allenamenti per tracciare il volume.
            </p>
          </div>
        )}
      </motion.div>

      {/* MODULO 3: PROGRESSIONE FORZA (ESTIMATED 1RM) */}
      <div className="section-header">
        <h2 className="section-title">Progressione Forza (e1RM)</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="chart-card"
        style={{ marginBottom: '24px' }}
      >
        <div className="input-group" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Dumbbell size={14} color="var(--accent)" /> Seleziona Esercizio
          </label>
          <select
            className="styled-select"
            value={selectedExId}
            onChange={(e) => setSelectedExId(e.target.value)}
          >
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        {selectedExId && progression.length > 0 ? (
          <>
            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progression}>
                  <defs>
                    <linearGradient id="colorE1rm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#666"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#666"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: 'var(--accent)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="e1rm"
                    name="e1RM Stimato"
                    stroke="var(--accent)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    name="Peso Max"
                    stroke="#666"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                textAlign: 'center',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    display: 'block',
                  }}
                >
                  Massimale Stimato (e1RM)
                </span>
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: '800',
                    color: 'var(--accent)',
                    display: 'block',
                    marginTop: '4px',
                  }}
                >
                  {progression[progression.length - 1].e1rm} kg
                </span>
              </div>

              <div>
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    display: 'block',
                  }}
                >
                  Guadagno Totale
                </span>
                {progression.length > 1 ? (
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      color:
                        progression[progression.length - 1].e1rm - progression[0].e1rm >= 0
                          ? '#00ff88'
                          : '#ff4d4d',
                    }}
                  >
                    {progression[progression.length - 1].e1rm - progression[0].e1rm >= 0 ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                    {progression[progression.length - 1].e1rm - progression[0].e1rm} kg
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      color: 'var(--text-dim)',
                      display: 'block',
                      marginTop: '4px',
                    }}
                  >
                    --
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <TrendingUp size={32} color="#333" />
            <p style={{ margin: '8px 0 0', fontSize: '13px' }}>
              Nessuna progressione registrata per questo esercizio.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
