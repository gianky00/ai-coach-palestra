import { describe, expect, it } from 'vitest';

import { buildExerciseMetaCatalog } from '../../src/lib/exerciseMeta';
import {
  buildOfflineHistorySessions,
  collectMissingExerciseIds,
  enrichHistorySessionsWithExercises,
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
        { weight: 100, reps: 5, exercise_id: 'ex1' },
        { weight: 100, reps: 5, exercise_id: 'ex1' },
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

  it('fills remote open end_time from offline and preserves prCount', () => {
    const merged = mergeHistorySessions(
      [
        {
          id: 'shared',
          start_time: '2026-08-13T18:00:00.000Z',
          end_time: null,
          training_logs: [],
          prCount: 2,
        },
      ],
      [
        {
          id: 'shared',
          start_time: '2026-08-13T18:00:00.000Z',
          end_time: '2026-08-13T19:00:00.000Z',
          training_logs: [{ weight: 90, reps: 4, exercise_id: 'ex1' }],
          offlinePending: true,
          prCount: 9,
        },
      ],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].end_time).toBe('2026-08-13T19:00:00.000Z');
    expect(merged[0].prCount).toBe(2);
    expect(merged[0].training_logs[0].exercise_id).toBe('ex1');
  });

  it('keeps equal start_time order stable by id insertion', () => {
    const merged = mergeHistorySessions(
      [
        {
          id: 'a',
          start_time: '2026-08-13T18:00:00.000Z',
          end_time: '2026-08-13T19:00:00.000Z',
          training_logs: [],
        },
        {
          id: 'b',
          start_time: '2026-08-13T18:00:00.000Z',
          end_time: '2026-08-13T19:00:00.000Z',
          training_logs: [],
        },
      ],
      [],
    );
    expect(merged.map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('includes logs with empty user_id when filtering by user', () => {
    const rows = buildOfflineHistorySessions(
      [sess({ id: 's1', start_time: '2026-08-13T18:00:00.000Z' })],
      [
        log({
          tempId: 't1',
          session_id: 's1',
          weight: 50,
          reps: 10,
          user_id: '' as unknown as string,
          exercise_id: 'ex1',
        }),
      ],
      { userId: 'u1' },
    );
    expect(rows[0].training_logs).toEqual([{ weight: 50, reps: 10, exercise_id: 'ex1' }]);
  });
});

describe('enrichHistorySessionsWithExercises', () => {
  it('collects missing ids and attaches meta without overwriting remote names', () => {
    const rows: HistorySessionRow[] = [
      {
        id: 's1',
        start_time: '2026-08-13T18:00:00.000Z',
        end_time: '2026-08-13T19:00:00.000Z',
        training_logs: [
          { weight: 100, reps: 5, exercise_id: 'ex1' },
          {
            weight: 80,
            reps: 8,
            exercise_id: 'ex2',
            exercises: { name: 'Remoto', muscle_group: 'Schiena' },
          },
        ],
      },
    ];

    expect(collectMissingExerciseIds(rows)).toEqual(['ex1']);

    const catalog = buildExerciseMetaCatalog([
      { id: 'ex1', name: 'Panca', muscle_group: 'Petto' },
      { id: 'ex2', name: 'Ignora', muscle_group: 'X' },
    ]);
    const enriched = enrichHistorySessionsWithExercises(rows, catalog);
    expect(enriched[0].training_logs[0].exercises).toEqual({
      name: 'Panca',
      muscle_group: 'Petto',
    });
    expect(enriched[0].training_logs[1].exercises).toEqual({
      name: 'Remoto',
      muscle_group: 'Schiena',
    });
  });

  it('falls back to smoke / unknown when catalog misses', () => {
    const enriched = enrichHistorySessionsWithExercises([
      {
        id: 's1',
        start_time: '2026-08-13T18:00:00.000Z',
        end_time: '2026-08-13T19:00:00.000Z',
        training_logs: [
          { weight: 100, reps: 5, exercise_id: 'smoke-seed-ex-bench' },
          { weight: 40, reps: 12, exercise_id: 'unknown-ex' },
        ],
      },
    ]);
    expect(enriched[0].training_logs[0].exercises?.name).toBe('Smoke Bench');
    expect(enriched[0].training_logs[1].exercises).toEqual({
      name: 'Esercizio',
      muscle_group: 'Varie',
    });
  });
});
