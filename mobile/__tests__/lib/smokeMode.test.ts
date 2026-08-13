import { describe, expect, it } from 'vitest';

import {
  isSmokeActive,
  isSmokeDataMode,
  isSmokeFixtureExercise,
  parseSeedParams,
  parseSmokeUrl,
  SMOKE_FIXTURE_EXERCISE,
} from '../../src/lib/smokeMode';

describe('smokeMode', () => {
  it('parses auth tabs seed clear', () => {
    expect(parseSmokeUrl(null)).toEqual({ kind: 'off' });
    expect(parseSmokeUrl('kinefit://smoke/auth')).toEqual({ kind: 'auth' });
    expect(parseSmokeUrl('kinefit://smoke/seed?days=7&sets=3')).toEqual({
      kind: 'seed',
      days: 7,
      sets: 3,
    });
    expect(parseSmokeUrl('kinefit://smoke/clear')).toEqual({ kind: 'clear' });
    expect(parseSmokeUrl('kinefit://smoke/tabs?timer=90&modal=log&pr=1')).toMatchObject({
      kind: 'tabs',
      timerSeconds: 90,
      modal: 'log',
      showPrToast: true,
    });
  });
  it('helpers', () => {
    expect(parseSeedParams(new URLSearchParams('days=999&sets=0'))).toEqual({ days: 21, sets: 1 });
    expect(isSmokeActive({ kind: 'seed', days: 1, sets: 1 })).toBe(true);
    expect(isSmokeDataMode({ kind: 'clear' })).toBe(true);
    expect(isSmokeFixtureExercise(SMOKE_FIXTURE_EXERCISE)).toBe(true);
  });
});
