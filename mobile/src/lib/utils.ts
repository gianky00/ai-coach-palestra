export const getMuscleColor = (group: string, notes?: string | null) => {
  if (notes === 'COMPEX') return 'var(--color-compex)';
  const g = group.toLowerCase();
  if (g.includes('petto')) return 'var(--color-petto)';
  if (g.includes('dorso') || g.includes('schiena')) return 'var(--color-dorso)';
  if (g.includes('gambe') || g.includes('quad') || g.includes('femor')) return 'var(--color-gambe)';
  if (g.includes('spalle') || g.includes('delto')) return 'var(--color-spalle)';
  if (g.includes('braccia') || g.includes('bici') || g.includes('trici'))
    return 'var(--color-braccia)';
  if (g.includes('core') || g.includes('addo')) return 'var(--color-core)';
  return 'var(--color-default)';
};

export const calculateE1RM = (w: number, r: number) => {
  if (r === 1) return w;
  return Math.round(w / (1.0278 - 0.0278 * r));
};

export const DAYS = ['DOMENICA', 'LUNEDI', 'MARTEDI', 'MERCOLEDI', 'GIOVEDI', 'VENERDI', 'SABATO'];

/** Calcola i dischi necessari per lato dato un peso totale e il peso del bilanciere. */
export const calculatePlates = (totalWeight: number, barWeight: number = 20): string => {
  let weightPerSide = (totalWeight - barWeight) / 2;
  if (weightPerSide < 0) return 'Solo bilanciere';

  const availablePlates = [20, 15, 10, 5, 2.5, 1.25];
  const plates: number[] = [];

  for (const plate of availablePlates) {
    while (weightPerSide >= plate) {
      plates.push(plate);
      weightPerSide -= plate;
    }
  }
  return plates.length > 0 ? plates.join('kg, ') + 'kg' : 'Nessun disco';
};

/** Ritorna un Date impostato all'inizio della giornata corrente (00:00:00.000). */
export const getStartOfDay = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};
