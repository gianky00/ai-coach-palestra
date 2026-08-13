import { describe, expect, it } from 'vitest';

import {
  isSmokeActive,
  isSmokeFixtureExercise,
  parseSmokeUrl,
  SMOKE_FIXTURE_EXERCISE,
  SMOKE_TAB_ROUTES,
} from '../../src/lib/smokeMode';

describe('smokeMode', () => {
  it('returns off for empty or unrelated urls', () => {
    expect(parseSmokeUrl(null)).toEqual({ kind: 'off' });
    expect(parseSmokeUrl(undefined)).toEqual({ kind: 'off' });
    expect(parseSmokeUrl('https://example.com')).toEqual({ kind: 'off' });
    expect(parseSmokeUrl('kinefit://settings')).toEqual({ kind: 'off' });
    expect(parseSmokeUrl('not a url at all :::')).toEqual({ kind: 'off' });
    expect(parseSmokeUrl('kinefit://smoke/other')).toEqual({ kind: 'off' });
  });

  it('parses auth smoke deep link', () => {
    expect(parseSmokeUrl('kinefit://smoke/auth')).toEqual({ kind: 'auth' });
    expect(parseSmokeUrl('kinefit:///smoke/auth')).toEqual({ kind: 'auth' });
  });

  it('parses tabs smoke deep link with default and explicit tab', () => {
    expect(parseSmokeUrl('kinefit://smoke/tabs')).toEqual({
      kind: 'tabs',
      tab: 'oggi',
      timerSeconds: undefined,
      modal: undefined,
    });
    expect(parseSmokeUrl('kinefit://smoke/tabs?tab=storico')).toEqual({
      kind: 'tabs',
      tab: 'storico',
      timerSeconds: undefined,
      modal: undefined,
    });
    expect(parseSmokeUrl('kinefit://smoke/tabs?tab=analisi')).toEqual({
      kind: 'tabs',
      tab: 'analisi',
      timerSeconds: undefined,
      modal: undefined,
    });
    expect(parseSmokeUrl('kinefit://smoke/tabs?tab=profilo')).toEqual({
      kind: 'tabs',
      tab: 'profilo',
      timerSeconds: undefined,
      modal: undefined,
    });
  });

  it('parses timer and modal query params', () => {
    expect(parseSmokeUrl('kinefit://smoke/tabs?tab=oggi&timer=90')).toEqual({
      kind: 'tabs',
      tab: 'oggi',
      timerSeconds: 90,
      modal: undefined,
    });
    expect(parseSmokeUrl('kinefit://smoke/tabs?tab=oggi&modal=log')).toEqual({
      kind: 'tabs',
      tab: 'oggi',
      timerSeconds: undefined,
      modal: 'log',
    });
    expect(parseSmokeUrl('kinefit://smoke/tabs?tab=profilo&modal=weight')).toEqual({
      kind: 'tabs',
      tab: 'profilo',
      timerSeconds: undefined,
      modal: 'weight',
    });
    expect(parseSmokeUrl('kinefit://smoke/tabs?tab=storico&modal=session')).toEqual({
      kind: 'tabs',
      tab: 'storico',
      timerSeconds: undefined,
      modal: 'session',
    });
  });

  it('ignores invalid timer/modal values', () => {
    expect(parseSmokeUrl('kinefit://smoke/tabs?timer=5')).toMatchObject({
      timerSeconds: undefined,
    });
    expect(parseSmokeUrl('kinefit://smoke/tabs?modal=oauth')).toMatchObject({ modal: undefined });
  });

  it('falls back to oggi for invalid tab', () => {
    expect(parseSmokeUrl('kinefit://smoke/tabs?tab=unknown')).toMatchObject({
      kind: 'tabs',
      tab: 'oggi',
    });
  });

  it('maps tabs to navigator route names', () => {
    expect(SMOKE_TAB_ROUTES.oggi).toBe('Oggi');
    expect(SMOKE_TAB_ROUTES.storico).toBe('Storico');
  });

  it('isSmokeActive detects non-off modes', () => {
    expect(isSmokeActive({ kind: 'off' })).toBe(false);
    expect(isSmokeActive({ kind: 'auth' })).toBe(true);
    expect(isSmokeActive({ kind: 'tabs', tab: 'oggi' })).toBe(true);
  });

  it('recognizes smoke fixture exercise', () => {
    expect(isSmokeFixtureExercise(SMOKE_FIXTURE_EXERCISE)).toBe(true);
    expect(isSmokeFixtureExercise({ id: 'other' })).toBe(false);
  });
});
