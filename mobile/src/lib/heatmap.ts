/** Intensità colore heatmap muscolare da volume (kg). */
export const getHeatmapIntensity = (volume: number): string => {
  if (volume <= 0) return '#333';
  if (volume < 1000) return '#006633';
  if (volume < 3000) return '#009944';
  return '#00ff88';
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
