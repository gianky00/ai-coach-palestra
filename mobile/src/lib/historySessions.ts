import type { OfflineLog, WorkoutSession } from '../types';
import { type ExerciseMeta, resolveExerciseMeta } from './exerciseMeta';

/** Single set row used by History list / export (remote + offline). */
export type HistoryTrainingLog = {
  weight: number;
  reps: number;
  exercise_id?: string;
  exercises?: { name: string; muscle_group: string } | null;
};

/** Row shape used by History list / export (remote + offline). */
export type HistorySessionRow = {
  id: string;
  start_time: string;
  end_time: string | null;
  training_logs: HistoryTrainingLog[];
  prCount?: number;
  /** True when the session exists only (or also) in the offline queue. */
  offlinePending?: boolean;
};

export type BuildOfflineHistoryOptions = {
  /** When set, only sessions for this user are included. */
  userId?: string;
  /** Include in-progress sessions (default: false — History shows completed only). */
  includeActive?: boolean;
};

/** Build History rows from SQLite offline_sessions + offline_logs. */
export function buildOfflineHistorySessions(
  offlineSessions: WorkoutSession[],
  offlineLogs: OfflineLog[],
  options: BuildOfflineHistoryOptions = {},
): HistorySessionRow[] {
  const { userId, includeActive = false } = options;
  const logsBySession = new Map<string, HistoryTrainingLog[]>();

  for (const log of offlineLogs) {
    if (!log.session_id) continue;
    if (userId && log.user_id && log.user_id !== userId) continue;
    const bucket = logsBySession.get(log.session_id) ?? [];
    bucket.push({
      weight: log.weight,
      reps: log.reps,
      exercise_id: log.exercise_id,
    });
    logsBySession.set(log.session_id, bucket);
  }

  return offlineSessions
    .filter((s) => !userId || s.user_id === userId)
    .filter((s) => includeActive || !!s.end_time)
    .map((s) => ({
      id: s.id,
      start_time: s.start_time,
      end_time: s.end_time,
      training_logs: logsBySession.get(s.id) ?? [],
      offlinePending: true,
    }));
}

export type MergeHistoryOptions = {
  /** Drop sessions without end_time (default true — History list). Export may pass false. */
  completedOnly?: boolean;
};

/**
 * Merge remote History rows with offline queue sessions.
 * Remote wins on shared ids for times; offline training_logs fill empty remote logs.
 * Offline-only sessions are appended. Sorted start_time DESC.
 */
export function mergeHistorySessions(
  remote: HistorySessionRow[],
  offline: HistorySessionRow[],
  options: MergeHistoryOptions = {},
): HistorySessionRow[] {
  const completedOnly = options.completedOnly !== false;
  const byId = new Map<string, HistorySessionRow>();

  for (const row of remote) {
    byId.set(row.id, { ...row, offlinePending: row.offlinePending ?? false });
  }

  for (const row of offline) {
    const existing = byId.get(row.id);
    if (!existing) {
      byId.set(row.id, { ...row, offlinePending: true });
      continue;
    }
    const remoteLogs = existing.training_logs ?? [];
    const offlineLogs = row.training_logs ?? [];
    byId.set(row.id, {
      ...existing,
      // Prefer remote times when present; keep offline end if remote still open.
      start_time: existing.start_time || row.start_time,
      end_time: existing.end_time ?? row.end_time,
      training_logs: remoteLogs.length > 0 ? remoteLogs : offlineLogs,
      offlinePending: true,
      prCount: existing.prCount ?? row.prCount,
    });
  }

  const merged = Array.from(byId.values()).filter((s) => (completedOnly ? !!s.end_time : true));
  return merged.sort((a, b) =>
    a.start_time < b.start_time ? 1 : a.start_time > b.start_time ? -1 : 0,
  );
}

/** Collect unique exercise ids that still need meta enrichment. */
export function collectMissingExerciseIds(rows: HistorySessionRow[]): string[] {
  const ids = new Set<string>();
  for (const row of rows) {
    for (const log of row.training_logs ?? []) {
      if (log.exercises?.name) continue;
      if (log.exercise_id) ids.add(log.exercise_id);
    }
  }
  return Array.from(ids);
}

/**
 * Attach exercise name/group to logs missing `exercises`.
 * Does not overwrite existing remote metadata.
 */
export function enrichHistorySessionsWithExercises(
  rows: HistorySessionRow[],
  catalog?: ReadonlyMap<string, ExerciseMeta> | null,
): HistorySessionRow[] {
  return rows.map((row) => ({
    ...row,
    training_logs: (row.training_logs ?? []).map((log) => {
      if (log.exercises?.name) return log;
      const meta = resolveExerciseMeta(log.exercise_id, catalog);
      return {
        ...log,
        exercises: { name: meta.name, muscle_group: meta.muscle_group },
      };
    }),
  }));
}
