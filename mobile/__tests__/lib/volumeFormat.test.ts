import { describe, expect, it } from 'vitest';

import {
  computeSessionVolumeKg,
  formatItInt,
  formatVolumeA11yLabel,
  formatVolumeKg,
} from '../../src/lib/volumeFormat';

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
  it('speaks today totals by default', () => {
    expect(formatVolumeA11yLabel(0)).toBe('Volume di oggi: zero chilogrammi');
    expect(formatVolumeA11yLabel(1250)).toBe('Volume di oggi: 1.250 chilogrammi');
  });

  it('speaks session totals when context is session', () => {
    expect(formatVolumeA11yLabel(0, 'session')).toBe('Volume sessione: zero chilogrammi');
    expect(formatVolumeA11yLabel(1250, 'session')).toBe('Volume sessione: 1.250 chilogrammi');
  });
});

describe('computeSessionVolumeKg', () => {
  it('sums weight × reps across logs', () => {
    expect(
      computeSessionVolumeKg([
        { weight: 100, reps: 5 },
        { weight: 80, reps: 8 },
      ]),
    ).toBe(1140);
  });

  it('treats empty / missing logs as zero', () => {
    expect(computeSessionVolumeKg(undefined)).toBe(0);
    expect(computeSessionVolumeKg(null)).toBe(0);
    expect(computeSessionVolumeKg([])).toBe(0);
  });

  it('ignores nullish and non-finite set values', () => {
    expect(
      computeSessionVolumeKg([
        { weight: null, reps: 5 },
        { weight: 60, reps: undefined },
        { weight: Number.NaN, reps: 3 },
        { weight: 40, reps: 10 },
      ]),
    ).toBe(400);
  });

  it('clamps negative products to zero total when all invalid', () => {
    expect(computeSessionVolumeKg([{ weight: -10, reps: 5 }])).toBe(0);
  });
});
