import { describe, expect, it } from 'vitest';

import { getHeatmapIntensity, normalizeMuscleGroup } from '../../src/lib/heatmap';
import {
  calculateE1RM,
  calculatePlates,
  DAYS,
  getDateForSelectedDay,
  getPlatesPerSide,
  isPersonalRecord,
  isValidEmail,
  toLocalDateKey,
} from '../../src/lib/utils';

describe('bug-finding: calculateE1RM', () => {
  it('non esplode con reps alte (Brzycki denom ≤ 0)', () => {
    expect(Number.isFinite(calculateE1RM(100, 40))).toBe(true);
    expect(calculateE1RM(100, 40)).toBe(0);
    expect(calculateE1RM(100, 37)).toBe(0);
  });

  it('calcola stima normale', () => {
    expect(calculateE1RM(100, 10)).toBe(133);
  });
});

describe('bug-finding: isPersonalRecord', () => {
  it('rifiuta set vuoti anche senza PR precedente', () => {
    expect(isPersonalRecord(0, 0, null)).toBe(false);
    expect(isPersonalRecord(0, 10, null)).toBe(false);
    expect(isPersonalRecord(80, 0, null)).toBe(false);
  });

  it('accetta primo set valido come PR', () => {
    expect(isPersonalRecord(80, 10, null)).toBe(true);
  });
});

describe('bug-finding: plates', () => {
  it('allinea messaggio bilanciere vuoto', () => {
    expect(calculatePlates(20, 20)).toBe('Solo bilanciere');
    expect(calculatePlates(15, 20)).toBe('Solo bilanciere');
  });

  it('getPlatesPerSide coincide con stringa calculatePlates', () => {
    expect(getPlatesPerSide(100, 20)).toEqual([20, 20]);
    expect(calculatePlates(100, 20)).toBe('20kg, 20kg');
    expect(getPlatesPerSide(60, 20)).toEqual([20]);
  });
});

describe('bug-finding: getDateForSelectedDay', () => {
  it('DAYS allinea Date.getDay()', () => {
    expect(DAYS).toHaveLength(7);
    expect(DAYS[0]).toBe('DOMENICA');
    expect(DAYS[6]).toBe('SABATO');
  });

  it('ritorna oggi per il weekday corrente', () => {
    const todayName = DAYS[new Date().getDay()];
    const d = getDateForSelectedDay(todayName);
    expect(toLocalDateKey(d)).toBe(toLocalDateKey(new Date()));
  });

  it('non va nel futuro per giorni successivi nella settimana', () => {
    const tomorrowIdx = (new Date().getDay() + 1) % 7;
    const d = getDateForSelectedDay(DAYS[tomorrowIdx]);
    expect(d.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('giorno sconosciuto → new Date (fallback)', () => {
    const before = Date.now();
    const d = getDateForSelectedDay('NOTADAY');
    expect(d.getTime()).toBeGreaterThanOrEqual(before - 1000);
  });
});

describe('bug-finding: toLocalDateKey', () => {
  it('non usa UTC (stabile sul fuso locale)', () => {
    const d = new Date(2026, 7, 12, 23, 30, 0); // 12 Aug 2026 local
    expect(toLocalDateKey(d)).toBe('2026-08-12');
  });
});

describe('bug-finding: heatmap', () => {
  it('soglie intensità', () => {
    expect(getHeatmapIntensity(0)).toBe('#333');
    expect(getHeatmapIntensity(500)).toBe('#006633');
    expect(getHeatmapIntensity(1500)).toBe('#009944');
    expect(getHeatmapIntensity(5000)).toBe('#00ff88');
  });

  it('normalizza sinonimi muscolari', () => {
    expect(normalizeMuscleGroup('pettorali')).toBe('Petto');
    expect(normalizeMuscleGroup('Dorso')).toBe('Schiena');
    expect(normalizeMuscleGroup('deltoidi')).toBe('Spalle');
    expect(normalizeMuscleGroup('quadricipiti')).toBe('Gambe');
    expect(normalizeMuscleGroup('addome')).toBe('Core');
    expect(normalizeMuscleGroup('')).toBe('Varie');
    expect(normalizeMuscleGroup('Petto')).toBe('Petto');
    expect(normalizeMuscleGroup('Bicipiti')).toBe('Bicipiti');
    expect(normalizeMuscleGroup('Tricipiti')).toBe('Tricipiti');
    expect(normalizeMuscleGroup('Gambe')).toBe('Gambe');
    expect(normalizeMuscleGroup('Core')).toBe('Core');
    expect(normalizeMuscleGroup('Varie')).toBe('Varie');
    expect(normalizeMuscleGroup('bicipite')).toBe('Bicipiti');
    expect(normalizeMuscleGroup('tricipite')).toBe('Tricipiti');
    expect(normalizeMuscleGroup('altro')).toBe('Varie');
    expect(normalizeMuscleGroup('random-xyz')).toBe('Varie');
  });
});

describe('bug-finding: isValidEmail', () => {
  it('valida email tipiche', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('bad')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});
