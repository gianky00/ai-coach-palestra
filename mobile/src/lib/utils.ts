export const calculateE1RM = (w: number, r: number) => {
  if (r <= 0 || w <= 0) return 0;
  if (r === 1) return w;
  return Math.round(w / (1.0278 - 0.0278 * r));
};

/** Verifica se peso/reps superano il record personale attuale. */
export const isPersonalRecord = (
  weight: number,
  reps: number,
  current: { weight: number; reps: number } | null,
): boolean => {
  if (!current) return true;
  return weight > current.weight || (weight === current.weight && reps > current.reps);
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

type MergeableLog = {
  id?: string;
  tempId?: string;
  exercise_id?: string;
  created_at?: string;
  weight?: number;
  reps?: number;
};

/** Unisce log remoti e offline evitando duplicati per id/tempId. */
export const mergeLogsWithoutDuplicates = <T extends MergeableLog>(
  remote: T[],
  offline: T[],
): T[] => {
  const byKey = new Map<string, T>();

  for (const log of [...remote, ...offline]) {
    const key =
      log.id ??
      log.tempId ??
      `${log.exercise_id ?? 'x'}-${log.created_at ?? ''}-${log.weight ?? 0}-${log.reps ?? 0}`;
    byKey.set(key, log);
  }

  return Array.from(byKey.values()).sort((a, b) =>
    (a.created_at ?? '').localeCompare(b.created_at ?? ''),
  );
};

/** Restituisce la data più recente corrispondente al giorno della settimana passato. */
export const getDateForSelectedDay = (dayName: string): Date => {
  const targetIndex = DAYS.indexOf(dayName.toUpperCase());
  if (targetIndex === -1) return new Date();

  const currentIndex = new Date().getDay();
  let diff = currentIndex - targetIndex;

  // Se diff < 0 significa che il giorno selezionato è "avanti" nella settimana,
  // ma noi stiamo registrando un recupero, quindi si riferisce alla settimana scorsa.
  if (diff < 0) {
    diff += 7;
  }

  const d = new Date();
  d.setDate(d.getDate() - diff);
  return d;
};
