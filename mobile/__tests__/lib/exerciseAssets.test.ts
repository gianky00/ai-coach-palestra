import { describe, expect, it } from 'vitest';

import {
  getExerciseAsset,
  getExerciseGuide,
  getMuscleGroupFallback,
} from '../../src/lib/exerciseAssets';

describe('exerciseAssets', () => {
  it('getExerciseAsset mappa nomi noti e fallback filename', () => {
    expect(getExerciseAsset('')).toContain('default.jpg');
    expect(getExerciseAsset('Panca Piana bilanciere')).toContain('panca_piana.jpg');
    expect(getExerciseAsset('Lat Machine Avanti')).toContain('lat_machine_avanti.jpg');
    expect(getExerciseAsset('Lat Machine presa inversa')).toContain('lat_machine_presa_inversa');
    expect(getExerciseAsset('Leg Extension')).toContain('leg_extension');
    expect(getExerciseAsset('Leg Press 45')).toContain('leg_press');
    expect(getExerciseAsset('Calf seduto')).toContain('calf_seduto');
    expect(getExerciseAsset('Calf in piedi')).toContain('calf_in-piedi');
    expect(getExerciseAsset('Curl bilanciere')).toContain('curl_bilanciere.jpg');
  });

  it('getMuscleGroupFallback valida gruppi e default', () => {
    expect(getMuscleGroupFallback('')).toContain('default.jpg');
    expect(getMuscleGroupFallback('Petto')).toContain('/petto.jpg');
    expect(getMuscleGroupFallback('SCHIENA')).toContain('/schiena.jpg');
    expect(getMuscleGroupFallback('ignoto')).toContain('default.jpg');
  });

  it('getExerciseGuide: esatta, parziale, gruppo, default', () => {
    expect(getExerciseGuide('', '')).toHaveLength(3);
    const panca = getExerciseGuide('panca piana', 'petto');
    expect(panca.length).toBe(3);
    expect(panca[0].length).toBeGreaterThan(10);

    expect(getExerciseGuide('esercizio custom', 'dorso')[0].length).toBeGreaterThan(5);
    expect(getExerciseGuide('x', 'pettorali')[0].length).toBeGreaterThan(5);
    expect(getExerciseGuide('x', 'glutei')[0].length).toBeGreaterThan(5);
    expect(getExerciseGuide('x', 'deltoidi')[0].length).toBeGreaterThan(5);
    expect(getExerciseGuide('x', 'bicipiti')[0].length).toBeGreaterThan(5);
    expect(getExerciseGuide('x', 'tricipiti')[0].length).toBeGreaterThan(5);
    expect(getExerciseGuide('x', 'core')[0].length).toBeGreaterThan(5);
    expect(getExerciseGuide('sconosciuto totale', 'xyzzy')[0].length).toBeGreaterThan(5);
  });
});
