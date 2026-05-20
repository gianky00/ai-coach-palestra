import { AnimatePresence, motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { type FC, useEffect, useState } from 'react';

import { getMuscleColor } from '../lib/utils';
import { logService } from '../services/logService';
import { soundService } from '../services/soundService';
import type { WeeklyMuscleVolumeLog } from '../types';
import { InteractiveMuscleHeatmap } from './InteractiveMuscleHeatmap';
import { HeatmapSkeleton } from './Skeleton';

interface MuscleVolume {
  group: string;
  volume: number;
  intensity: number; // 0 to 1
}

export const MuscleHeatmap: FC = () => {
  const [data, setData] = useState<MuscleVolume[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'body' | 'grid'>('body');

  const loadHeatmapData = async () => {
    const { data: logs } = await logService.fetchWeeklyVolumeByMuscle();

    if (logs) {
      const volumeMap: Record<string, number> = {};
      (logs as unknown as WeeklyMuscleVolumeLog[]).forEach((l) => {
        const group = l.exercises?.muscle_group || 'Sconosciuto';
        const vol = l.weight * l.reps;
        volumeMap[group] = (volumeMap[group] || 0) + vol;
      });

      const maxVol = Math.max(...Object.values(volumeMap), 1);

      const formatted: MuscleVolume[] = Object.entries(volumeMap)
        .map(([group, volume]) => ({
          group,
          volume,
          intensity: volume / maxVol,
        }))
        .sort((a, b) => b.volume - a.volume);

      setData(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) {
        loadHeatmapData();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <HeatmapSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="chart-card heatmap-card"
      style={{ marginTop: '24px' }}
    >
      <div
        className="section-title-row"
        style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 className="pro-section-title" style={{ fontSize: '11px', margin: 0 }}>
            Heatmap Settimanale
          </h2>
          <Activity size={14} color="var(--accent)" />
        </div>

        {data.length > 0 && (
          /* Selettore Vista Premium */
          <div
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              padding: '2px',
            }}
          >
            <button
              onClick={() => {
                soundService.playClick();
                setViewType('body');
              }}
              style={{
                padding: '4px 10px',
                borderRadius: '18px',
                fontSize: '10px',
                fontWeight: 800,
                background: viewType === 'body' ? 'var(--accent)' : 'transparent',
                color: viewType === 'body' ? '#000' : 'var(--text-dim)',
                transition: 'all 0.2s',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Corpo
            </button>
            <button
              onClick={() => {
                soundService.playClick();
                setViewType('grid');
              }}
              style={{
                padding: '4px 10px',
                borderRadius: '18px',
                fontSize: '10px',
                fontWeight: 800,
                background: viewType === 'grid' ? 'var(--accent)' : 'transparent',
                color: viewType === 'grid' ? '#000' : 'var(--text-dim)',
                transition: 'all 0.2s',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Griglia
            </button>
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-dim)',
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.01)',
            borderRadius: '16px',
            border: '1px dashed var(--glass-border)',
          }}
        >
          <Activity size={24} style={{ opacity: 0.3, marginBottom: '4px' }} />
          <span>Nessun dato negli ultimi 7 giorni</span>
          <span style={{ fontSize: '10px', opacity: 0.5 }}>Allenati per sbloccare la mappa corporea 3D</span>
        </div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            {viewType === 'body' ? (
              <motion.div
                key="body-view"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                style={{ width: '100%' }}
              >
                <InteractiveMuscleHeatmap data={data} />
              </motion.div>
            ) : (
              <motion.div
                key="grid-view"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="heatmap-grid"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}
              >
                {data.map((item, idx) => {
                  const baseColor = getMuscleColor(item.group);
                  return (
                    <motion.div
                      key={item.group}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="heatmap-item"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        padding: '12px',
                        borderRadius: '16px',
                        border: '1px solid var(--glass-border)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <motion.div
                        className="heatmap-fill"
                        initial={{ height: 0 }}
                        animate={{ height: `${item.intensity * 100}%` }}
                        transition={{ duration: 1.5, ease: 'easeOut', delay: idx * 0.1 }}
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: baseColor,
                          opacity: 0.15,
                        }}
                      />
                      <div className="heatmap-content" style={{ position: 'relative', zIndex: 1 }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            color: baseColor,
                            display: 'block',
                            marginBottom: '4px',
                          }}
                        >
                          {item.group}
                        </span>
                        <span style={{ fontSize: '16px', fontWeight: 900, color: '#fff' }}>
                          {item.volume.toLocaleString()}{' '}
                          <small style={{ fontSize: '9px', color: 'var(--text-dim)' }}>kg</small>
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <div
            style={{
              marginTop: '16px',
              fontSize: '10px',
              color: 'var(--text-dim)',
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            {viewType === 'body'
              ? "I colori mostrano l'intensità del volume settimanale accumulato sui singoli distretti muscolari."
              : "L'intensità del colore indica il volume relativo rispetto agli altri muscoli."}
          </div>
        </>
      )}
    </motion.div>
  );
};
