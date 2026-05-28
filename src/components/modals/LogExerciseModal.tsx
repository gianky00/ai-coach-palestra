import { AnimatePresence, motion } from 'framer-motion';
import { Calculator, ChevronDown, ChevronUp, History, Info, Trophy, X } from 'lucide-react';
import { type FC } from 'react';

import { useLogExercise } from '../../hooks/useLogExercise';
import { getExerciseGuide } from '../../lib/exerciseAssets';
import { calculateE1RM } from '../../lib/utils';
import { soundService } from '../../services/soundService';
import type { Exercise } from '../../types';
import { BarbellVisualizer } from '../ui/BarbellVisualizer';

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
  const {
    currentExLogs,
    personalRecord,
    lastSessionLog,
    weight,
    setWeight,
    reps,
    setReps,
    rpe,
    setRpe,
    setType,
    setSetType,
    showPlateCalc,
    setShowPlateCalc,
    isSubmitting,
    showGuide,
    setShowGuide,
    imgSrc,
    setImageErrorExName,
    handleSaveLog,
    handleDeleteLog,
  } = useLogExercise({ user, selectedEx, activeSession, onSuccess });

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
          {/* Widget Guida Esecuzione & Foto Reale */}
          <div className="exercise-guide-container" style={{ marginBottom: '20px' }}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                soundService.playClick();
                setShowGuide(!showGuide);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--glass-border)',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={16} color="var(--accent)" />
                <span>Foto & Guida Esecuzione</span>
              </div>
              {showGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </motion.button>

            <AnimatePresence>
              {showGuide && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    {/* Contenitore Immagine Reale */}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '180px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <img
                        src={imgSrc}
                        alt={selectedEx.name}
                        onError={() => {
                          setImageErrorExName(selectedEx.name);
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '8px',
                          left: '8px',
                          background: 'rgba(0,0,0,0.6)',
                          backdropFilter: 'blur(4px)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 800,
                          color: 'var(--accent)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        {selectedEx.muscle_group.toUpperCase()}
                      </div>
                    </div>

                    {/* Consigli Posturali */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '11px',
                          fontWeight: 800,
                          color: 'var(--accent)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Istruzioni e Postura:
                      </h4>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: '16px',
                          fontSize: '12px',
                          color: 'var(--text-dim)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        {getExerciseGuide(selectedEx.name, selectedEx.muscle_group).map(
                          (tip, i) => (
                            <li key={i} style={{ lineHeight: '1.4' }}>
                              {tip}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvataggio...' : 'Salva Set'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
