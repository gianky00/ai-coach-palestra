import { motion } from 'framer-motion';
import { Calendar, Cpu, GitBranch, Info, X } from 'lucide-react';
import { type FC } from 'react';

import changelogData from '../config/changelog.json';

interface ReleaseNotesModalProps {
  onClose: () => void;
}

interface ChangelogRelease {
  version: string;
  date: string;
  notes: string[];
}

export const ReleaseNotesModal: FC<ReleaseNotesModalProps> = ({ onClose }) => {
  const currentVersion = import.meta.env.APP_VERSION || '2.0.0';
  const gitSha = import.meta.env.APP_GIT_SHA || 'dev';
  const buildDate = import.meta.env.APP_BUILD_DATE || 'N/A';
  const mode = import.meta.env.MODE || 'production';

  // Mappa dei badge per l'ambiente diagnostico
  const getEnvBadge = () => {
    switch (mode) {
      case 'development':
        return (
          <span
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 700,
            }}
          >
            DEV
          </span>
        );
      case 'test':
      case 'preview':
        return (
          <span
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 700,
            }}
          >
            PREVIEW
          </span>
        );
      case 'production':
      default:
        return (
          <span
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 700,
            }}
          >
            PROD
          </span>
        );
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '500px',
          background: '#0d0d0f',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          boxShadow: '0 24px 50px rgba(0,0,0,0.6)',
          padding: '24px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Pulsante di Chiusura */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.04)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = 'var(--text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            e.currentTarget.style.color = 'var(--text-dim)';
          }}
        >
          <X size={18} />
        </button>

        {/* Testata */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--accent) 0%, #00ccff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(0, 255, 136, 0.25)',
            }}
          >
            <Cpu size={22} color="#000000" />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              Note di Rilascio
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              KineFit Diagnostica e Release History
            </span>
          </div>
        </div>

        {/* Scheda Diagnostica Enterprise */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '20px',
            fontSize: '12px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px 16px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span
                style={{
                  color: 'var(--text-dim)',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Versione
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  color: '#ffffff',
                }}
              >
                v{currentVersion}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span
                style={{
                  color: 'var(--text-dim)',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Ambiente
              </span>
              <div style={{ display: 'flex', alignItems: 'center' }}>{getEnvBadge()}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span
                style={{
                  color: 'var(--text-dim)',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Commit SHA
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'monospace',
                  color: 'var(--text-dim)',
                  fontWeight: 600,
                }}
              >
                <GitBranch size={12} color="var(--accent)" />
                {gitSha}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span
                style={{
                  color: 'var(--text-dim)',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Data di Build
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-dim)',
                }}
              >
                <Calendar size={12} color="var(--accent)" />
                {buildDate}
              </div>
            </div>
          </div>
        </div>

        {/* Storico dei Rilasci (Changelog Scrollable) */}
        <h4
          style={{
            fontSize: '12px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'var(--accent)',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Info size={14} /> Registro Storico Rilasci
        </h4>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
          className="changelog-scroll"
        >
          {(changelogData as ChangelogRelease[]).map((release, i) => (
            <div
              key={release.version}
              style={{
                position: 'relative',
                paddingLeft: '16px',
                borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {/* Indicatore visivo del rilascio corrente vs passati */}
              <div
                style={{
                  position: 'absolute',
                  left: '-4px',
                  top: '4px',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: i === 0 ? 'var(--accent)' : 'rgba(255, 255, 255, 0.2)',
                  boxShadow: i === 0 ? '0 0 8px var(--accent)' : 'none',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: i === 0 ? '#ffffff' : 'var(--text-dim)',
                  }}
                >
                  v{release.version}
                  {i === 0 && (
                    <span
                      style={{
                        marginLeft: '8px',
                        fontSize: '9px',
                        background: 'rgba(0, 255, 136, 0.12)',
                        color: 'var(--accent)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: 600,
                      }}
                    >
                      Attuale
                    </span>
                  )}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{release.date}</span>
              </div>

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
                {release.notes.map((note, idx) => (
                  <li key={idx} style={{ lineHeight: '1.4' }}>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer del Modale */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            marginTop: '20px',
            paddingTop: '16px',
            textAlign: 'center',
          }}
        >
          <button
            className="save-btn"
            onClick={onClose}
            style={{
              width: '100%',
              margin: 0,
              padding: '12px 24px',
              borderRadius: '16px',
              fontWeight: 700,
            }}
          >
            Chiudi Finestra
          </button>
        </div>
      </motion.div>
    </div>
  );
};
