import { motion } from 'framer-motion';
import { type FC } from 'react';

interface ProgressRingProps {
  progress: number;       // Anello Esterno (Esercizi Completati)
  progressMiddle?: number; // Anello Centrale (Set Completati)
  progressInner?: number;  // Anello Interno (Volume Accumulato)
}

export const ProgressRing: FC<ProgressRingProps> = ({
  progress,
  progressMiddle = 0,
  progressInner = 0,
}) => {
  // Configurazione Anello Esterno (Verde Neon)
  const radiusOuter = 35;
  const circOuter = 2 * Math.PI * radiusOuter;
  const offsetOuter = circOuter - (Math.min(progress, 100) / 100) * circOuter;

  // Configurazione Anello Centrale (Fucsia/Spalle)
  const radiusMiddle = 27;
  const circMiddle = 2 * Math.PI * radiusMiddle;
  const offsetMiddle = circMiddle - (Math.min(progressMiddle, 100) / 100) * circMiddle;

  // Configurazione Anello Interno (Azzurro/Info)
  const radiusInner = 19;
  const circInner = 2 * Math.PI * radiusInner;
  const offsetInner = circInner - (Math.min(progressInner, 100) / 100) * circInner;

  const hasMultipleRings = progressMiddle > 0 || progressInner > 0;

  return (
    <div className="progress-ring-container" style={{ position: 'relative', width: '84px', height: '84px' }}>
      <svg width="84" height="84" className="progress-ring">
        {/* === ANELLO ESTERNO (Esercizi) === */}
        <circle
          className="progress-ring-bg"
          stroke="rgba(0, 255, 136, 0.05)"
          strokeWidth="5"
          fill="transparent"
          r={radiusOuter}
          cx="42"
          cy="42"
        />
        <motion.circle
          className="progress-ring-circle"
          stroke="var(--accent)"
          strokeWidth="5"
          strokeDasharray={circOuter}
          initial={{ strokeDashoffset: circOuter }}
          animate={{ strokeDashoffset: offsetOuter }}
          transition={{ duration: 1.2, ease: 'circOut' }}
          strokeLinecap="round"
          fill="transparent"
          r={radiusOuter}
          cx="42"
          cy="42"
          transform="rotate(-90 42 42)"
          style={{ filter: 'drop-shadow(0 0 2px rgba(0, 255, 136, 0.3))' }}
        />

        {/* === ANELLO CENTRALE (Set) === */}
        {hasMultipleRings && (
          <>
            <circle
              className="progress-ring-bg"
              stroke="rgba(175, 82, 222, 0.05)"
              strokeWidth="5"
              fill="transparent"
              r={radiusMiddle}
              cx="42"
              cy="42"
            />
            <motion.circle
              className="progress-ring-circle"
              stroke="var(--color-spalle)"
              strokeWidth="5"
              strokeDasharray={circMiddle}
              initial={{ strokeDashoffset: circMiddle }}
              animate={{ strokeDashoffset: offsetMiddle }}
              transition={{ duration: 1.2, ease: 'circOut', delay: 0.1 }}
              strokeLinecap="round"
              fill="transparent"
              r={radiusMiddle}
              cx="42"
              cy="42"
              transform="rotate(-90 42 42)"
              style={{ filter: 'drop-shadow(0 0 2px rgba(175, 82, 222, 0.3))' }}
            />
          </>
        )}

        {/* === ANELLO INTERNO (Volume) === */}
        {hasMultipleRings && (
          <>
            <circle
              className="progress-ring-bg"
              stroke="rgba(10, 132, 255, 0.05)"
              strokeWidth="5"
              fill="transparent"
              r={radiusInner}
              cx="42"
              cy="42"
            />
            <motion.circle
              className="progress-ring-circle"
              stroke="var(--info)"
              strokeWidth="5"
              strokeDasharray={circInner}
              initial={{ strokeDashoffset: circInner }}
              animate={{ strokeDashoffset: offsetInner }}
              transition={{ duration: 1.2, ease: 'circOut', delay: 0.2 }}
              strokeLinecap="round"
              fill="transparent"
              r={radiusInner}
              cx="42"
              cy="42"
              transform="rotate(-90 42 42)"
              style={{ filter: 'drop-shadow(0 0 2px rgba(10, 132, 255, 0.3))' }}
            />
          </>
        )}
      </svg>
      
      {/* Testo in sovrapposizione al centro */}
      <div className="progress-val-overlay" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.span
          key={progress}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="prog-percent"
          style={{ fontSize: hasMultipleRings ? '12px' : '15px', fontWeight: 900, color: '#fff' }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
    </div>
  );
};
