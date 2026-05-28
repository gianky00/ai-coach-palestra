import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Dumbbell, Info, Play, Plus, Square, Weight } from 'lucide-react';
import { type FC } from 'react';

import { DAYS } from '../../lib/utils';
import type { Exercise } from '../../types';
import { ExerciseCard } from '../ui/ExerciseCard';
import { MuscleHeatmap } from '../ui/MuscleHeatmap';
import { ProgressRing } from '../ui/ProgressRing';
import { ExerciseCardSkeleton } from '../ui/Skeleton';

interface OggiViewProps {
  exercises: Exercise[];
  loading: boolean;
  totalVolume: number;
  progresso: number;
  setProgress?: number;
  volumeProgress?: number;
  activeSession: string | null;
  startWorkout: () => void;
  endWorkout: () => void;
  setShowAddEx: (s: boolean) => void;
  setSelectedEx: (e: Exercise) => void;
}

export const OggiView: FC<OggiViewProps> = ({
  exercises,
  loading,
  totalVolume,
  progresso,
  setProgress = 0,
  volumeProgress = 0,
  activeSession,
  startWorkout,
  endWorkout,
  setShowAddEx,
  setSelectedEx,
}) => {
  const gymExercises = exercises.filter((ex) => ex.notes !== 'COMPEX');
  const compexExercises = exercises.filter((ex) => ex.notes === 'COMPEX');

  return (
    <div className="view-content">
      <header className="header-pro">
        <div className="header-main">
          <div className="header-info">
            <span className="header-date">
              {DAYS[new Date().getDay()]} {new Date().toLocaleDateString('it-IT')}
            </span>
            <h1 className="header-title">TRAINING</h1>
          </div>
          <ProgressRing
            progress={progresso}
            progressMiddle={setProgress}
            progressInner={volumeProgress}
          />
        </div>

        <div className="header-stats-strip">
          <div className="mini-stat">
            <Weight size={14} /> <span>{totalVolume.toLocaleString()} kg</span>
          </div>
          <div className="mini-stat">
            <Activity size={14} /> <span>{exercises.length} esercizi</span>
          </div>
          <div className="spacer"></div>
          {!activeSession ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="pro-start-btn"
              onClick={startWorkout}
            >
              <Play size={16} fill="currentColor" /> START
            </motion.button>
          ) : (
            <motion.button whileTap={{ scale: 0.95 }} className="pro-end-btn" onClick={endWorkout}>
              <Square size={14} fill="currentColor" /> STOP
            </motion.button>
          )}
        </div>
      </header>

      <main className="main-scroll">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="exercises-grid-premium"
            >
              {[1, 2, 3, 4].map((i) => (
                <ExerciseCardSkeleton key={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {!activeSession && exercises.length > 0 && (
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="glass-nudge"
                >
                  <Info size={16} /> Pronti per la sessione? Clicca su Start!
                </motion.div>
              )}

              {gymExercises.length > 0 && (
                <section className="exercise-section">
                  <div className="section-title-row">
                    <h2 className="pro-section-title">Palestra</h2>
                    <motion.button
                      whileHover={{ rotate: 90 }}
                      whileTap={{ scale: 0.8 }}
                      className="pro-add-btn"
                      onClick={() => setShowAddEx(true)}
                    >
                      <Plus size={18} />
                    </motion.button>
                  </div>
                  <div className="exercises-grid-premium">
                    {gymExercises.map((ex, idx) => (
                      <ExerciseCard
                        key={ex.id}
                        ex={ex}
                        index={idx}
                        onLog={() => setSelectedEx(ex)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {compexExercises.length > 0 && (
                <section className="exercise-section" style={{ marginTop: '32px' }}>
                  <h2 className="pro-section-title" style={{ color: 'var(--color-compex)' }}>
                    Compex
                  </h2>
                  <div className="exercises-grid-premium">
                    {compexExercises.map((ex, idx) => (
                      <ExerciseCard
                        key={ex.id}
                        ex={ex}
                        index={idx}
                        onLog={() => setSelectedEx(ex)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {exercises.length === 0 && (
                <div className="empty-state-pro">
                  <Dumbbell size={64} className="icon-pulse" />
                  <p>
                    Nessun esercizio pianificato.
                    <br />
                    Aggiungi un movimento per iniziare.
                  </p>
                  <button
                    className="save-btn"
                    onClick={() => setShowAddEx(true)}
                    style={{ width: 'auto', padding: '12px 32px' }}
                  >
                    Aggiungi
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <MuscleHeatmap />
      </main>
    </div>
  );
};
