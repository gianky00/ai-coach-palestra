import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Plus } from 'lucide-react';
import { type FC } from 'react';

import { getMuscleColor } from '../../lib/utils';
import type { Exercise } from '../../types';

export const ExerciseCard: FC<{ ex: Exercise; onLog: () => void; index: number }> = ({
  ex,
  onLog,
  index,
}) => {
  const color = getMuscleColor(ex.muscle_group, ex.notes);
  const isDone = (ex.sets_done || 0) >= ex.target_sets;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        boxShadow: isDone ? `0 0 20px ${color}33` : '0 4px 10px rgba(0,0,0,0.1)',
      }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.97 }}
      className={`ex-card-premium ${isDone ? 'completed glow-effect' : ''}`}
      style={{ '--ex-color': color } as React.CSSProperties}
    >
      <div className="ex-accent-bar" style={{ background: color }}></div>
      <div className="ex-content-premium">
        <div className="ex-header-premium">
          <span className="ex-group-premium" style={{ color: color }}>
            {ex.muscle_group}
          </span>
          <h3 className="ex-name-premium">{ex.name}</h3>
        </div>
        <div className="ex-stats-premium">
          <div className="ex-stat-item">
            <span className="ex-stat-label">Serie</span>
            <span className="ex-stat-val">
              <strong style={{ color: isDone ? 'var(--accent)' : '#fff' }}>
                {ex.sets_done || 0}
              </strong>
              /{ex.target_sets}
            </span>
          </div>
          <div className="ex-stat-item">
            <span className="ex-stat-label">Target</span>
            <span className="ex-stat-val">{ex.target_reps} reps</span>
          </div>
        </div>
      </div>
      <div className="ex-action-premium">
        <AnimatePresence mode="wait">
          {isDone ? (
            <motion.div
              key="done"
              initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              className="done-badge"
              style={{ background: color + '20', color: color }}
            >
              <CheckCircle2 size={24} />
            </motion.div>
          ) : (
            <motion.button
              key="add"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="log-btn-premium"
              onClick={onLog}
              style={{ background: color }}
            >
              <Plus size={24} color="#000" strokeWidth={3} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
