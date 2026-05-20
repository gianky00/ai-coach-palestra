import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Minus, Scale, Timer, TrendingDown, TrendingUp, Weight } from 'lucide-react';
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

import { profileService } from '../services/profileService';
import { useAuth } from './AuthProvider';
import { ReleaseNotesModal } from './ReleaseNotesModal';

export const ProfileView: React.FC = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  // States per Biometria e Settings
  const [bodyWeight, setBodyWeight] = useState('');
  const [weightHistory, setWeightHistory] = useState<{ date: string; weight: number }[]>([]);
  const [timerSecs, setTimerSecs] = useState('90');
  const [barWeight, setBarWeight] = useState('20');

  const loadUserData = useCallback(async () => {
    // Carica storico peso
    const bio = await profileService.fetchWeightHistory();
    if (bio.length > 0) {
      setWeightHistory(
        bio.map((b) => ({
          date: new Date(b.created_at).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short',
          }),
          weight: b.weight,
        })),
      );
      setBodyWeight(bio[bio.length - 1].weight.toString());
    }

    // Carica settings
    const settings = await profileService.fetchUserSettings();
    if (settings) {
      setTimerSecs(settings.recovery_timer.toString());
      setBarWeight(settings.bar_weight.toString());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active && user) {
        loadUserData();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [user, loadUserData]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Salva Biometria (solo se valore inserito e diverso dall'ultimo)
      const newWeight = parseFloat(bodyWeight);
      const lastWeight =
        weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : null;

      if (!isNaN(newWeight) && newWeight !== lastWeight) {
        await profileService.saveWeight(user.id, newWeight);
      }

      // 2. Salva Settings (Upsert)
      await profileService.saveSettings(user.id, parseInt(timerSecs), parseFloat(barWeight));

      toast.success('Profilo aggiornato!');
      loadUserData();
    } catch (e) {
      toast.error('Errore nel salvataggio');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const weightChange =
    weightHistory.length > 1
      ? (weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight).toFixed(1)
      : 0;

  return (
    <div className="profile-container" style={{ paddingBottom: '90px' }}>
      <div className="section-header">
        <h2 className="section-title">Composizione Corporea</h2>
      </div>

      <div className="chart-card" style={{ marginBottom: '24px' }}>
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
              <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
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
                stroke="#00ccff"
                fillOpacity={1}
                fill="url(#colorWeight)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '16px',
            alignItems: 'center',
          }}
        >
          <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>
              <Scale size={14} /> Peso Attuale (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={bodyWeight}
              onChange={(e) => setBodyWeight(e.target.value)}
              style={{
                fontSize: '24px',
                padding: '8px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid #333',
                borderRadius: 0,
              }}
            />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Variazione
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: '800',
                color: Number(weightChange) > 0 ? '#ff4d4d' : '#00ff88',
              }}
            >
              {Number(weightChange) > 0 ? (
                <TrendingUp size={16} />
              ) : Number(weightChange) < 0 ? (
                <TrendingDown size={16} />
              ) : (
                <Minus size={16} />
              )}
              {weightChange} kg
            </div>
          </div>
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">Impostazioni Allenamento</h2>
      </div>

      <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="input-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Timer size={16} color="var(--accent)" /> Timer Recupero (secondi)
          </label>
          <input type="number" value={timerSecs} onChange={(e) => setTimerSecs(e.target.value)} />
        </div>

        <div className="input-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Weight size={16} color="var(--accent)" /> Peso Bilanciere Vuoto (kg)
          </label>
          <input type="number" value={barWeight} onChange={(e) => setBarWeight(e.target.value)} />
        </div>
      </div>

      <button
        className="save-btn"
        onClick={handleSave}
        disabled={loading}
        style={{ marginTop: '24px' }}
      >
        {loading ? 'Salvataggio...' : 'Salva Tutte le Modifiche'}
      </button>

      <button
        className="end-btn"
        onClick={signOut}
        style={{ marginTop: '40px', width: '100%', height: '50px', justifyContent: 'center' }}
      >
        <LogOut size={18} /> Esci dall'Account
      </button>

      <div
        className="profile-footer"
        onClick={() => setShowReleaseNotes(true)}
        style={{
          textAlign: 'center',
          marginTop: '40px',
          cursor: 'pointer',
          padding: '14px 20px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 136, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
        }}
      >
        <motion.p
          whileHover={{ scale: 1.01 }}
          style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', margin: 0 }}
        >
          KINEFIT v{import.meta.env.APP_VERSION || '2.0.0'}
        </motion.p>
        <p
          style={{
            fontSize: '10px',
            color: 'var(--accent)',
            fontWeight: 700,
            marginTop: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Visualizza Note di Rilascio e Diagnostica
        </p>
        <p
          style={{
            fontSize: '9px',
            color: 'rgba(255, 255, 255, 0.35)',
            marginTop: '8px',
            fontFamily: 'monospace',
            letterSpacing: '0.2px',
          }}
        >
          User ID: {user?.id}
        </p>
      </div>

      <AnimatePresence>
        {showReleaseNotes && <ReleaseNotesModal onClose={() => setShowReleaseNotes(false)} />}
      </AnimatePresence>
    </div>
  );
};
