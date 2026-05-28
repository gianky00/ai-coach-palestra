import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Share2, Trophy, Weight } from 'lucide-react';
import { type FC, useEffect } from 'react';

interface WorkoutSummaryModalProps {
  summary: {
    totalVolume: number;
    setsDone: number;
    durationMins: number;
    prsCount: number;
  };
  onClose: () => void;
}

export const WorkoutSummaryModal: FC<WorkoutSummaryModalProps> = ({ summary, onClose }) => {
  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00ff88', '#ffffff', '#00ccff'],
    });
  }, []);

  return (
    <div
      className="modal-overlay"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="modal-content"
        style={{ textAlign: 'center', border: '1px solid var(--accent)' }}
      >
        <div className="modal-header" style={{ justifyContent: 'center' }}>
          <h2 className="modal-title" style={{ color: 'var(--accent)' }}>
            Ottimo Lavoro!
          </h2>
        </div>

        <div className="summary-body" style={{ padding: '20px 0' }}>
          <div className="trophy-container" style={{ marginBottom: '32px' }}>
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Trophy
                size={80}
                color="var(--accent)"
                style={{ filter: 'drop-shadow(0 0 20px var(--accent)55)' }}
              />
            </motion.div>
          </div>

          <div
            className="summary-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '40px',
            }}
          >
            <div
              className="summary-item"
              style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '16px',
                borderRadius: '20px',
                border: '1px solid var(--glass-border)',
              }}
            >
              <Weight size={20} color="var(--accent)" style={{ marginBottom: '8px' }} />
              <div
                style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}
              >
                Volume
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900 }}>
                {summary.totalVolume.toLocaleString()}{' '}
                <small style={{ fontSize: '10px' }}>kg</small>
              </div>
            </div>
            <div
              className="summary-item"
              style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '16px',
                borderRadius: '20px',
                border: '1px solid var(--glass-border)',
              }}
            >
              <CheckCircle2 size={20} color="var(--accent)" style={{ marginBottom: '8px' }} />
              <div
                style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}
              >
                Serie
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900 }}>{summary.setsDone}</div>
            </div>
            <div
              className="summary-item"
              style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '16px',
                borderRadius: '20px',
                border: '1px solid var(--glass-border)',
              }}
            >
              <Clock size={20} color="var(--accent)" style={{ marginBottom: '8px' }} />
              <div
                style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}
              >
                Durata
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900 }}>
                {summary.durationMins} <small style={{ fontSize: '10px' }}>min</small>
              </div>
            </div>
            <div
              className="summary-item"
              style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '16px',
                borderRadius: '20px',
                border: '1px solid var(--glass-border)',
              }}
            >
              <Trophy size={20} color="#ffd700" style={{ marginBottom: '8px' }} />
              <div
                style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}
              >
                Records
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900 }}>{summary.prsCount}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="save-btn" onClick={onClose} style={{ flex: 2 }}>
              Chiudi
            </button>
            <button
              className="pro-add-btn"
              style={{ width: '60px', height: '60px', borderRadius: '20px', marginTop: '12px' }}
            >
              <Share2 size={24} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
