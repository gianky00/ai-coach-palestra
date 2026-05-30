import { motion } from 'framer-motion';
import { type FC, useState } from 'react';

import { soundService } from '../../services/soundService';

interface BarbellVisualizerProps {
  totalWeight: number;
}

interface PlateConfig {
  weight: number;
  color: string;
  width: number;
  height: number;
}

const PLATES_CONFIG: PlateConfig[] = [
  { weight: 20, color: '#ff3b30', width: 14, height: 74 }, // Rosso
  { weight: 15, color: '#ffcc00', width: 13, height: 66 }, // Giallo
  { weight: 10, color: '#34c759', width: 12, height: 58 }, // Verde
  { weight: 5, color: '#007aff', width: 10, height: 50 }, // Blu
  { weight: 2.5, color: '#4a4a4c', width: 8, height: 42 }, // Nero/Antracite
  { weight: 1.25, color: '#8e8e93', width: 6, height: 34 }, // Grigio
];

export const BarbellVisualizer: FC<BarbellVisualizerProps> = ({ totalWeight }) => {
  const [barWeight, setBarWeight] = useState<number>(20);

  const calculatePlatesList = (total: number, bar: number): number[] => {
    let weightPerSide = (total - bar) / 2;
    if (weightPerSide <= 0) return [];

    const list: number[] = [];
    const availablePlates = [20, 15, 10, 5, 2.5, 1.25];

    for (const plate of availablePlates) {
      while (weightPerSide >= plate) {
        list.push(plate);
        weightPerSide -= plate;
      }
    }
    return list;
  };

  const plates = calculatePlatesList(totalWeight, barWeight);
  const weightPerSideVal = Math.max((totalWeight - barWeight) / 2, 0);

  // Calcola la larghezza totale dei dischi inseriti per posizionarli sul perno
  let currentX = 140; // Coordinata X iniziale del perno del bilanciere

  const handleBarToggle = (weight: number) => {
    soundService.playClick();
    setBarWeight(weight);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="barbell-visualizer"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '16px',
        marginTop: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        overflow: 'hidden',
      }}
    >
      <div
        className="barbell-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          fontSize: '11px',
          fontWeight: 800,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        <span>Caricamento per lato</span>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span>Bilanciere:</span>
          <button
            onClick={() => handleBarToggle(20)}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '10px',
              background: barWeight === 20 ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
              color: barWeight === 20 ? '#000' : '#fff',
              fontWeight: 800,
            }}
          >
            20kg
          </button>
          <button
            onClick={() => handleBarToggle(15)}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '10px',
              background: barWeight === 15 ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
              color: barWeight === 15 ? '#000' : '#fff',
              fontWeight: 800,
            }}
          >
            15kg
          </button>
        </div>
      </div>

      {/* SVG del Bilanciere */}
      <svg width="280" height="90" viewBox="0 0 280 90" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="bar-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a1a1a6" />
            <stop offset="50%" stopColor="#d1d1d6" />
            <stop offset="100%" stopColor="#8e8e93" />
          </linearGradient>
          <linearGradient id="sleeve-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8e8e93" />
            <stop offset="50%" stopColor="#c7c7cc" />
            <stop offset="100%" stopColor="#55555d" />
          </linearGradient>
        </defs>

        {/* Bilanciere - Barra Centrale Esterna */}
        <rect x="0" y="41" width="100" height="8" rx="2" fill="url(#bar-gradient)" />

        {/* Blocco Spalla Bilanciere */}
        <rect x="100" y="31" width="16" height="28" rx="2" fill="#3a3a3c" />

        {/* Manica/Sleeve (Perno porta dischi) */}
        <rect x="116" y="37" width="150" height="16" rx="1" fill="url(#sleeve-gradient)" />

        {/* Renderizzazione Dinamica dei Dischi */}
        {plates.map((plateWeight, index) => {
          const config = PLATES_CONFIG.find((p) => p.weight === plateWeight) || PLATES_CONFIG[5];
          const xPos = currentX;
          currentX += config.width + 2; // Spazio tra i dischi

          return (
            <motion.g
              key={index}
              initial={{ x: 120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{
                type: 'spring',
                damping: 14,
                stiffness: 100,
                delay: index * 0.08,
              }}
              style={{ originX: 0 }}
            >
              {/* Disco principale */}
              <rect
                x={xPos}
                y={45 - config.height / 2}
                width={config.width}
                height={config.height}
                rx="3"
                fill={config.color}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1"
              />
              {/* Ombreggiatura 3D sul disco */}
              <rect
                x={xPos}
                y={45 - config.height / 2}
                width={config.width / 2}
                height={config.height}
                fill="rgba(255,255,255,0.08)"
              />
              {/* Testo del Peso del Disco */}
              {config.height > 40 && (
                <text
                  x={xPos + config.width / 2}
                  y="48"
                  fill="rgba(255,255,255,0.8)"
                  fontSize="8"
                  fontWeight="900"
                  textAnchor="middle"
                  transform={`rotate(-90 ${xPos + config.width / 2} 45)`}
                >
                  {config.weight}
                </text>
              )}
            </motion.g>
          );
        })}

        {/* Collare di chiusura (se ci sono dischi) */}
        {plates.length > 0 && (
          <rect
            x={currentX + 2}
            y="35"
            width="8"
            height="20"
            rx="2"
            fill="#e5e5ea"
            stroke="#8e8e93"
            strokeWidth="1"
          />
        )}
      </svg>

      {/* Dettaglio testuale */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          width: '100%',
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>
          {weightPerSideVal.toLocaleString()} kg{' '}
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 500 }}>
            per lato
          </span>
        </span>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--accent)',
            fontWeight: 800,
            textTransform: 'uppercase',
          }}
        >
          {plates.length > 0 ? plates.map((w) => `${w}kg`).join(' + ') : 'Nessun disco necessario'}
        </span>
      </div>
    </motion.div>
  );
};
