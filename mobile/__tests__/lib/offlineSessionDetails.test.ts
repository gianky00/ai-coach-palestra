import { describe, expect, it } from 'vitest';

import { buildExerciseMetaCatalog } from '../../src/lib/exerciseMeta';
import { offlineLogsAsSessionDetails } from '../../src/lib/offlineSessionDetails';
import type { OfflineLog } from '../../src/types';

const log = (
  partial: Partial<OfflineLog> & Pick<OfflineLog, 'tempId' | 'session_id' | 'exercise_id'>,
): OfflineLog => ({
  user_id: 'u1',
  weight: 100,
  reps: 5,
  rpe: 7,
  set_type: 'S',
  created_at: '2026-08-13T18:10:00.000Z',
  ...partial,
});

describe('offlineLogsAsSessionDetails', () => {
  it('filters session, sorts by created_at, resolves smoke names', () => {
    const rows = offlineLogsAsSessionDetails('s1', [
      log({
        tempId: 't2',
        session_id: 's1',
        exercise_id: 'smoke-seed-ex-row',
        created_at: '2026-08-13T18:20:00.000Z',
        weight: 80,
      }),
      log({
        tempId: 't1',
        session_id: 's1',
        exercise_id: 'smoke-seed-ex-bench',
        created_at: '2026-08-13T18:10:00.000Z',
      }),
      log({
        tempId: 't3',
        session_id: 'other',
        exercise_id: 'smoke-seed-ex-bench',
      }),
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0].exercises).toEqual({ name: 'Smoke Bench', muscle_group: 'Petto' });
    expect(rows[1].exercises).toEqual({ name: 'Smoke Row', muscle_group: 'Schiena' });
    expect(rows[0].weight).toBe(100);
    expect(rows[1].weight).toBe(80);
  });

  it('uses provided catalog for real exercise ids', () => {
    const catalog = buildExerciseMetaCatalog([
      { id: 'real-ex', name: 'Panca piana', muscle_group: 'Petto' },
    ]);
    const rows = offlineLogsAsSessionDetails(
      's1',
      [log({ tempId: 't1', session_id: 's1', exercise_id: 'real-ex' })],
      catalog,
    );
    expect(rows[0].exercises).toEqual({ name: 'Panca piana', muscle_group: 'Petto' });
  });
});
