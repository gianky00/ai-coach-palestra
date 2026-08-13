import { describe, expect, it } from 'vitest';

import {
  formatRestPresetLabel,
  isRestPreset,
  REST_PRESETS_SECONDS,
} from '../../src/lib/restPresets';

describe('restPresets', () => {
  it('exposes standard recovery chips', () => {
    expect(REST_PRESETS_SECONDS).toEqual([60, 90, 120, 180]);
  });

  it('formats labels', () => {
    expect(formatRestPresetLabel(45)).toBe('45s');
    expect(formatRestPresetLabel(60)).toBe('1:00');
    expect(formatRestPresetLabel(90)).toBe('1:30');
    expect(formatRestPresetLabel(120)).toBe('2:00');
    expect(formatRestPresetLabel(0)).toBe('0s');
  });

  it('detects known presets', () => {
    expect(isRestPreset(90)).toBe(true);
    expect(isRestPreset(75)).toBe(false);
  });
});
