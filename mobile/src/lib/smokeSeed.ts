/**
 * Local SQLite/AsyncStorage fixtures for smoke UI (zero login / no Garmin OAuth).
 * Deep-links: kinefit://smoke/seed?days=7&sets=3 | kinefit://smoke/clear
 *
 * Pure plan helpers live in smokeSeedPlan.ts (Vitest-safe).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { sessionNotesService } from '../services/sessionNotesService';
import { sessionPrService } from '../services/sessionPrService';
import type { OfflineLog, WorkoutSession } from '../types';
import { countSessionPrs } from './sessionPr';
import { buildSmokeSeedPlan, isSmokeFixtureId, type SmokeSeedOptions } from './smokeSeedPlan';
import { initDb, sqliteService } from './sqlite';

export * from './smokeSeedPlan';

/** Keep in sync with smokeMode.SMOKE_USER_ID (avoid circular import). */
const SMOKE_USER_ID = 'smoke-user';

export const SMOKE_SEED_FLAG_KEY = 'kinefit-smoke-seeded';
export const SMOKE_EXERCISES_KEY = 'kinefit-smoke-exercises';
export const SMOKE_SEED_READY_ID = 'smoke-seed-ready';

export type SmokeHistorySession = {
  id: string;
  start_time: string;
  end_time: string | null;
  training_logs: { weight: number; reps: number }[];
  prCount: number;
};

export async function isSmokeSeeded(): Promise<boolean> {
  const v = await AsyncStorage.getItem(SMOKE_SEED_FLAG_KEY);
  return v === '1';
}

export async function loadSmokeSeedExercises(): Promise<import('../types').Exercise[]> {
  const raw = await AsyncStorage.getItem(SMOKE_EXERCISES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as import('../types').Exercise[];
  } catch {
    return [];
  }
}

export async function clearSmokeSeed(): Promise<{ clearedSessions: number; clearedLogs: number }> {
  await initDb();
  const sessions = await sqliteService.getAllOfflineSessions();
  const logs = await sqliteService.getAllLogs();
  let clearedSessions = 0;
  let clearedLogs = 0;

  for (const s of sessions) {
    if (isSmokeFixtureId(s.id) || s.user_id === SMOKE_USER_ID) {
      const note = await sessionNotesService.getNote(s.id);
      if (note) await sessionNotesService.clearNote(s.id);
      await sessionPrService.clearSession(s.id);
      await sqliteService.deleteOfflineSession(s.id);
      clearedSessions += 1;
    }
  }
  for (const l of logs) {
    if (
      isSmokeFixtureId(l.tempId) ||
      isSmokeFixtureId(l.id) ||
      isSmokeFixtureId(l.session_id) ||
      l.user_id === SMOKE_USER_ID
    ) {
      await sqliteService.deleteLog(l.tempId);
      clearedLogs += 1;
    }
  }

  await AsyncStorage.multiRemove([SMOKE_SEED_FLAG_KEY, SMOKE_EXERCISES_KEY]);
  return { clearedSessions, clearedLogs };
}

export async function seedSmokeWorkouts(
  params: SmokeSeedOptions = {},
): Promise<{ sessions: number; logs: number; exercises: number; notes: number }> {
  await initDb();
  await clearSmokeSeed();

  const plan = buildSmokeSeedPlan(params);
  await AsyncStorage.setItem(SMOKE_EXERCISES_KEY, JSON.stringify(plan.exercises));

  let notes = 0;
  for (const session of plan.sessions) {
    const row: WorkoutSession = {
      id: session.id,
      user_id: SMOKE_USER_ID,
      start_time: session.start_time,
      end_time: session.end_time,
      is_new: false,
    };
    await sqliteService.addOfflineSession(row);

    if (session.note) {
      await sessionNotesService.setNote(session.id, session.note);
      notes += 1;
    }

    const prCount = countSessionPrs(session.logs);
    if (prCount > 0) {
      await sessionPrService.setCount(session.id, prCount);
    } else {
      await sessionPrService.clearSession(session.id);
    }

    for (const log of session.logs) {
      const offline: OfflineLog = {
        tempId: log.tempId,
        id: log.tempId,
        user_id: SMOKE_USER_ID,
        exercise_id: log.exercise_id,
        session_id: session.id,
        weight: log.weight,
        reps: log.reps,
        rpe: log.rpe,
        set_type: log.set_type,
        created_at: log.created_at,
      };
      await sqliteService.addLog(offline);
    }
  }

  await AsyncStorage.setItem(SMOKE_SEED_FLAG_KEY, '1');
  const logs = plan.sessions.reduce((acc, s) => acc + s.logs.length, 0);
  return { sessions: plan.sessions.length, logs, exercises: plan.exercises.length, notes };
}

export async function fetchSmokeHistorySessions(): Promise<SmokeHistorySession[]> {
  const [sessions, logs, prCounts] = await Promise.all([
    sqliteService.getAllOfflineSessions(),
    sqliteService.getAllLogs(),
    sessionPrService.getAll(),
  ]);

  return sessions
    .filter((s) => isSmokeFixtureId(s.id) || s.user_id === SMOKE_USER_ID)
    .filter((s) => !!s.end_time)
    .sort((a, b) => (a.start_time < b.start_time ? 1 : -1))
    .map((s) => ({
      id: s.id,
      start_time: s.start_time,
      end_time: s.end_time,
      training_logs: logs
        .filter((l) => l.session_id === s.id)
        .map((l) => ({ weight: l.weight, reps: l.reps })),
      prCount: prCounts[s.id] ?? 0,
    }));
}

/** Aliases expected by App.tsx / sibling agents. */
export const seedSmokeFixtures = seedSmokeWorkouts;
export const clearSmokeFixtures = clearSmokeSeed;
