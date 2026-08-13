/** Intensità colore heatmap muscolare da volume (kg). */
export const getHeatmapIntensity = (volume: number): string => {
  if (volume <= 0) return '#333';
  if (volume < 1000) return '#006633';
  if (volume < 3000) return '#009944';
  return '#00ff88';
};

/** Livello verbale allineato alle soglie colore (per screen reader). */
export const getHeatmapLevelLabel = (volume: number): string => {
  if (volume <= 0) return 'inattivo';
  if (volume < 1000) return 'basso';
  if (volume < 3000) return 'medio';
  return 'alto';
};

const HEATMAP_A11Y_GROUPS = ['Petto', 'Schiena', 'Spalle', 'Bicipiti', 'Gambe', 'Core'] as const;

/** Riepilogo heatmap per VoiceOver / TalkBack. */
export const formatHeatmapA11yLabel = (muscleStats: Record<string, number>): string => {
  const parts = HEATMAP_A11Y_GROUPS.map((g) => `${g} ${getHeatmapLevelLabel(muscleStats[g] || 0)}`);
  return `Heatmap muscolare: ${parts.join(', ')}`;
};

/** Normalizza etichette gruppo muscolare verso le chiavi della heatmap. */
export const normalizeMuscleGroup = (raw: string | null | undefined): string => {
  const g = (raw ?? '').trim().toLowerCase();
  if (!g) return 'Varie';
  if (/petto|pettor/.test(g)) return 'Petto';
  if (/schiena|dors|lats|pull/.test(g)) return 'Schiena';
  if (/spall|deltoid/.test(g)) return 'Spalle';
  if (/bicip/.test(g)) return 'Bicipiti';
  if (/tric/.test(g)) return 'Tricipiti';
  if (/gamba|quad|glute|femor|polpac/.test(g)) return 'Gambe';
  if (/core|addom|abs/.test(g)) return 'Core';
  if (g === 'varie' || g === 'altro') return 'Varie';
  // Match exact capitalized keys already used in UI (raw is non-empty after early return).
  const titled = (raw ?? '').trim();
  const known = ['Petto', 'Schiena', 'Spalle', 'Bicipiti', 'Tricipiti', 'Gambe', 'Core', 'Varie'];
  if (known.includes(titled)) return titled;
  return 'Varie';
};
