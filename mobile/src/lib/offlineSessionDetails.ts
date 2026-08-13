import type { OfflineLog, SessionLogDetail } from '../types';
import { type ExerciseMeta, resolveExerciseMeta } from './exerciseMeta';

/**
 * Map SQLite offline logs for a session into SessionDetails rows.
 * Pure — safe for Vitest (pass catalog for non-smoke exercise names).
 */
export function offlineLogsAsSessionDetails(
  sessionId: string,
  logs: OfflineLog[],
  catalog?: ReadonlyMap<string, ExerciseMeta> | null,
): SessionLogDetail[] {
  return logs
    .filter((l) => l.session_id === sessionId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((l) => {
      const meta = resolveExerciseMeta(l.exercise_id, catalog);
      return {
        weight: l.weight,
        reps: l.reps,
        rpe: l.rpe,
        set_type: l.set_type,
        created_at: l.created_at,
        exercises: {
          name: meta.name,
          muscle_group: meta.muscle_group,
        },
      };
    });
}
