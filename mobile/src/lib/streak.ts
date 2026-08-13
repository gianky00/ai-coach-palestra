import { toLocalDateKey } from './utils';

export type HabitStreak = {
  /** Giorni consecutivi di allenamento (da oggi o da ieri se oggi ancora vuoto). */
  currentStreak: number;
  /** Sessioni distinte nella settimana ISO locale (lun–dom). */
  weekCount: number;
  /** Target abitudine settimanale (default 3). */
  weekTarget: number;
  /** True se oggi c’è già almeno una sessione. */
  trainedToday: boolean;
};

/** Normalizza ISO/date string → chiavi YYYY-MM-DD uniche, ordinate desc. */
export function sessionDatesToKeys(isoDates: Array<string | Date | null | undefined>): string[] {
  const keys = new Set<string>();
  for (const raw of isoDates) {
    if (raw == null) continue;
    const d = raw instanceof Date ? raw : new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    keys.add(toLocalDateKey(d));
  }
  return Array.from(keys).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

function parseLocalKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function addDaysKey(key: string, delta: number): string {
  const d = parseLocalKey(key);
  d.setDate(d.getDate() + delta);
  return toLocalDateKey(d);
}

/** Lunedì della settimana che contiene `key` (locale). */
export function startOfWeekMondayKey(key: string): string {
  const d = parseLocalKey(key);
  const day = d.getDay(); // 0=dom
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return toLocalDateKey(d);
}

/**
 * Calcola streak e abitudine settimanale da date sessione.
 * Streak: conta indietro da oggi se allenato oggi, altrimenti da ieri.
 */
export function computeHabitStreak(
  isoDates: Array<string | Date | null | undefined>,
  now: Date = new Date(),
  weekTarget = 3,
): HabitStreak {
  const keys = sessionDatesToKeys(isoDates);
  const keySet = new Set(keys);
  const todayKey = toLocalDateKey(now);
  const trainedToday = keySet.has(todayKey);

  let cursor = trainedToday ? todayKey : addDaysKey(todayKey, -1);
  let currentStreak = 0;
  while (keySet.has(cursor)) {
    currentStreak += 1;
    cursor = addDaysKey(cursor, -1);
  }

  const weekStart = startOfWeekMondayKey(todayKey);
  let weekCount = 0;
  for (const k of keys) {
    if (k >= weekStart && k <= todayKey) weekCount += 1;
  }

  return {
    currentStreak,
    weekCount,
    weekTarget: Math.max(1, weekTarget),
    trainedToday,
  };
}

/** Testo compatto per chip UI. */
export function formatStreakLabel(streak: HabitStreak): string {
  if (streak.currentStreak <= 0) {
    return `Sett. ${streak.weekCount}/${streak.weekTarget}`;
  }
  const dayWord = streak.currentStreak === 1 ? 'giorno' : 'giorni';
  return `${streak.currentStreak} ${dayWord} di fila · ${streak.weekCount}/${streak.weekTarget}`;
}

/** Etichetta parlata per VoiceOver / TalkBack. */
export function formatStreakA11yLabel(streak: HabitStreak): string {
  const weekPart = `obiettivo settimanale ${streak.weekCount} su ${streak.weekTarget}`;
  if (streak.currentStreak <= 0) {
    return `Nessuna serie attiva. ${weekPart}`;
  }
  const dayWord = streak.currentStreak === 1 ? 'giorno' : 'giorni';
  return `Serie di ${streak.currentStreak} ${dayWord} di fila. ${weekPart}`;
}
