import { describe, expect, it } from 'vitest';

import { calculateE1RM, calculatePlates, DAYS, getMuscleColor, getStartOfDay } from './utils';

describe('Workout Utilities', () => {
  describe('calculateE1RM', () => {
    it('should return the weight itself if reps is 1', () => {
      expect(calculateE1RM(100, 1)).toBe(100);
    });

    it('should correctly calculate e1RM for multiple reps', () => {
      expect(calculateE1RM(100, 10)).toBe(133);
    });

    it('should return 0 for invalid inputs', () => {
      expect(calculateE1RM(0, 10)).toBe(0);
    });
  });

  describe('getMuscleColor', () => {
    it('should return correct color for Petto', () => {
      expect(getMuscleColor('Petto')).toBe('var(--color-petto)');
    });

    it('should return correct color for Dorso/Schiena', () => {
      expect(getMuscleColor('Dorso')).toBe('var(--color-dorso)');
      expect(getMuscleColor('Schiena')).toBe('var(--color-dorso)');
    });

    it('should return correct color for Gambe/Quad/Femor', () => {
      expect(getMuscleColor('Gambe')).toBe('var(--color-gambe)');
      expect(getMuscleColor('Quad')).toBe('var(--color-gambe)');
      expect(getMuscleColor('Femor')).toBe('var(--color-gambe)');
    });

    it('should return correct color for Spalle/Delto', () => {
      expect(getMuscleColor('Spalle')).toBe('var(--color-spalle)');
      expect(getMuscleColor('Delto')).toBe('var(--color-spalle)');
    });

    it('should return correct color for Braccia/Bici/Trici', () => {
      expect(getMuscleColor('Braccia')).toBe('var(--color-braccia)');
      expect(getMuscleColor('Bici')).toBe('var(--color-braccia)');
      expect(getMuscleColor('Trici')).toBe('var(--color-braccia)');
    });

    it('should return correct color for Core/Addo', () => {
      expect(getMuscleColor('Core')).toBe('var(--color-core)');
      expect(getMuscleColor('Addo')).toBe('var(--color-core)');
    });

    it('should handle COMPEX notes override', () => {
      expect(getMuscleColor('Any', 'COMPEX')).toBe('var(--color-compex)');
    });

    it('should return default color for unknown groups', () => {
      expect(getMuscleColor('Unknown')).toBe('var(--color-default)');
    });
  });

  describe('DAYS', () => {
    it('should contain all 7 days', () => {
      expect(DAYS).toHaveLength(7);
      expect(DAYS[0]).toBe('DOMENICA');
      expect(DAYS[6]).toBe('SABATO');
    });
  });

  describe('calculatePlates', () => {
    it('should return Solo bilanciere if totalWeight is less than barWeight', () => {
      expect(calculatePlates(10, 20)).toBe('Solo bilanciere');
    });

    it('should return Nessun disco if totalWeight equals barWeight', () => {
      expect(calculatePlates(20, 20)).toBe('Nessun disco');
    });

    it('should calculate correct plates for given weight', () => {
      // 100kg total - 20kg bar = 80kg / 2 = 40kg per side
      // 40kg = 20kg + 20kg
      expect(calculatePlates(100, 20)).toBe('20kg, 20kg');

      // 65kg total - 20kg bar = 45kg / 2 = 22.5kg per side
      // 22.5kg = 20kg + 2.5kg
      expect(calculatePlates(65, 20)).toBe('20kg, 2.5kg');
    });
  });

  describe('getStartOfDay', () => {
    it('should return start of the day for a given date', () => {
      const date = new Date('2023-10-27T15:30:45.123Z');
      const startOfDay = getStartOfDay(date);
      expect(startOfDay.getHours()).toBe(0);
      expect(startOfDay.getMinutes()).toBe(0);
      expect(startOfDay.getSeconds()).toBe(0);
      expect(startOfDay.getMilliseconds()).toBe(0);
    });

    it('should use current date if no date is provided', () => {
      const startOfDay = getStartOfDay();
      expect(startOfDay.getHours()).toBe(0);
      expect(startOfDay.getMinutes()).toBe(0);
      expect(startOfDay.getSeconds()).toBe(0);
      expect(startOfDay.getMilliseconds()).toBe(0);
    });
  });
});
