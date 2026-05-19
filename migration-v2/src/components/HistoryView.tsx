import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calendar, ChevronRight, TrendingUp } from 'lucide-react';

interface SessionData {
  id: string;
  start_time: string;
  end_time: string;
  volume: number;
  ex_count: number;
}

export const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    // Fetch sessions
    const { data: sessions, error } = await supabase
      .from('workout_sessions')
      .select(`
        id, 
        start_time, 
        end_time,
        training_logs (weight, reps)
      `)
      .order('start_time', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      const formatted = sessions.map((s: any) => {
        let vol = 0;
        s.training_logs?.forEach((l: any) => vol += (l.weight * l.reps));
        return {
          id: s.id,
          start_time: new Date(s.start_time).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
          end_time: s.end_time,
          volume: vol,
          ex_count: s.training_logs?.length || 0
        };
      });
      setHistory(formatted);
    }
    setLoading(false);
  };

  const chartData = [...history].reverse();

  if (loading) return <div className="loader-container">Caricamento storico...</div>;

  return (
    <div className="history-container">
      <div className="section-header">
        <h2 className="section-title">Progressione Volume</h2>
      </div>

      <div className="chart-card">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis dataKey="start_time" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip 
              contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--accent)' }}
            />
            <Area type="monotone" dataKey="volume" stroke="var(--accent)" fillOpacity={1} fill="url(#colorVol)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="section-header" style={{ marginTop: '32px' }}>
        <h2 className="section-title">Sessioni Passate</h2>
        <span className="count">{history.length}</span>
      </div>

      <div className="session-list">
        {history.map(session => (
          <div key={session.id} className="session-item">
            <div className="session-icon">
              <Calendar size={20} />
            </div>
            <div className="session-info">
              <span className="session-date">{session.start_time}</span>
              <span className="session-meta">{session.ex_count} set totali</span>
            </div>
            <div className="session-stats">
              <span className="session-vol">{session.volume.toLocaleString()} kg</span>
              <TrendingUp size={14} color="var(--accent)" />
            </div>
            <ChevronRight size={18} color="#444" />
          </div>
        ))}
      </div>
    </div>
  );
};
