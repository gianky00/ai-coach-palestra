/**
 * Pure smoke seed plan helpers (no SQLite / AsyncStorage — safe for Vitest).
 */
import type { Exercise } from '../types';
import { DAYS } from './utils';

export const SMOKE_ID_PREFIX = 'smoke-';
export const SEED_SESSION_PREFIX = 'smoke-seed-sess-';
export const SEED_LOG_PREFIX = 'smoke-seed-log-';

export const DEFAULT_SEED_DAYS = 14;
export const DEFAULT_SEED_SETS = 3;
export const MIN_SEED_DAYS = 1;
export const MAX_SEED_DAYS = 21;
export const MIN_SEED_SETS = 1;
export const MAX_SEED_SETS = 6;

export type SmokeSeedParams = { days: number; sets: number };

export type SmokeSeedOptions = {
  days?: number;
  sets?: number;
  now?: Date;
};

export type SmokeSeedLogPlan = {
  tempId: string;
  exercise_id: string;
  weight: number;
  reps: number;
  rpe: number;
  set_type: string;
  created_at: string;
  isPr: boolean;
};

export type SmokeSeedSessionPlan = {
  id: string;
  start_time: string;
  end_time: string;
  note: string;
  logs: SmokeSeedLogPlan[];
};

export type SmokeSeedPlan = {
  days: number;
  sets: number;
  sessions: SmokeSeedSessionPlan[];
  exercises: Exercise[];
};

/** Full catalog — every weekday (+ weekend light) so Oggi is never empty after seed. */
export const SMOKE_EXERCISE_CATALOG: Exercise[] = [
  {
    id: 'smoke-seed-ex-bench',
    name: 'Smoke Bench',
    muscle_group: 'Petto',
    target_reps: '8-10',
    target_sets: 3,
    training_day: 'LUNEDI',
    rest_time: 90,
    order_index: 0,
  },
  {
    id: 'smoke-seed-ex-row',
    name: 'Smoke Row',
    muscle_group: 'Schiena',
    target_reps: '8-10',
    target_sets: 3,
    training_day: 'LUNEDI',
    rest_time: 90,
    order_index: 1,
  },
  {
    id: 'smoke-seed-ex-squat',
    name: 'Smoke Squat',
    muscle_group: 'Gambe',
    target_reps: '6-8',
    target_sets: 3,
    training_day: 'MARTEDI',
    rest_time: 120,
    order_index: 0,
  },
  {
    id: 'smoke-seed-ex-ohp',
    name: 'Smoke OHP',
    muscle_group: 'Spalle',
    target_reps: '8-10',
    target_sets: 3,
    training_day: 'MERCOLEDI',
    rest_time: 90,
    order_index: 0,
  },
  {
    id: 'smoke-seed-ex-curl',
    name: 'Smoke Curl',
    muscle_group: 'Bicipiti',
    target_reps: '10-12',
    target_sets: 3,
    training_day: 'GIOVEDI',
    rest_time: 60,
    order_index: 0,
  },
  {
    id: 'smoke-seed-ex-dip',
    name: 'Smoke Dip',
    muscle_group: 'Tricipiti',
    target_reps: '8-12',
    target_sets: 3,
    training_day: 'GIOVEDI',
    rest_time: 75,
    order_index: 1,
  },
  {
    id: 'smoke-seed-ex-deadlift',
    name: 'Smoke Deadlift',
    muscle_group: 'Schiena',
    target_reps: '5',
    target_sets: 3,
    training_day: 'VENERDI',
    rest_time: 150,
    order_index: 0,
  },
  {
    id: 'smoke-seed-ex-core',
    name: 'Smoke Core',
    muscle_group: 'Core',
    target_reps: '12-15',
    target_sets: 3,
    training_day: 'VENERDI',
    rest_time: 45,
    order_index: 1,
  },
  {
    id: 'smoke-seed-ex-walk',
    name: 'Smoke Walk',
    muscle_group: 'Gambe',
    target_reps: '20',
    target_sets: 2,
    training_day: 'SABATO',
    rest_time: 60,
    order_index: 0,
  },
  {
    id: 'smoke-seed-ex-mobility',
    name: 'Smoke Mobility',
    muscle_group: 'Core',
    target_reps: '15',
    target_sets: 2,
    training_day: 'DOMENICA',
    rest_time: 45,
    order_index: 0,
  },
];

const EXERCISE_BY_ID = new Map(SMOKE_EXERCISE_CATALOG.map((e) => [e.id, e]));

export function isSmokeFixtureId(id: string | null | undefined): boolean {
  if (typeof id !== 'string' || !id) return false;
  return (
    id.startsWith(SMOKE_ID_PREFIX) ||
    id.startsWith(SEED_SESSION_PREFIX) ||
    id.startsWith(SEED_LOG_PREFIX)
  );
}

export function clampSeedDays(raw: number): number {
  if (!Number.isFinite(raw)) return DEFAULT_SEED_DAYS;
  return Math.min(MAX_SEED_DAYS, Math.max(MIN_SEED_DAYS, Math.round(raw)));
}

export function clampSeedSets(raw: number): number {
  if (!Number.isFinite(raw)) return DEFAULT_SEED_SETS;
  return Math.min(MAX_SEED_SETS, Math.max(MIN_SEED_SETS, Math.round(raw)));
}

export function parseSeedParams(searchParams: {
  get: (key: string) => string | null;
}): SmokeSeedParams {
  const daysRaw = searchParams.get('days');
  const setsRaw = searchParams.get('sets');
  const daysNum = daysRaw != null && daysRaw !== '' ? parseInt(daysRaw, 10) : DEFAULT_SEED_DAYS;
  const setsNum = setsRaw != null && setsRaw !== '' ? parseInt(setsRaw, 10) : DEFAULT_SEED_SETS;
  return { days: clampSeedDays(daysNum), sets: clampSeedSets(setsNum) };
}

export function getSmokeExercisesForDay(day: string): Exercise[] {
  const key = (day || '').toUpperCase();
  return SMOKE_EXERCISE_CATALOG.filter((e) => e.training_day.toUpperCase() === key);
}

export function muscleGroupForSmokeExercise(exerciseId: string): string {
  return EXERCISE_BY_ID.get(exerciseId)?.muscle_group ?? 'Varie';
}

export function buildSmokeSeedExercises(today = new Date()): Exercise[] {
  const dayName = DAYS[today.getDay()];
  const forDay = getSmokeExercisesForDay(dayName);
  if (forDay.length > 0) return forDay.map((e) => ({ ...e }));
  return SMOKE_EXERCISE_CATALOG.slice(0, 3).map((e, i) => ({
    ...e,
    id: `${e.id}-today`,
    training_day: dayName,
    order_index: i,
  }));
}

function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function atLocalTime(day: Date, hours: number, minutes: number): Date {
  const d = new Date(day);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function baseWeightFor(ex: Exercise): number {
  switch (ex.muscle_group) {
    case 'Gambe':
      return 100;
    case 'Petto':
      return 80;
    case 'Schiena':
      return 70;
    case 'Spalle':
      return 40;
    default:
      return 25;
  }
}

export function buildSmokeSeedPlan(options: SmokeSeedOptions = {}): SmokeSeedPlan {
  const days = clampSeedDays(options.days ?? DEFAULT_SEED_DAYS);
  const sets = clampSeedSets(options.sets ?? DEFAULT_SEED_SETS);
  const now = options.now ? new Date(options.now) : new Date();
  const today = startOfLocalDay(now);

  const sessions: SmokeSeedSessionPlan[] = [];
  let prAssigned = false;

  for (let offset = days - 1; offset >= 0; offset--) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const dayName = DAYS[day.getDay()];
    const exercises = getSmokeExercisesForDay(dayName);
    if (exercises.length === 0) continue;

    const sessionIndex = sessions.length;
    const sessionId = `${SEED_SESSION_PREFIX}${sessionIndex}`;
    const start = atLocalTime(day, 18, 0);
    const end = atLocalTime(day, 19, 15);
    const note =
      offset === 0
        ? 'Smoke note: buon volume, focus tecnica.'
        : sessionIndex === 0
          ? 'Smoke note: prima sessione fixture.'
          : '';

    const logs: SmokeSeedLogPlan[] = [];
    let logIndex = 0;

    for (const ex of exercises) {
      const base = baseWeightFor(ex);
      for (let s = 0; s < sets; s++) {
        logIndex += 1;
        const isPr =
          !prAssigned && day.getDay() === 1 && ex.id === 'smoke-seed-ex-bench' && s === sets - 1;
        if (isPr) prAssigned = true;

        const created = new Date(start);
        created.setMinutes(created.getMinutes() + logIndex * 3);

        logs.push({
          tempId: `${SEED_LOG_PREFIX}${sessionIndex}-${ex.id}-s${s + 1}`,
          exercise_id: ex.id,
          weight: isPr ? base + 10 : base + s * 2.5,
          reps: isPr ? 7 : s === sets - 1 ? 6 : 8,
          rpe: Math.min(10, isPr ? 9 : 6 + s),
          set_type: s === 0 ? 'W' : 'S',
          created_at: created.toISOString(),
          isPr,
        });
      }
    }

    sessions.push({
      id: sessionId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      note,
      logs,
    });
  }

  if (sessions.length === 0) {
    const dayName = DAYS[today.getDay()];
    const ex = getSmokeExercisesForDay(dayName)[0] ?? SMOKE_EXERCISE_CATALOG[0];
    const start = atLocalTime(today, 18, 0);
    sessions.push({
      id: `${SEED_SESSION_PREFIX}0`,
      start_time: start.toISOString(),
      end_time: atLocalTime(today, 19, 0).toISOString(),
      note: 'Smoke note sample',
      logs: Array.from({ length: sets }, (_, s) => ({
        tempId: `${SEED_LOG_PREFIX}0-${ex.id}-s${s + 1}`,
        exercise_id: ex.id,
        weight: 60 + s * 2.5,
        reps: 8,
        rpe: 7,
        set_type: 'S',
        created_at: new Date(start.getTime() + (s + 1) * 180000).toISOString(),
        isPr: s === sets - 1,
      })),
    });
  }

  return { days, sets, sessions, exercises: SMOKE_EXERCISE_CATALOG };
}
