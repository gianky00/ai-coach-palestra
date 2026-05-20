import { motion } from 'framer-motion';
import { type FC } from 'react';

export const ProgressRing: FC<{ progress: number }> = ({ progress }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="progress-ring-container">
      <svg width="84" height="84" className="progress-ring">
        <circle
          className="progress-ring-bg"
          stroke="#1c1c1e"
          strokeWidth="8"
          fill="transparent"
          r={radius}
          cx="42"
          cy="42"
        />
        <motion.circle
          className="progress-ring-circle"
          stroke="var(--accent)"
          strokeWidth="8"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'circOut' }}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="42"
          cy="42"
        />
      </svg>
      <div className="progress-val-overlay">
        <motion.span
          key={progress}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="prog-percent"
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
    </div>
  );
};
