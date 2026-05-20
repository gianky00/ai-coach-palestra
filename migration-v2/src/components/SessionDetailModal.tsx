import { motion } from 'framer-motion';
import { Dumbbell, X } from 'lucide-react';
import { type FC, useEffect, useState } from 'react';

import { sessionService } from '../services/sessionService';
import type { SessionLogDetail } from '../types';

interface SessionDetailModalProps {
  sessionId: string;
  sessionDate: string;
  onClose: () => void;
}

export const SessionDetailModal: FC<SessionDetailModalProps> = ({
  sessionId,
  sessionDate,
  onClose,
}) => {
  const [details, setDetails] = useState<SessionLogDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      const { data } = await sessionService.fetchSessionDetails(sessionId);
      if (data) setDetails(data as unknown as SessionLogDetail[]);
      setLoading(false);
    };

    loadDetails();
  }, [sessionId]);

  // Group logs by exercise
  const exercisesMap: Record<string, SessionLogDetail[]> = {};
  details.forEach((log) => {
    const name = log.exercises?.name || 'Sconosciuto';
    if (!exercisesMap[name]) exercisesMap[name] = [];
    exercisesMap[name].push(log);
  });

  return (
    <div className="modal-overlay">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="modal-content"
        style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">Allenamento</h2>
            <span className="modal-subtitle">{sessionDate}</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body main-scroll" style={{ flex: 1, paddingBottom: '40px' }}>
          {loading ? (
            <div className="loader-container">Analisi sessione...</div>
          ) : (
            Object.entries(exercisesMap).map(([name, logs]) => (
              <div key={name} className="detail-exercise-group" style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <Dumbbell size={16} color="var(--accent)" />
                  <h3 style={{ fontSize: '15px', fontWeight: 800 }}>{name}</h3>
                </div>
                <div
                  className="detail-logs-list"
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  {logs.map((log, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        padding: '12px 16px',
                        borderRadius: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid var(--glass-border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span
                          style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 800 }}
                        >
                          SET {idx + 1}
                        </span>
                        <span style={{ fontWeight: 700 }}>
                          {log.weight}kg <span style={{ color: 'var(--text-dim)' }}>x</span>{' '}
                          {log.reps}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: 'var(--accent)',
                          background: 'var(--accent-soft)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        RPE {log.rpe}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};
