import { AnimatePresence, motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { type FC, useEffect, useState } from 'react';

import { getMuscleColor } from '../lib/utils';
import { logService } from '../services/logService';
import type { WeeklyMuscleVolumeLog } from '../types';
import { HeatmapSkeleton } from './Skeleton';

interface MuscleVolume {
  group: string;
  volume: number;
  intensity: number; // 0 to 1
}

export const MuscleHeatmap: FC = () => {
  const [data, setData] = useState<MuscleVolume[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="section-title-row" style={{ marginBottom: '20px' }}>
        <h2 className="pro-section-title" style={{ fontSize: '11px' }}>
          Heatmap Settimanale
        </h2>
        <Activity size={14} color="var(--accent)" />
      </div>

      <div
        className="heatmap-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}
      >
        <AnimatePresence mode="popLayout">
          {data.length > 0 ? (
            data.map((item, idx) => {
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
            })
          ) : (
            <div
              style={{
                gridColumn: 'span 2',
                textAlign: 'center',
                padding: '20px',
                color: 'var(--text-dim)',
                fontSize: '12px',
              }}
            >
              Nessun dato negli ultimi 7 giorni
            </div>
          )}
        </AnimatePresence>
      </div>

      <div
        style={{
          marginTop: '16px',
          fontSize: '10px',
          color: 'var(--text-dim)',
          textAlign: 'center',
          fontStyle: 'italic',
        }}
      >
        L'intensità del colore indica il volume relativo rispetto agli altri muscoli.
      </div>
    </motion.div>
  );
};
