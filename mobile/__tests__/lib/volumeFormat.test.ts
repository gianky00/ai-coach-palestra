import { describe, expect, it } from 'vitest';

import { formatItInt, formatVolumeA11yLabel, formatVolumeKg } from '../../src/lib/volumeFormat';

describe('formatItInt', () => {
  it('groups thousands with a dot', () => {
    expect(formatItInt(0)).toBe('0');
    expect(formatItInt(999)).toBe('999');
    expect(formatItInt(1250)).toBe('1.250');
    expect(formatItInt(10_000)).toBe('10.000');
  });
});

describe('formatVolumeKg', () => {
  it('formats zero and small totals', () => {
    expect(formatVolumeKg(0)).toBe('0 kg');
    expect(formatVolumeKg(12.4)).toBe('12 kg');
    expect(formatVolumeKg(350)).toBe('350 kg');
  });

  it('uses Italian thousands separator', () => {
    expect(formatVolumeKg(1250)).toBe('1.250 kg');
    expect(formatVolumeKg(10_000)).toBe('10.000 kg');
  });

  it('clamps non-finite / negative to zero', () => {
    expect(formatVolumeKg(-5)).toBe('0 kg');
    expect(formatVolumeKg(Number.NaN)).toBe('0 kg');
    expect(formatVolumeKg(Number.POSITIVE_INFINITY)).toBe('0 kg');
  });
});

describe('formatVolumeA11yLabel', () => {
  it('speaks zero and positive totals', () => {
    expect(formatVolumeA11yLabel(0)).toBe('Volume di oggi: zero chilogrammi');
    expect(formatVolumeA11yLabel(1250)).toBe('Volume di oggi: 1.250 chilogrammi');
  });
});
