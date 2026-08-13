import { describe, expect, it } from 'vitest';

import {
  buildSmokeSeedExercises,
  buildSmokeSeedPlan,
  clampSeedDays,
  clampSeedSets,
  getSmokeExercisesForDay,
  isSmokeFixtureId,
  muscleGroupForSmokeExercise,
  parseSeedParams,
  SMOKE_EXERCISE_CATALOG,
} from '../../src/lib/smokeSeedPlan';
import { DAYS } from '../../src/lib/utils';

describe('smokeSeedPlan pure helpers', () => {
  it('clamps days and sets', () => {
    expect(clampSeedDays(0)).toBe(1);
    expect(clampSeedDays(100)).toBe(21);
    expect(clampSeedDays(NaN)).toBe(14);
    expect(clampSeedDays(7.6)).toBe(8);
    expect(clampSeedSets(0)).toBe(1);
    expect(clampSeedSets(99)).toBe(6);
    expect(clampSeedSets(Number.NaN)).toBe(3);
    expect(clampSeedSets(2.2)).toBe(2);
  });

  it('parses seed query params with defaults and clamps', () => {
    expect(parseSeedParams(new URLSearchParams(''))).toEqual({ days: 14, sets: 3 });
    expect(parseSeedParams(new URLSearchParams('days=7&sets=3'))).toEqual({ days: 7, sets: 3 });
    expect(parseSeedParams(new URLSearchParams('days=999&sets=0'))).toEqual({ days: 21, sets: 1 });
    expect(parseSeedParams(new URLSearchParams('days=&sets='))).toEqual({ days: 14, sets: 3 });
    expect(parseSeedParams({ get: () => 'not-a-number' })).toEqual({ days: 14, sets: 3 });
  });

  it('recognizes smoke fixture ids only', () => {
    expect(isSmokeFixtureId('smoke-seed-sess-0')).toBe(true);
    expect(isSmokeFixtureId('smoke-seed-log-0-x-s1')).toBe(true);
    expect(isSmokeFixtureId('smoke-session-1')).toBe(true);
    expect(isSmokeFixtureId('real-user-session')).toBe(false);
    expect(isSmokeFixtureId(null)).toBe(false);
    expect(isSmokeFixtureId('')).toBe(false);
    expect(isSmokeFixtureId(undefined)).toBe(false);
  });

  it('maps exercises by training day', () => {
    expect(getSmokeExercisesForDay('LUNEDI').some((e) => e.name === 'Smoke Bench')).toBe(true);
    expect(getSmokeExercisesForDay('giovedi').map((e) => e.name)).toContain('Smoke Curl');
    expect(getSmokeExercisesForDay('unknown')).toEqual([]);
    expect(getSmokeExercisesForDay('')).toEqual([]);
  });

  it('resolves muscle groups for smoke exercise ids', () => {
    expect(muscleGroupForSmokeExercise('smoke-seed-ex-bench')).toBe('Petto');
    expect(muscleGroupForSmokeExercise('smoke-seed-ex-squat')).toBe('Gambe');
    expect(muscleGroupForSmokeExercise('smoke-seed-ex-deadlift')).toBe('Schiena');
    expect(muscleGroupForSmokeExercise('smoke-seed-ex-ohp')).toBe('Spalle');
    expect(muscleGroupForSmokeExercise('smoke-seed-ex-curl')).toBe('Bicipiti');
    expect(muscleGroupForSmokeExercise('missing')).toBe('Varie');
  });

  it('buildSmokeSeedExercises stamps today day', () => {
    const wednesday = new Date(2026, 7, 12);
    const list = buildSmokeSeedExercises(wednesday);
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((e) => e.training_day === DAYS[wednesday.getDay()])).toBe(true);
  });

  it('buildSmokeSeedPlan creates weekday coverage, sets, PR and notes', () => {
    const now = new Date(2026, 7, 13, 12, 0, 0);
    const plan = buildSmokeSeedPlan({ days: 14, sets: 3, now });

    expect(plan.days).toBe(14);
    expect(plan.sets).toBe(3);
    expect(plan.sessions.length).toBeGreaterThanOrEqual(10);
    expect(plan.exercises).toEqual(SMOKE_EXERCISE_CATALOG);

    const allLogs = plan.sessions.flatMap((s) => s.logs);
    expect(allLogs.length).toBeGreaterThan(20);
    expect(allLogs.every((l) => isSmokeFixtureId(l.tempId))).toBe(true);
    expect(allLogs.some((l) => l.isPr)).toBe(true);
    expect(plan.sessions.some((s) => s.note.includes('Smoke note'))).toBe(true);
    expect(allLogs.some((l) => l.set_type === 'W')).toBe(true);
    expect(allLogs.some((l) => l.set_type === 'S')).toBe(true);

    const hasToday = plan.sessions.some((s) => {
      const d = new Date(s.start_time);
      return d.getFullYear() === 2026 && d.getMonth() === 7 && d.getDate() === 13;
    });
    expect(hasToday).toBe(true);
  });

  it('seed plan uses defaults when options omitted and never collides with real uuids', () => {
    const plan = buildSmokeSeedPlan({ now: new Date(2026, 7, 13) });
    expect(plan.days).toBe(14);
    expect(plan.sets).toBe(3);
    for (const s of plan.sessions) {
      expect(isSmokeFixtureId(s.id)).toBe(true);
      for (const l of s.logs) {
        expect(isSmokeFixtureId(l.tempId)).toBe(true);
        expect(l.weight).toBeGreaterThan(0);
        expect(l.reps).toBeGreaterThan(0);
        expect(l.rpe).toBeGreaterThanOrEqual(6);
        expect(l.rpe).toBeLessThanOrEqual(10);
      }
    }
  });

  it('assigns at most one PR on Monday bench top set', () => {
    const plan = buildSmokeSeedPlan({ days: 7, sets: 3, now: new Date(2026, 7, 13) });
    const prs = plan.sessions.flatMap((s) => s.logs).filter((l) => l.isPr);
    expect(prs).toHaveLength(1);
    expect(prs[0]?.exercise_id).toBe('smoke-seed-ex-bench');
  });
});
