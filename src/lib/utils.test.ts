import { describe, expect, it } from 'vitest';

import { calculateE1RM, getMuscleColor } from './utils';

describe('Workout Utilities', () => {
  describe('calculateE1RM', () => {
    it('should return the weight itself if reps is 1', () => {
      expect(calculateE1RM(100, 1)).toBe(100);
    });

    it('should correctly calculate e1RM for multiple reps', () => {
      // 100kg x 10 reps should be ~133kg based on Brzycki formula
      expect(calculateE1RM(100, 10)).toBe(133);
    });

    it('should return 0 for invalid inputs', () => {
      // Not strictly defined but safe check
      expect(calculateE1RM(0, 10)).toBe(0);
    });
  });

  describe('getMuscleColor', () => {
    it('should return correct color for Petto', () => {
      expect(getMuscleColor('Petto')).toBe('var(--color-petto)');
    });

    it('should handle COMPEX notes override', () => {
      expect(getMuscleColor('Any', 'COMPEX')).toBe('var(--color-compex)');
    });

    it('should return default color for unknown groups', () => {
      expect(getMuscleColor('Unknown')).toBe('var(--color-default)');
    });
  });
});
