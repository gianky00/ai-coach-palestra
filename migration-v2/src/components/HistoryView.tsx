import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronRight, Trash2, TrendingUp } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { sessionService } from '../services/sessionService';
import type { SessionData } from '../types';
import { SessionDetailModal } from './SessionDetailModal';

export const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
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

    setLoading(false);
  }, []);

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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
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
              name="Volume"
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
