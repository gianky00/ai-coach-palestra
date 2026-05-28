import { describe, expect, it } from 'vitest';
import { getExerciseAsset, getMuscleGroupFallback, getExerciseGuide } from './exerciseAssets';

describe('exerciseAssets', () => {
  describe('getExerciseAsset', () => {
    it('returns default fallback if name is empty', () => {
      expect(getExerciseAsset('')).toBe('/assets/exercises/groups/default.jpg');
    });

    it('returns simplified mapped names correctly', () => {
      expect(getExerciseAsset(' Panca piana ')).toBe('/assets/exercises/panca_piana.jpg');
      expect(getExerciseAsset('lat machine avanti')).toBe(
        '/assets/exercises/lat_machine_avanti.jpg',
      );
      expect(getExerciseAsset('lat machine presa inversa')).toBe(
        '/assets/exercises/lat_machine_presa_inversa.jpg',
      );
      expect(getExerciseAsset('Leg Extension')).toBe('/assets/exercises/leg_extension.jpg');
      expect(getExerciseAsset('leg press 45')).toBe('/assets/exercises/leg_press_45°.jpg');
      expect(getExerciseAsset('calf seduto')).toBe('/assets/exercises/calf_seduto.jpg');
      expect(getExerciseAsset('calf in piedi')).toBe('/assets/exercises/calf_in-piedi.jpg');
    });

    it('returns formatted filename for other exercises', () => {
      expect(getExerciseAsset('Curl concentrato')).toBe('/assets/exercises/curl_concentrato.jpg');
      expect(getExerciseAsset('Squat')).toBe('/assets/exercises/squat.jpg');
    });
  });

  describe('getMuscleGroupFallback', () => {
    it('returns default fallback if group is empty', () => {
      expect(getMuscleGroupFallback('')).toBe('/assets/exercises/groups/default.jpg');
    });

    it('returns correct image for valid groups', () => {
      expect(getMuscleGroupFallback('petto')).toBe('/assets/exercises/groups/petto.jpg');
      expect(getMuscleGroupFallback(' PETTO ')).toBe('/assets/exercises/groups/petto.jpg');
      expect(getMuscleGroupFallback('schiena')).toBe('/assets/exercises/groups/schiena.jpg');
      expect(getMuscleGroupFallback('gambe')).toBe('/assets/exercises/groups/gambe.jpg');
    });

    it('returns default fallback for invalid groups', () => {
      expect(getMuscleGroupFallback('unknown')).toBe('/assets/exercises/groups/default.jpg');
    });
  });

  describe('getExerciseGuide', () => {
    it('returns default guide if name is empty', () => {
      expect(getExerciseGuide('', '')).toHaveLength(3);
    });

    it('returns specific guide for known exercise', () => {
      const guide = getExerciseGuide('panca piana', 'petto');
      expect(guide[0]).toContain('Mantieni le scapole addotte e depresse');
    });

    it('returns specific guide for known exercise (partial match)', () => {
      const guide = getExerciseGuide('panca piana con manubri', 'petto');
      expect(guide[0]).toContain('Mantieni le scapole addotte e depresse');
    });

    it('returns muscle group fallback if exercise is unknown', () => {
      const guide = getExerciseGuide('unknown exercise', 'dorso');
      expect(guide[0]).toContain('Conduci il movimento guidando con i gomiti'); // schiena fallback
    });

    it('handles all muscle group synonyms', () => {
      expect(getExerciseGuide('unknown', 'schiena')[0]).toContain('guidando con i gomiti');
      expect(getExerciseGuide('unknown', 'pettorali')[0]).toContain('Adduci le scapole');
      expect(getExerciseGuide('unknown', 'glutei')[0]).toContain('attraverso il tallone');
      expect(getExerciseGuide('unknown', 'deltoidi')[0]).toContain('rilassa i trapezi');
      expect(getExerciseGuide('unknown', 'bicipiti')[0]).toContain(
        'gomiti stretti lungo i fianchi',
      );
      expect(getExerciseGuide('unknown', 'tricipiti')[0]).toContain('gomiti stabili e bloccati');
      expect(getExerciseGuide('unknown', 'addominali')[0]).toContain(
        'avvicinare il costato al bacino',
      );
      expect(getExerciseGuide('unknown', 'core')[0]).toContain('avvicinare il costato al bacino');
    });

    it('returns default fallback if group is also unknown', () => {
      const guide = getExerciseGuide('unknown', 'unknown');
      expect(guide[0]).toContain('lento e controllato');
    });
  });
});
