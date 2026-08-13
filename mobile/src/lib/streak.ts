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

/** Empty / placeholder streak (smoke shell + react-query placeholder). */
export const EMPTY_HABIT_STREAK: HabitStreak = {
  currentStreak: 0,
  weekCount: 0,
  weekTarget: 3,
  trainedToday: false,
};

function clampNonNegInt(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n);
}

/** Sanitize streak fields for UI (NaN / negative / missing target). */
export function normalizeHabitStreak(streak: HabitStreak | null | undefined): HabitStreak {
  if (!streak) return { ...EMPTY_HABIT_STREAK };
  const weekTarget = Math.max(1, clampNonNegInt(streak.weekTarget) || 3);
  return {
    currentStreak: clampNonNegInt(streak.currentStreak),
    weekCount: clampNonNegInt(streak.weekCount),
    weekTarget,
    trainedToday: !!streak.trainedToday,
  };
}

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

  return normalizeHabitStreak({
    currentStreak,
    weekCount,
    weekTarget: Math.max(1, weekTarget || 3),
    trainedToday,
  });
}

/** Testo compatto per chip UI. */
export function formatStreakLabel(streak: HabitStreak): string {
  const s = normalizeHabitStreak(streak);
  if (s.currentStreak <= 0) {
    // Empty week: clearer CTA than "Sett. 0/n"
    if (s.weekCount <= 0) return `Inizia · 0/${s.weekTarget}`;
    return `Sett. ${s.weekCount}/${s.weekTarget}`;
  }
  const dayWord = s.currentStreak === 1 ? 'giorno' : 'giorni';
  return `${s.currentStreak} ${dayWord} di fila · ${s.weekCount}/${s.weekTarget}`;
}

/** Etichetta parlata per VoiceOver / TalkBack. */
export function formatStreakA11yLabel(streak: HabitStreak): string {
  const s = normalizeHabitStreak(streak);
  const weekMet = s.weekCount >= s.weekTarget;
  const weekPart = weekMet
    ? `Obiettivo settimanale raggiunto: ${s.weekCount} su ${s.weekTarget}`
    : `Obiettivo settimanale ${s.weekCount} su ${s.weekTarget}`;

  if (s.currentStreak <= 0) {
    if (s.weekCount <= 0) {
      return `Nessuna serie attiva. ${weekPart}. Inizia oggi`;
    }
    return `Nessuna serie attiva. ${weekPart}`;
  }
  const dayWord = s.currentStreak === 1 ? 'giorno' : 'giorni';
  return `Serie di ${s.currentStreak} ${dayWord} di fila. ${weekPart}`;
}
