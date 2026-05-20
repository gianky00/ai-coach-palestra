import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronRight, Dumbbell, Target, Trash2, TrendingUp } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { calculateE1RM } from '../lib/utils';
import { historyService } from '../services/historyService';
import { sessionService } from '../services/sessionService';
import type { ExerciseOption, ProgressionData, SessionData } from '../types';
import { SessionDetailModal } from './SessionDetailModal';

export const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<SessionData[]>([]);
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [selectedExId, setSelectedExId] = useState<string>('');
  const [progression, setProgression] = useState<ProgressionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'sessions' | 'progression'>('sessions');
  const [selectedSession, setSelectedSession] = useState<{ id: string; date: string } | null>(null);

  const fetchInitialData = useCallback(async () => {
    // Fetch sessions
    const sessions = await sessionService.fetchSessionsWithStats();

    if (sessions) {
      const formatted = sessions.map(
        (s: {
          id: string;
          start_time: string;
          end_time: string | null;
          training_logs?: { weight: number; reps: number }[];
        }) => {
          let vol = 0;
          s.training_logs?.forEach(
            (l: { weight: number; reps: number }) => (vol += l.weight * l.reps),
          );
          return {
            id: s.id,
            start_time: new Date(s.start_time).toLocaleDateString('it-IT', {
              day: '2-digit',
              month: 'short',
            }),
            end_time: s.end_time || '',
            volume: vol,
            ex_count: s.training_logs?.length || 0,
          };
        },
      );
      setHistory(formatted);
    }

    // Fetch exercises for dropdown
    const exData = await historyService.fetchExerciseOptions();
    setExercises(exData);

    setLoading(false);
  }, []);

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
  }, [fetchInitialData]);

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

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Vuoi eliminare definitivamente questa sessione e tutti i suoi log?'))
      return;

    const { error } = await sessionService.deleteSession(id);
    if (error) {
      toast.error("Errore nell'eliminazione della sessione");
    } else {
      toast.success('Sessione eliminata');
      fetchInitialData();
    }
  };

  if (loading) return <div className="loader-container">Caricamento dati...</div>;

  return (
    <div className="history-container">
      <div className="tab-switcher">
        <button
          className={viewMode === 'sessions' ? 'active' : ''}
          onClick={() => setViewMode('sessions')}
        >
          Sessioni
        </button>
        <button
          className={viewMode === 'progression' ? 'active' : ''}
          onClick={() => setViewMode('progression')}
        >
          Analisi Esercizio
        </button>
      </div>

      {viewMode === 'sessions' ? (
        <>
          <div className="section-header">
            <h2 className="section-title">Volume Totale</h2>
          </div>

          <div className="chart-card">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={[...history].reverse()}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="start_time"
                  stroke="#666"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: '#1c1c1e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                  itemStyle={{ color: 'var(--accent)' }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="var(--accent)"
                  fillOpacity={1}
                  fill="url(#colorVol)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="section-title-row" style={{ marginTop: '32px' }}>
            <h2 className="pro-section-title">Sessioni Passate</h2>
            <span className="count">{history.length}</span>
          </div>

          <div className="session-list">
            {history.map((session) => (
              <motion.div
                whileTap={{ scale: 0.98 }}
                key={session.id}
                className="session-item-premium"
                onClick={() => setSelectedSession({ id: session.id, date: session.start_time })}
              >
                <div className="session-icon-pro">
                  <Calendar size={18} />
                </div>
                <div className="session-info">
                  <span className="session-date-pro">{session.start_time}</span>
                  <span className="session-meta-pro">{session.ex_count} set registrati</span>
                </div>
                <div className="session-stats-pro">
                  <span className="session-vol-pro">{session.volume.toLocaleString()} kg</span>
                  <div className="vol-trend">
                    <TrendingUp size={12} />
                  </div>
                </div>
                <button
                  className="delete-log-btn"
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  style={{
                    background: 'rgba(255, 77, 77, 0.1)',
                    color: '#ff4d4d',
                    marginRight: '12px',
                  }}
                >
                  <Trash2 size={16} />
                </button>
                <ChevronRight size={18} color="#444" />
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <div className="progression-view">
          <div className="section-header">
            <h2 className="section-title">Progressione Forza</h2>
          </div>

          <div className="input-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Dumbbell size={14} /> Seleziona Esercizio
            </label>
            <select
              className="styled-select"
              value={selectedExId}
              onChange={(e) => setSelectedExId(e.target.value)}
            >
              <option value="">Scegli un esercizio...</option>
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>

          {selectedExId ? (
            <>
              <div className="chart-card">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={progression}>
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
                      name="e1RM (kg)"
                      stroke="var(--accent)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: 'var(--accent)' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="Peso Max (kg)"
                      stroke="#555"
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="stats-grid" style={{ marginTop: '24px' }}>
                <div className="stat-card">
                  <div className="stat-icon">
                    <Target size={18} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-val">
                      {progression.length > 0 ? progression[progression.length - 1].e1rm : 0} kg
                    </span>
                    <span className="stat-label">e1RM Attuale</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <TrendingUp size={18} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-val">
                      {progression.length > 1
                        ? progression[progression.length - 1].e1rm - progression[0].e1rm
                        : 0}{' '}
                      kg
                    </span>
                    <span className="stat-label">Guadagno Totale</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div
              className="empty-state"
              style={{ background: 'var(--card)', borderRadius: '24px' }}
            >
              <TrendingUp size={48} color="#333" />
              <p>
                Seleziona un esercizio per vedere
                <br />
                la tua progressione nel tempo.
              </p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedSession && (
          <SessionDetailModal
            sessionId={selectedSession.id}
            sessionDate={selectedSession.date}
            onClose={() => setSelectedSession(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
