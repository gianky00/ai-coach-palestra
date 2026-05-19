import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Scale, Timer, Weight, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from './AuthProvider';

export const ProfileView: React.FC = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  
  // States per Biometria e Settings
  const [bodyWeight, setBodyWeight] = useState('');
  const [timerSecs, setTimerSecs] = useState('90');
  const [barWeight, setBarWeight] = useState('20');

  useEffect(() => {
    if (user) loadUserData();
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);
    
    // Carica ultimo peso corporeo
    const { data: bio } = await supabase
      .from('biometrics')
      .select('weight')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (bio) setBodyWeight(bio.weight.toString());

    // Carica settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .maybeSingle();
    
    if (settings) {
      setTimerSecs(settings.recovery_timer.toString());
      setBarWeight(settings.bar_weight.toString());
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setMsg('');

    try {
      // 1. Salva Biometria (solo se cambiato)
      if (bodyWeight) {
        await supabase.from('biometrics').insert([{ 
          user_id: user.id, 
          weight: parseFloat(bodyWeight) 
        }]);
      }

      // 2. Salva Settings (Upsert)
      await supabase.from('user_settings').upsert({
        user_id: user.id,
        recovery_timer: parseInt(timerSecs),
        bar_weight: parseFloat(barWeight)
      });

      setMsg('Impostazioni salvate con successo!');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="section-header">
        <h2 className="section-title">Profilo & Biometria</h2>
      </div>

      <div className="settings-group">
        <div className="stat-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Scale size={16} color="var(--accent)"/> Peso Corporeo (kg)</label>
            <input 
              type="number" 
              step="0.1" 
              value={bodyWeight} 
              onChange={e => setBodyWeight(e.target.value)} 
              placeholder="Es. 75.5"
            />
          </div>
        </div>

        <div className="section-header">
          <h2 className="section-title">Impostazioni App</h2>
        </div>

        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Timer size={16} color="var(--accent)"/> Timer Recupero (secondi)</label>
            <input 
              type="number" 
              value={timerSecs} 
              onChange={e => setTimerSecs(e.target.value)} 
            />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Weight size={16} color="var(--accent)"/> Peso Bilanciere Vuoto (kg)</label>
            <input 
              type="number" 
              value={barWeight} 
              onChange={e => setBarWeight(e.target.value)} 
            />
          </div>
        </div>

        {msg && (
          <div className="auth-message success" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {msg}
          </div>
        )}

        <button className="save-btn" onClick={handleSave} disabled={loading} style={{ marginTop: '24px' }}>
          {loading ? 'Salvataggio...' : 'Salva Tutte le Modifiche'}
        </button>

        <button 
          className="end-btn" 
          onClick={signOut} 
          style={{ marginTop: '40px', width: '100%', height: '50px', justifyContent: 'center' }}
        >
          <LogOut size={18} /> Esci dall'Account
        </button>
      </div>

      <div className="profile-footer" style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-dim)', fontSize: '12px' }}>
        <p>AI COACH V2 • Versione Pro Cloud</p>
        <p>User ID: {user?.id}</p>
      </div>
    </div>
  );
};
