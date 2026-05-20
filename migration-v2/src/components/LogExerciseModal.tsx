import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { Calculator, History, Trophy, X } from 'lucide-react';
import { type FC, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { getOfflineLogsForExercise, removeOfflineLog, saveLogSafely } from '../lib/offlineSync';
import { calculateE1RM } from '../lib/utils';
import { logService } from '../services/logService';
import { soundService } from '../services/soundService';
import type { Exercise } from '../types';
import { BarbellVisualizer } from './BarbellVisualizer';

interface LogExerciseModalProps {
  user: { id: string } | null;
  selectedEx: Exercise;
  activeSession: string | null;
  onClose: () => void;
  onSuccess: (timerSecs?: number) => void;
}

export const LogExerciseModal: FC<LogExerciseModalProps> = ({
  user,
  selectedEx,
  activeSession,
  onClose,
  onSuccess,
}) => {
  const [currentExLogs, setCurrentExLogs] = useState<
    Array<{
      id?: string;
      tempId?: string;
      weight: number;
      reps: number;
      rpe: number;
      set_type?: 'W' | 'S' | 'F';
      exercise_id: string;
    }>
  >([]);
  const [personalRecord, setPersonalRecord] = useState<{ weight: number; reps: number } | null>(
    null,
  );
  const [lastSessionLog, setLastSessionLog] = useState<{
    weight: number;
    reps: number;
    created_at: string;
  } | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState(selectedEx.target_reps);
  const [rpe, setRpe] = useState('8');
  const [setType, setSetType] = useState<'W' | 'S' | 'F'>('S');
  const [showPlateCalc, setShowPlateCalc] = useState(false);

  const fetchInitialData = useCallback(async () => {
    const { data: todayLogs } = await logService.fetchTodayLogsForExercise(selectedEx.id);
    const offlineLogs = await getOfflineLogsForExercise(selectedEx.id);
    const allTodayLogs = todayLogs
      ? ([...todayLogs, ...offlineLogs] as Array<{
          id?: string;
          tempId?: string;
          weight: number;
          reps: number;
          rpe: number;
          set_type?: 'W' | 'S' | 'F';
          exercise_id: string;
        }>)
      : offlineLogs;
    setCurrentExLogs(allTodayLogs);

    const { data: pr } = await logService.fetchPersonalRecord(selectedEx.id);
    if (pr) setPersonalRecord(pr);

    const { data: lastLog } = await logService.fetchLastSessionLog(selectedEx.id);
    if (lastLog) {
      setLastSessionLog(lastLog as { weight: number; reps: number; created_at: string });
    }

    if (allTodayLogs.length > 0) {
      const lastSet = allTodayLogs[allTodayLogs.length - 1];
      setWeight(lastSet.weight.toString());
      setReps(lastSet.reps.toString());
    } else if (lastLog) {
      setWeight(lastLog.weight.toString());
      setReps(lastLog.reps.toString());
    } else if (pr) {
      setWeight(pr.weight.toString());
      setReps(pr.reps.toString());
    }
  }, [selectedEx]);

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
  }, [selectedEx, fetchInitialData]);

  const triggerCelebration = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 3000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const handleSaveLog = async () => {
    if (!user) return;
    soundService.playClick();
    const weightVal = parseFloat(weight);
    const repsVal = parseInt(reps);
    const rpeVal = parseInt(rpe);

    if (isNaN(weightVal) || weightVal < 0) {
      toast.error('Inserisci un peso valido');
      return;
    }
    if (isNaN(repsVal) || repsVal <= 0) {
      toast.error('Ripetizioni non valide');
      return;
    }

    const { error, isOffline } = await saveLogSafely({
      user_id: user.id,
      exercise_id: selectedEx.id,
      session_id: activeSession,
      weight: weightVal,
      reps: repsVal,
      rpe: rpeVal,
      set_type: setType,
    });

    if (error) {
      toast.error('Errore durante il salvataggio');
    } else {
      const isPR =
        !personalRecord ||
        weightVal > personalRecord.weight ||
        (weightVal === personalRecord.weight && repsVal > personalRecord.reps);

      if (isPR) {
        soundService.playSuccess();
        setTimeout(() => soundService.playSuccess(), 350);
        triggerCelebration();
        toast.success('🏆 NUOVO RECORD PERSONALE!', { icon: '🔥', duration: 4000 });
      } else {
        soundService.playSuccess();
        if (!isOffline) toast.success('Set salvato!');
      }

      onSuccess(selectedEx.rest_time || 90);
      fetchInitialData();
    }
  };

  const handleDeleteLog = async (id: string | undefined) => {
    if (!id) return;
    soundService.playClick();
    if (id.length > 20) {
      await removeOfflineLog(id);
      toast.success('Set offline rimosso');
      onSuccess();
      fetchInitialData();
      return;
    }

    if (!window.confirm('Vuoi eliminare questo set?')) return;
    soundService.playClick();
    const { error } = await logService.deleteLog(id);
    if (!error) {
      toast.success('Set eliminato');
      onSuccess();
      fetchInitialData();
    }
  };

  const setTypeLabels = { W: 'Warmup', S: 'Standard', F: 'Failure' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">{selectedEx.name}</h2>
            <span className="modal-subtitle">
              Target: {selectedEx.target_sets} serie da {selectedEx.target_reps}
            </span>
          </div>
          <button
            className="close-btn"
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div
            className="stats-hud-row"
            style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}
          >
            {personalRecord && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="pr-badge-inline"
                style={{
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Trophy size={12} color="#ffd700" />
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: '#ffd700',
                    textTransform: 'uppercase',
                  }}
                >
                  PR: {personalRecord.weight}kg x {personalRecord.reps}
                </span>
              </motion.div>
            )}
            {lastSessionLog && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="pr-badge-inline"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--glass-border)',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <History size={12} color="var(--text-dim)" />
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                  }}
                >
                  Last: {lastSessionLog.weight}kg x {lastSessionLog.reps}
                </span>
              </motion.div>
            )}
          </div>

          <div
            className="set-type-selector"
            style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}
          >
            {(['W', 'S', 'F'] as const).map((type) => (
              <motion.button
                whileTap={{ scale: 0.95 }}
                key={type}
                onClick={() => {
                  soundService.playClick();
                  setSetType(type);
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 800,
                  background: setType === type ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                  color: setType === type ? '#000' : 'var(--text-dim)',
                  border: '1px solid ' + (setType === type ? 'var(--accent)' : 'transparent'),
                }}
              >
                {setTypeLabels[type]}
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {currentExLogs.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="current-logs-list"
                style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '20px' }}
              >
                {currentExLogs.map((log, idx) => (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    key={log.id || log.tempId}
                    className="log-item-row"
                  >
                    <div
                      className="log-idx"
                      style={{
                        background:
                          log.set_type === 'W'
                            ? '#555'
                            : log.set_type === 'F'
                              ? 'var(--danger)'
                              : 'var(--accent)',
                        color: log.set_type === 'S' ? '#000' : '#fff',
                      }}
                    >
                      {log.set_type || idx + 1}
                    </div>
                    <div className="log-vals">
                      <strong>{log.weight} kg</strong> x {log.reps}
                      <span className="log-rpe">RPE {log.rpe}</span>
                    </div>
                    <div className="log-e1rm">e1RM: {calculateE1RM(log.weight, log.reps)}kg</div>
                    <button
                      className="delete-log-btn"
                      onClick={() => handleDeleteLog(log.id || log.tempId)}
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="new-log-form">
            <div className="input-row">
              <div className="input-group">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <label style={{ marginBottom: 0 }}>Peso (kg)</label>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowPlateCalc(!showPlateCalc)}
                    style={{
                      background: 'transparent',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      fontWeight: 800,
                    }}
                  >
                    <Calculator size={12} /> DISCHI
                  </motion.button>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  autoFocus
                  placeholder="0"
                />
                <AnimatePresence>
                  {showPlateCalc && weight && (
                    <BarbellVisualizer totalWeight={parseFloat(weight) || 0} />
                  )}
                </AnimatePresence>
              </div>
              <div className="input-group">
                <label>Ripetizioni</label>
                <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} />
              </div>
            </div>
            <div className="input-group">
              <label>Sforzo (RPE 1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="save-btn"
              onClick={handleSaveLog}
            >
              Salva Set
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
