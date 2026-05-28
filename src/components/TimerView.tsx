import { BellRing, ChevronDown, ChevronUp, Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { type FC, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { playTimerEndSound } from '../lib/audio';

interface TimerViewProps {
  initialSeconds?: number;
  onTimerChange?: (seconds: number) => void;
  onTimerActiveChange?: (active: boolean) => void;
  externalTimer?: number;
  externalTimerActive?: boolean;
}

export const TimerView: FC<TimerViewProps> = ({
  externalTimer = 0,
  externalTimerActive = false,
  onTimerChange,
  onTimerActiveChange,
}) => {
  const [localSeconds, setLocalSeconds] = useState(90);

  // Vibration on end
  useEffect(() => {
    if (externalTimerActive && externalTimer === 1) {
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
      playTimerEndSound();
      toast.success('Recupero Completato!', { icon: '🔔' });
    }
  }, [externalTimer, externalTimerActive]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuickSelect = (s: number) => {
    if (onTimerChange) onTimerChange(s);
    setLocalSeconds(s);
  };

  const toggleTimer = () => {
    if (externalTimer === 0 && !externalTimerActive) {
      if (onTimerChange) onTimerChange(localSeconds);
      if (onTimerActiveChange) onTimerActiveChange(true);
    } else {
      if (onTimerActiveChange) onTimerActiveChange(!externalTimerActive);
    }
  };

  const resetTimer = () => {
    if (onTimerActiveChange) onTimerActiveChange(false);
    if (onTimerChange) onTimerChange(localSeconds);
  };

  const adjustLocalSeconds = (amount: number) => {
    const newVal = Math.max(10, localSeconds + amount);
    setLocalSeconds(newVal);
    if (!externalTimerActive && onTimerChange) {
      onTimerChange(newVal);
    }
  };

  return (
    <div className="view-content animate-fade">
      <header className="header-pro">
        <div className="header-main">
          <div className="header-info">
            <span className="header-date">TITANIUM UX: WORKOUT TOOLS</span>
            <h1 className="header-title">TIMER</h1>
          </div>
          <div className="session-icon-pro" style={{ width: '60px', height: '60px' }}>
            <Timer size={32} />
          </div>
        </div>
      </header>

      <main className="main-scroll">
        <div className="chart-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div className="timer-display-main" style={{ marginBottom: '32px' }}>
            <div
              className="timer-large-val"
              style={{
                fontSize: '72px',
                fontWeight: 900,
                letterSpacing: '-2px',
                color: externalTimerActive ? 'var(--accent)' : '#fff',
              }}
            >
              {formatTime(externalTimerActive ? externalTimer : localSeconds)}
            </div>
            <span
              className="timer-status-label"
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              {externalTimerActive ? 'Recupero in corso...' : 'Pronto'}
            </span>
          </div>

          <div
            className="timer-controls-main"
            style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px' }}
          >
            <button
              className="pro-add-btn"
              style={{ width: '64px', height: '64px', borderRadius: '20px' }}
              onClick={resetTimer}
            >
              <RotateCcw size={24} />
            </button>
            <button
              className="log-btn-premium"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '24px',
                background: externalTimerActive ? 'var(--danger)' : 'var(--accent)',
              }}
              onClick={toggleTimer}
            >
              {externalTimerActive ? (
                <Pause size={32} color="#fff" fill="currentColor" />
              ) : (
                <Play size={32} color="#000" fill="currentColor" style={{ marginLeft: '4px' }} />
              )}
            </button>
            <button
              className="pro-add-btn"
              style={{ width: '64px', height: '64px', borderRadius: '20px' }}
              onClick={() => toast.success('Notifica sonora testata')}
            >
              <BellRing size={24} />
            </button>
          </div>

          {!externalTimerActive && (
            <div className="timer-settings-pro">
              <h3 className="pro-section-title" style={{ marginBottom: '20px' }}>
                Imposta Tempo
              </h3>

              <div
                className="quick-select-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '12px',
                  marginBottom: '24px',
                }}
              >
                {[60, 90, 120, 150, 180, 240].map((s) => (
                  <button
                    key={s}
                    className={`mini-stat ${localSeconds === s ? 'active' : ''}`}
                    style={{
                      justifyContent: 'center',
                      padding: '12px',
                      background: localSeconds === s ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                      color: localSeconds === s ? '#000' : 'var(--text-dim)',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleQuickSelect(s)}
                  >
                    {s}s
                  </button>
                ))}
              </div>

              <div
                className="fine-tune-controls"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '32px',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '16px',
                  borderRadius: '20px',
                }}
              >
                <button className="pro-add-btn" onClick={() => adjustLocalSeconds(-10)}>
                  <ChevronDown size={20} />
                </button>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: 'var(--text-dim)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Regola
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>±10s</div>
                </div>
                <button className="pro-add-btn" onClick={() => adjustLocalSeconds(10)}>
                  <ChevronUp size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="glass-nudge" style={{ marginTop: '24px' }}>
          <BellRing size={16} /> Il timer vibra e suona automaticamente al termine del riposo.
        </div>
      </main>
    </div>
  );
};
