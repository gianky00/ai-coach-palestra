import { describe, expect, it } from 'vitest';

import {
  computeSessionDurationMins,
  formatSessionDurationA11y,
  formatSessionDurationLabel,
} from '../../src/lib/sessionDuration';

describe('computeSessionDurationMins', () => {
  it('returns whole minutes between ISO timestamps', () => {
    expect(computeSessionDurationMins('2026-08-13T18:00:00.000Z', '2026-08-13T19:15:00.000Z')).toBe(
      75,
    );
  });

  it('returns null when end is missing or invalid', () => {
    expect(computeSessionDurationMins('2026-08-13T18:00:00.000Z', null)).toBeNull();
    expect(computeSessionDurationMins(undefined, '2026-08-13T19:00:00.000Z')).toBeNull();
    expect(computeSessionDurationMins('not-a-date', '2026-08-13T19:00:00.000Z')).toBeNull();
    expect(
      computeSessionDurationMins('2026-08-13T19:00:00.000Z', '2026-08-13T18:00:00.000Z'),
    ).toBeNull();
  });
});

describe('formatSessionDurationLabel', () => {
  it('formats under/over an hour and unknown', () => {
    expect(formatSessionDurationLabel(null)).toBe('—');
    expect(formatSessionDurationLabel(0)).toBe('0 min');
    expect(formatSessionDurationLabel(45)).toBe('45 min');
    expect(formatSessionDurationLabel(60)).toBe('1h');
    expect(formatSessionDurationLabel(90)).toBe('1h 30m');
  });
});

describe('formatSessionDurationA11y', () => {
  it('speaks Italian duration phrases', () => {
    expect(formatSessionDurationA11y(null)).toBe('Durata non disponibile');
    expect(formatSessionDurationA11y(0)).toBe('Durata: meno di un minuto');
    expect(formatSessionDurationA11y(1)).toBe('Durata: 1 minuto');
    expect(formatSessionDurationA11y(45)).toBe('Durata: 45 minuti');
    expect(formatSessionDurationA11y(60)).toBe('Durata: 1 ora');
    expect(formatSessionDurationA11y(90)).toBe('Durata: 1 ora e 30 minuti');
    expect(formatSessionDurationA11y(120)).toBe('Durata: 2 ore');
  });
});
