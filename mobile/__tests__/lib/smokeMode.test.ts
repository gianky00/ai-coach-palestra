import { describe, expect, it } from 'vitest';

import { isSmokeActive, parseSmokeUrl, SMOKE_TAB_ROUTES } from '../../src/lib/smokeMode';

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
    expect(parseSmokeUrl('kinefit://smoke/tabs')).toEqual({ kind: 'tabs', tab: 'oggi' });
    expect(parseSmokeUrl('kinefit://smoke/tabs?tab=storico')).toEqual({
      kind: 'tabs',
      tab: 'storico',
    });
    expect(parseSmokeUrl('kinefit://smoke/tabs?tab=analisi')).toEqual({
      kind: 'tabs',
      tab: 'analisi',
    });
    expect(parseSmokeUrl('kinefit://smoke/tabs?tab=profilo')).toEqual({
      kind: 'tabs',
      tab: 'profilo',
    });
  });

  it('falls back to oggi for invalid tab', () => {
    expect(parseSmokeUrl('kinefit://smoke/tabs?tab=unknown')).toEqual({
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
});
