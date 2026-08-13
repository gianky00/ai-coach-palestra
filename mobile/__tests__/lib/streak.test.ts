import { describe, expect, it } from 'vitest';

import {
  computeHabitStreak,
  formatStreakLabel,
  sessionDatesToKeys,
  startOfWeekMondayKey,
} from '../../src/lib/streak';

describe('sessionDatesToKeys', () => {
  it('dedupes and sorts desc by local day', () => {
    const keys = sessionDatesToKeys([
      '2026-08-13T08:00:00',
      '2026-08-13T20:00:00',
      '2026-08-12T10:00:00',
      null,
      'invalid',
    ]);
    expect(keys[0]).toBe('2026-08-13');
    expect(keys).toContain('2026-08-12');
    expect(keys.filter((k) => k === '2026-08-13')).toHaveLength(1);
  });
});

describe('startOfWeekMondayKey', () => {
  it('returns Monday for a Wednesday', () => {
    // 2026-08-12 is Wednesday
    expect(startOfWeekMondayKey('2026-08-12')).toBe('2026-08-10');
  });

  it('returns Monday for a Sunday', () => {
    // 2026-08-16 is Sunday → week starts 2026-08-10
    expect(startOfWeekMondayKey('2026-08-16')).toBe('2026-08-10');
  });
});

describe('computeHabitStreak', () => {
  const wed = new Date(2026, 7, 12, 15, 0, 0); // local Wed Aug 12 2026

  it('counts streak ending today', () => {
    const streak = computeHabitStreak(
      ['2026-08-12T10:00:00', '2026-08-11T10:00:00', '2026-08-10T10:00:00'],
      wed,
      3,
    );
    expect(streak.currentStreak).toBe(3);
    expect(streak.trainedToday).toBe(true);
    expect(streak.weekCount).toBe(3);
  });

  it('keeps streak via yesterday if today empty', () => {
    const streak = computeHabitStreak(['2026-08-11T10:00:00', '2026-08-10T10:00:00'], wed, 4);
    expect(streak.trainedToday).toBe(false);
    expect(streak.currentStreak).toBe(2);
  });

  it('resets streak when gap before yesterday', () => {
    // 2026-08-09 is Sunday → previous ISO week (Mon 2026-08-03), not current week (Mon 2026-08-10)
    const streak = computeHabitStreak(['2026-08-09T10:00:00'], wed, 3);
    expect(streak.currentStreak).toBe(0);
    expect(streak.weekCount).toBe(0);
  });

  it('formats label', () => {
    expect(
      formatStreakLabel({
        currentStreak: 0,
        weekCount: 1,
        weekTarget: 3,
        trainedToday: false,
      }),
    ).toBe('Settimana 1/3');
    expect(
      formatStreakLabel({
        currentStreak: 2,
        weekCount: 2,
        weekTarget: 3,
        trainedToday: true,
      }),
    ).toBe('2 giorni · 2/3');
  });
});
