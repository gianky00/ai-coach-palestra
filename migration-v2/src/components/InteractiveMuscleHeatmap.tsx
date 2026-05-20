import { motion } from 'framer-motion';
import { type FC, useState } from 'react';

import { getMuscleColor } from '../lib/utils';
import { soundService } from '../services/soundService';

interface MuscleVolume {
  group: string;
  volume: number;
  intensity: number;
}

interface InteractiveMuscleHeatmapProps {
  data: MuscleVolume[];
}

export const InteractiveMuscleHeatmap: FC<InteractiveMuscleHeatmapProps> = ({ data }) => {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  // Mappa dei gruppi muscolari del db a quelli SVG
  const getVolumeDataForGroup = (groupName: string): MuscleVolume => {
    const gNormalized = groupName.toLowerCase();
    const found = data.find((d) => {
      const dbGroup = d.group.toLowerCase();
      if (gNormalized === 'petto' && dbGroup.includes('petto')) return true;
      if (gNormalized === 'dorso' && (dbGroup.includes('dorso') || dbGroup.includes('schiena')))
        return true;
      if (
        gNormalized === 'gambe' &&
        (dbGroup.includes('gambe') || dbGroup.includes('quad') || dbGroup.includes('femor'))
      )
        return true;
      if (gNormalized === 'spalle' && (dbGroup.includes('spalle') || dbGroup.includes('delto')))
        return true;
      if (
        gNormalized === 'braccia' &&
        (dbGroup.includes('braccia') || dbGroup.includes('bici') || dbGroup.includes('trici'))
      )
        return true;
      if (gNormalized === 'core' && (dbGroup.includes('core') || dbGroup.includes('addo')))
        return true;
      return false;
    });

    return found || { group: groupName, volume: 0, intensity: 0 };
  };

  const handleMouseEnter = (group: string) => {
    soundService.playClick();
    setHoveredGroup(group);
  };

  const handleMouseLeave = () => {
    setHoveredGroup(null);
  };

  // Renderizza un singolo muscolo con effetti hover e colori dinamici
  const renderMusclePath = (
    groupKey: string,
    paths: string[],
    isCircle = false,
    circleProps = {},
  ) => {
    const groupData = getVolumeDataForGroup(groupKey);
    const color = getMuscleColor(groupKey);
    const isHovered = hoveredGroup === groupKey;

    // Intensità del colore di riempimento: minimo 0.1 per dare un'idea della silhouette se a 0, massimo 0.9
    const fillOpacity = 0.1 + groupData.intensity * 0.8;

    return (
      <motion.g
        onMouseEnter={() => handleMouseEnter(groupKey)}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'pointer' }}
        animate={{
          filter: isHovered
            ? `drop-shadow(0px 0px 8px ${color})`
            : 'drop-shadow(0px 0px 0px transparent)',
        }}
        transition={{ duration: 0.2 }}
      >
        {isCircle ? (
          <circle
            {...circleProps}
            fill={color}
            fillOpacity={fillOpacity}
            stroke={isHovered ? '#ffffff' : 'rgba(255,255,255,0.15)'}
            strokeWidth={isHovered ? 1.5 : 1}
            style={{ transition: 'fill-opacity 0.3s, fill 0.3s' }}
          />
        ) : (
          paths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill={color}
              fillOpacity={fillOpacity}
              stroke={isHovered ? '#ffffff' : 'rgba(255,255,255,0.15)'}
              strokeWidth={isHovered ? 1.5 : 1}
              strokeLinejoin="round"
              style={{ transition: 'fill-opacity 0.3s, fill 0.3s' }}
            />
          ))
        )}
      </motion.g>
    );
  };

  const hoveredData = hoveredGroup ? getVolumeDataForGroup(hoveredGroup) : null;

  return (
    <div
      className="interactive-heatmap-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '8px',
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Vista Anteriore e Posteriore affiancate */}
      <div
        className="heatmap-svg-row"
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '32px',
          width: '100%',
          maxWidth: '360px',
        }}
      >
        {/* VISTA ANTERIORE */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
            }}
          >
            Anteriore
          </span>
          <svg width="130" height="240" viewBox="0 0 120 220" style={{ overflow: 'visible' }}>
            {/* Silhouette di Sfondo (Contorno Corpo Generico) */}
            <path
              d="M 60,8 C 45,8 45,30 35,45 C 20,48 12,65 14,100 C 15,115 25,120 28,125 C 24,155 23,190 28,212 C 30,215 36,215 38,212 C 40,195 44,155 45,135 C 50,132 55,135 60,135 C 65,135 70,132 75,135 C 76,155 80,195 82,212 C 84,215 90,215 92,212 C 97,190 96,155 92,125 C 95,120 105,115 106,100 C 108,65 100,48 85,45 C 75,30 75,8 60,8 Z"
              fill="rgba(255, 255, 255, 0.02)"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />

            {/* Testa */}
            <circle
              cx="60"
              cy="22"
              r="10"
              fill="rgba(255,255,255,0.06)"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
            />

            {/* Collo */}
            <path
              d="M 56,31 L 64,31 L 63,38 L 57,38 Z"
              fill="rgba(255,255,255,0.06)"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
            />

            {/* SPALLE */}
            {renderMusclePath('Spalle', [
              'M 38,40 C 30,40 24,45 24,55 C 24,59 28,62 33,60 Z', // Spalla Sinistra
              'M 82,40 C 90,40 96,45 96,55 C 96,59 92,62 87,60 Z', // Spalla Destra
            ])}

            {/* PETTO */}
            {renderMusclePath('Petto', [
              'M 59,44 L 38,44 C 37,56 42,66 59,68 Z', // Petto Sinistro
              'M 61,44 L 82,44 C 83,56 78,66 61,68 Z', // Petto Destro
            ])}

            {/* BRACCIA (Bicipiti / Avambracci anteriori) */}
            {renderMusclePath('Braccia', [
              'M 23,56 L 15,90 C 14,94 18,97 22,95 L 29,62 Z', // Braccio Sinistro
              'M 97,56 L 105,90 C 106,94 102,97 98,95 L 91,62 Z', // Braccio Destro
            ])}

            {/* CORE (Addominali / Obliqui) */}
            {renderMusclePath('Core', ['M 40,70 L 80,70 L 76,112 L 44,112 Z'])}

            {/* GAMBE (Quadricipiti) */}
            {renderMusclePath('Gambe', [
              'M 27,116 L 52,116 C 51,145 47,175 42,205 C 38,207 33,207 33,205 C 29,175 27,145 27,116 Z', // Quadricipite Sinistro
              'M 93,116 L 68,116 C 69,145 73,175 78,205 C 82,207 87,207 87,205 C 91,175 93,145 93,116 Z', // Quadricipite Destro
            ])}
          </svg>
        </div>

        {/* VISTA POSTERIORE */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
            }}
          >
            Posteriore
          </span>
          <svg width="130" height="240" viewBox="0 0 120 220" style={{ overflow: 'visible' }}>
            {/* Silhouette di Sfondo (Contorno Corpo Generico) */}
            <path
              d="M 60,8 C 45,8 45,30 35,45 C 20,48 12,65 14,100 C 15,115 25,120 28,125 C 24,155 23,190 28,212 C 30,215 36,215 38,212 C 40,195 44,155 45,135 C 50,132 55,135 60,135 C 65,135 70,132 75,135 C 76,155 80,195 82,212 C 84,215 90,215 92,212 C 97,190 96,155 92,125 C 95,120 105,115 106,100 C 108,65 100,48 85,45 C 75,30 75,8 60,8 Z"
              fill="rgba(255, 255, 255, 0.02)"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />

            {/* Testa */}
            <circle
              cx="60"
              cy="22"
              r="10"
              fill="rgba(255,255,255,0.06)"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
            />

            {/* Collo */}
            <path
              d="M 56,31 L 64,31 L 63,38 L 57,38 Z"
              fill="rgba(255,255,255,0.06)"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
            />

            {/* SPALLE POSTERIORI */}
            {renderMusclePath('Spalle', [
              'M 38,40 C 31,40 26,44 25,52 L 34,56 Z', // Spalla Sinistra
              'M 82,40 C 89,40 94,44 95,52 L 86,56 Z', // Spalla Destra
            ])}

            {/* DORSO (Schiena) */}
            {renderMusclePath('Dorso', [
              'M 60,40 L 37,45 C 36,65 48,82 60,86 Z', // Dorsale Superiore Sinistro
              'M 60,40 L 83,45 C 84,65 72,82 60,86 Z', // Dorsale Superiore Destro
              'M 42,86 L 78,86 L 75,108 L 45,108 Z', // Lombari / Dorso Inferiore
            ])}

            {/* BRACCIA (Tricipiti) */}
            {renderMusclePath('Braccia', [
              'M 24,54 L 16,90 C 15,94 18,97 22,95 L 28,60 Z', // Tricipite Sinistro
              'M 96,54 L 104,90 C 105,94 102,97 98,95 L 92,60 Z', // Tricipite Destro
            ])}

            {/* GAMBE (Glutei e Femorali posteriori) */}
            {renderMusclePath('Gambe', [
              'M 28,110 L 58,110 C 58,125 54,125 46,134 L 28,126 Z', // Gluteo Sinistro
              'M 92,110 L 62,110 C 62,125 66,125 74,134 L 92,126 Z', // Gluteo Destro
              'M 29,128 L 50,136 C 48,162 44,188 40,205 C 38,206 34,206 34,205 C 30,188 29,162 29,128 Z', // Femorale Sinistro
              'M 91,128 L 70,136 C 72,162 76,188 80,205 C 82,206 86,206 86,205 C 90,188 91,162 91,128 Z', // Femorale Destro
            ])}
          </svg>
        </div>
      </div>

      {/* Pannello Informativo Fluttuante sull'hover */}
      <div
        style={{
          minHeight: '44px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <motion.div
          key={hoveredGroup || 'placeholder'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '8px 16px',
            textAlign: 'center',
            fontSize: '11px',
            minWidth: '220px',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {hoveredData ? (
            <div>
              <span
                style={{
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: getMuscleColor(hoveredGroup || ''),
                  marginRight: '8px',
                }}
              >
                {hoveredGroup}
              </span>
              <span style={{ color: '#fff', fontWeight: 800 }}>
                {hoveredData.volume.toLocaleString()} kg
              </span>
              <span style={{ color: 'var(--text-dim)', marginLeft: '8px', fontSize: '9px' }}>
                ({Math.round(hoveredData.intensity * 100)}% volume max)
              </span>
            </div>
          ) : (
            <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>
              Passa il mouse o tocca un muscolo per i dettagli
            </span>
          )}
        </motion.div>
      </div>
    </div>
  );
};
