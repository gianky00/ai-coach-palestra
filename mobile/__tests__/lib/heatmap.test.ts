import { describe, expect, it } from 'vitest';

import {
  formatHeatmapA11yLabel,
  getHeatmapIntensity,
  getHeatmapLevelLabel,
  normalizeMuscleGroup,
} from '../../src/lib/heatmap';

describe('heatmap a11y helpers', () => {
  it('maps volume thresholds to level labels aligned with color intensity', () => {
    expect(getHeatmapLevelLabel(0)).toBe('inattivo');
    expect(getHeatmapLevelLabel(500)).toBe('basso');
    expect(getHeatmapLevelLabel(1500)).toBe('medio');
    expect(getHeatmapLevelLabel(4000)).toBe('alto');

    expect(getHeatmapIntensity(0)).toBe('#333');
    expect(getHeatmapIntensity(500)).toBe('#006633');
    expect(getHeatmapIntensity(1500)).toBe('#009944');
    expect(getHeatmapIntensity(4000)).toBe('#00ff88');
  });

  it('builds an Italian screen-reader summary for muscle groups', () => {
    const label = formatHeatmapA11yLabel({
      Petto: 4000,
      Schiena: 0,
      Spalle: 800,
      Bicipiti: 1200,
      Gambe: 2500,
      Core: 100,
    });
    expect(label).toContain('Heatmap muscolare:');
    expect(label).toContain('Petto alto');
    expect(label).toContain('Schiena inattivo');
    expect(label).toContain('Spalle basso');
    expect(label).toContain('Bicipiti medio');
    expect(label).toContain('Gambe medio');
    expect(label).toContain('Core basso');
  });

  it('normalizes muscle group aliases', () => {
    expect(normalizeMuscleGroup('pettorali')).toBe('Petto');
    expect(normalizeMuscleGroup('quadricipiti')).toBe('Gambe');
  });
});
