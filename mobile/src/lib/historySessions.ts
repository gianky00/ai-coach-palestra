import type { OfflineLog, WorkoutSession } from '../types';

/** Row shape used by History list / export (remote + offline). */
export type HistorySessionRow = {
  id: string;
  start_time: string;
  end_time: string | null;
  training_logs: { weight: number; reps: number }[];
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
  const logsBySession = new Map<string, { weight: number; reps: number }[]>();

  for (const log of offlineLogs) {
    if (!log.session_id) continue;
    if (userId && log.user_id && log.user_id !== userId) continue;
    const bucket = logsBySession.get(log.session_id) ?? [];
    bucket.push({ weight: log.weight, reps: log.reps });
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
