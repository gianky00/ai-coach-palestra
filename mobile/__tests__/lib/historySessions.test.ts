import { describe, expect, it } from 'vitest';

import {
  buildOfflineHistorySessions,
  type HistorySessionRow,
  mergeHistorySessions,
} from '../../src/lib/historySessions';
import type { OfflineLog, WorkoutSession } from '../../src/types';

const sess = (
  partial: Partial<WorkoutSession> & Pick<WorkoutSession, 'id' | 'start_time'>,
): WorkoutSession => ({
  user_id: 'u1',
  end_time: '2026-08-13T19:00:00.000Z',
  ...partial,
});

const log = (
  partial: Partial<OfflineLog> & Pick<OfflineLog, 'tempId' | 'session_id' | 'weight' | 'reps'>,
): OfflineLog => ({
  user_id: 'u1',
  exercise_id: 'ex1',
  rpe: 7,
  set_type: 'S',
  created_at: '2026-08-13T18:10:00.000Z',
  ...partial,
});

describe('buildOfflineHistorySessions', () => {
  it('attaches logs, filters by user, skips active by default', () => {
    const sessions = [
      sess({ id: 's1', start_time: '2026-08-13T18:00:00.000Z' }),
      sess({ id: 's2', start_time: '2026-08-12T18:00:00.000Z', end_time: null }),
      sess({ id: 's3', user_id: 'other', start_time: '2026-08-11T18:00:00.000Z' }),
    ];
    const logs = [
      log({ tempId: 't1', session_id: 's1', weight: 100, reps: 5 }),
      log({ tempId: 't2', session_id: 's1', weight: 100, reps: 5 }),
      log({ tempId: 't3', session_id: 's2', weight: 60, reps: 8 }),
      log({ tempId: 't4', session_id: null, weight: 40, reps: 10 }),
      log({ tempId: 't5', session_id: 's3', user_id: 'other', weight: 80, reps: 3 }),
    ];

    const rows = buildOfflineHistorySessions(sessions, logs, { userId: 'u1' });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 's1',
      offlinePending: true,
      training_logs: [
        { weight: 100, reps: 5 },
        { weight: 100, reps: 5 },
      ],
    });
  });

  it('includeActive keeps open sessions', () => {
    const rows = buildOfflineHistorySessions(
      [sess({ id: 'open', start_time: '2026-08-13T18:00:00.000Z', end_time: null })],
      [],
      { includeActive: true },
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].end_time).toBeNull();
  });
});

describe('mergeHistorySessions', () => {
  it('appends offline-only sessions and sorts newest first', () => {
    const remote: HistorySessionRow[] = [
      {
        id: 'remote-1',
        start_time: '2026-08-10T18:00:00.000Z',
        end_time: '2026-08-10T19:00:00.000Z',
        training_logs: [{ weight: 50, reps: 10 }],
      },
    ];
    const offline: HistorySessionRow[] = [
      {
        id: 'offline-1',
        start_time: '2026-08-13T18:00:00.000Z',
        end_time: '2026-08-13T19:00:00.000Z',
        training_logs: [{ weight: 100, reps: 5 }],
        offlinePending: true,
      },
    ];

    const merged = mergeHistorySessions(remote, offline);
    expect(merged.map((s) => s.id)).toEqual(['offline-1', 'remote-1']);
    expect(merged[0].offlinePending).toBe(true);
  });

  it('fills empty remote logs from offline and marks pending', () => {
    const remote: HistorySessionRow[] = [
      {
        id: 'shared',
        start_time: '2026-08-13T18:00:00.000Z',
        end_time: '2026-08-13T19:00:00.000Z',
        training_logs: [],
      },
    ];
    const offline: HistorySessionRow[] = [
      {
        id: 'shared',
        start_time: '2026-08-13T18:00:00.000Z',
        end_time: '2026-08-13T19:00:00.000Z',
        training_logs: [{ weight: 90, reps: 4 }],
        offlinePending: true,
      },
    ];

    const merged = mergeHistorySessions(remote, offline);
    expect(merged).toHaveLength(1);
    expect(merged[0].training_logs).toEqual([{ weight: 90, reps: 4 }]);
    expect(merged[0].offlinePending).toBe(true);
  });

  it('keeps remote logs when both sides have sets', () => {
    const merged = mergeHistorySessions(
      [
        {
          id: 'shared',
          start_time: '2026-08-13T18:00:00.000Z',
          end_time: '2026-08-13T19:00:00.000Z',
          training_logs: [{ weight: 100, reps: 5 }],
        },
      ],
      [
        {
          id: 'shared',
          start_time: '2026-08-13T18:00:00.000Z',
          end_time: '2026-08-13T19:00:00.000Z',
          training_logs: [{ weight: 80, reps: 8 }],
          offlinePending: true,
        },
      ],
    );
    expect(merged[0].training_logs).toEqual([{ weight: 100, reps: 5 }]);
    expect(merged[0].offlinePending).toBe(true);
  });

  it('drops sessions still without end_time after merge (default)', () => {
    const merged = mergeHistorySessions(
      [
        {
          id: 'open',
          start_time: '2026-08-13T18:00:00.000Z',
          end_time: null,
          training_logs: [],
        },
      ],
      [],
    );
    expect(merged).toEqual([]);
  });

  it('keeps active sessions when completedOnly is false', () => {
    const merged = mergeHistorySessions(
      [
        {
          id: 'open',
          start_time: '2026-08-13T18:00:00.000Z',
          end_time: null,
          training_logs: [],
        },
      ],
      [],
      { completedOnly: false },
    );
    expect(merged.map((s) => s.id)).toEqual(['open']);
  });
});
