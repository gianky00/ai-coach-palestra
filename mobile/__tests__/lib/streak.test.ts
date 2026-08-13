import { describe, expect, it } from 'vitest';

import {
  computeHabitStreak,
  EMPTY_HABIT_STREAK,
  formatStreakA11yLabel,
  formatStreakLabel,
  normalizeHabitStreak,
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

  it('empty dates yields EMPTY-shaped streak', () => {
    const streak = computeHabitStreak([], wed, 3);
    expect(streak).toEqual({ ...EMPTY_HABIT_STREAK, weekTarget: 3 });
  });
});

describe('normalizeHabitStreak / formatters', () => {
  it('clamps negative / NaN fields', () => {
    expect(
      normalizeHabitStreak({
        currentStreak: -2,
        weekCount: Number.NaN,
        weekTarget: 0,
        trainedToday: true,
      }),
    ).toEqual({
      currentStreak: 0,
      weekCount: 0,
      weekTarget: 3,
      trainedToday: true,
    });
  });

  it('formats empty week CTA', () => {
    expect(formatStreakLabel(EMPTY_HABIT_STREAK)).toBe('Inizia · 0/3');
    expect(formatStreakA11yLabel(EMPTY_HABIT_STREAK)).toBe(
      'Nessuna serie attiva. Obiettivo settimanale 0 su 3. Inizia oggi',
    );
  });

  it('formats week progress without active streak', () => {
    expect(
      formatStreakLabel({
        currentStreak: 0,
        weekCount: 1,
        weekTarget: 3,
        trainedToday: false,
      }),
    ).toBe('Sett. 1/3');
    expect(
      formatStreakA11yLabel({
        currentStreak: 0,
        weekCount: 1,
        weekTarget: 3,
        trainedToday: false,
      }),
    ).toBe('Nessuna serie attiva. Obiettivo settimanale 1 su 3');
  });

  it('formats first-day streak and plural', () => {
    expect(
      formatStreakLabel({
        currentStreak: 1,
        weekCount: 1,
        weekTarget: 3,
        trainedToday: true,
      }),
    ).toBe('1 giorno di fila · 1/3');
    expect(
      formatStreakLabel({
        currentStreak: 2,
        weekCount: 2,
        weekTarget: 3,
        trainedToday: true,
      }),
    ).toBe('2 giorni di fila · 2/3');
  });

  it('formats week target met in a11y', () => {
    expect(
      formatStreakA11yLabel({
        currentStreak: 3,
        weekCount: 3,
        weekTarget: 3,
        trainedToday: true,
      }),
    ).toBe('Serie di 3 giorni di fila. Obiettivo settimanale raggiunto: 3 su 3');
    expect(
      formatStreakA11yLabel({
        currentStreak: 0,
        weekCount: 4,
        weekTarget: 3,
        trainedToday: false,
      }),
    ).toBe('Nessuna serie attiva. Obiettivo settimanale raggiunto: 4 su 3');
  });
});
