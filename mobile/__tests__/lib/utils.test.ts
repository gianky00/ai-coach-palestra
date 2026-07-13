import { describe, expect, it } from 'vitest';

import { mapUserSettingsRow } from '../../src/lib/profileMappers';
import {
  calculateE1RM,
  calculatePlates,
  getStartOfDay,
  isPersonalRecord,
  mergeLogsWithoutDuplicates,
} from '../../src/lib/utils';

describe('calculateE1RM', () => {
  it('returns weight for a single rep', () => {
    expect(calculateE1RM(100, 1)).toBe(100);
  });

  it('calculates Brzycki estimate for multiple reps', () => {
    expect(calculateE1RM(100, 10)).toBe(133);
  });

  it('returns 0 for invalid input', () => {
    expect(calculateE1RM(0, 5)).toBe(0);
    expect(calculateE1RM(100, 0)).toBe(0);
  });
});

describe('isPersonalRecord', () => {
  it('returns true when no previous record exists', () => {
    expect(isPersonalRecord(80, 10, null)).toBe(true);
  });

  it('detects higher weight as PR', () => {
    expect(isPersonalRecord(105, 8, { weight: 100, reps: 8 })).toBe(true);
  });

  it('detects same weight with more reps as PR', () => {
    expect(isPersonalRecord(100, 10, { weight: 100, reps: 8 })).toBe(true);
  });

  it('returns false when not a PR', () => {
    expect(isPersonalRecord(90, 8, { weight: 100, reps: 8 })).toBe(false);
    expect(isPersonalRecord(100, 6, { weight: 100, reps: 8 })).toBe(false);
  });
});

describe('mergeLogsWithoutDuplicates', () => {
  it('deduplicates by id preferring offline entry', () => {
    const remote = [{ id: 'abc', created_at: '2026-07-13T10:00:00Z', weight: 80, reps: 10 }];
    const offline = [
      { id: 'abc', tempId: 'abc', created_at: '2026-07-13T10:00:00Z', weight: 82, reps: 10 },
    ];

    const result = mergeLogsWithoutDuplicates(remote, offline);
    expect(result).toHaveLength(1);
    expect(result[0].weight).toBe(82);
  });

  it('keeps distinct logs and sorts by created_at', () => {
    type Log = { id?: string; tempId?: string; created_at: string; weight: number; reps: number };
    const remote: Log[] = [{ id: '2', created_at: '2026-07-13T11:00:00Z', weight: 90, reps: 8 }];
    const offline: Log[] = [
      { tempId: '1', created_at: '2026-07-13T10:00:00Z', weight: 80, reps: 10 },
    ];

    const result = mergeLogsWithoutDuplicates(remote, offline);
    expect(result).toHaveLength(2);
    expect(result[0].created_at).toBe('2026-07-13T10:00:00Z');
    expect(result[1].created_at).toBe('2026-07-13T11:00:00Z');
  });
});

describe('calculatePlates', () => {
  it('returns bar only message for low weight', () => {
    expect(calculatePlates(20, 20)).toBe('Nessun disco');
  });

  it('calculates plates for standard load', () => {
    expect(calculatePlates(100, 20)).toBe('20kg, 20kg');
    expect(calculatePlates(60, 20)).toBe('20kg');
  });
});

describe('getStartOfDay', () => {
  it('zeros out time components', () => {
    const date = new Date('2026-07-13T15:30:45.123Z');
    const start = getStartOfDay(date);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);
  });
});

describe('mapUserSettingsRow', () => {
  it('maps timer_secs to recovery_timer', () => {
    const mapped = mapUserSettingsRow({
      timer_secs: 120,
      bar_weight: 20,
      onboarding_completed: false,
    });

    expect(mapped.recovery_timer).toBe(120);
    expect(mapped.bar_weight).toBe(20);
    expect(mapped.onboarding_completed).toBe(false);
  });
});
