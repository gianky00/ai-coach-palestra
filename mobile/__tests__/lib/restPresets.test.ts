import { describe, expect, it } from 'vitest';

import {
  formatRestDurationA11y,
  formatRestPresetA11yLabel,
  formatRestPresetLabel,
  isRestPreset,
  REST_PRESETS_SECONDS,
} from '../../src/lib/restPresets';

describe('restPresets', () => {
  it('exposes standard recovery chips', () => {
    expect(REST_PRESETS_SECONDS).toEqual([60, 90, 120, 180]);
  });

  it('formats compact Italian labels', () => {
    expect(formatRestPresetLabel(45)).toBe('45s');
    expect(formatRestPresetLabel(60)).toBe('1 min');
    expect(formatRestPresetLabel(90)).toBe('1:30');
    expect(formatRestPresetLabel(120)).toBe('2 min');
    expect(formatRestPresetLabel(180)).toBe('3 min');
    expect(formatRestPresetLabel(0)).toBe('0s');
  });

  it('formats shared a11y labels', () => {
    expect(formatRestDurationA11y(90)).toBe('1 minuto e 30 secondi');
    expect(formatRestPresetA11yLabel(60)).toBe('Avvia recupero 1 minuto');
    expect(formatRestPresetA11yLabel(180)).toBe('Avvia recupero 3 minuti');
    expect(formatRestPresetA11yLabel(45)).toBe('Avvia recupero 45 secondi');
  });

  it('detects known presets', () => {
    expect(isRestPreset(90)).toBe(true);
    expect(isRestPreset(75)).toBe(false);
  });
});
