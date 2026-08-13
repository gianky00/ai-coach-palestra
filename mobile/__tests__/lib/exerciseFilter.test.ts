import { describe, expect, it } from 'vitest';

import {
  filterExercisesByQuery,
  normalizeSearchText,
  searchTokens,
} from '../../src/lib/exerciseFilter';

describe('normalizeSearchText', () => {
  it('trims, lowercases, collapses spaces', () => {
    expect(normalizeSearchText('  Panca   Piana  ')).toBe('panca piana');
  });

  it('folds Italian accents', () => {
    expect(normalizeSearchText('Pànca')).toBe('panca');
    expect(normalizeSearchText('Perché')).toBe('perche');
    expect(normalizeSearchText('Caffè')).toBe('caffe');
  });

  it('returns empty for blank', () => {
    expect(normalizeSearchText('')).toBe('');
    expect(normalizeSearchText('   ')).toBe('');
  });
});

describe('searchTokens', () => {
  it('splits multi-word queries', () => {
    expect(searchTokens('  panca   piana ')).toEqual(['panca', 'piana']);
  });

  it('returns empty for blank', () => {
    expect(searchTokens('')).toEqual([]);
    expect(searchTokens('   ')).toEqual([]);
  });
});

describe('filterExercisesByQuery', () => {
  const items = [
    { name: 'Panca piana', muscle_group: 'Petto' },
    { name: 'Squat', muscle_group: 'Gambe' },
    { name: 'Rematore', muscle_group: 'Dorso' },
    { name: 'Panca inclinata', muscle_group: 'Petto' },
    { name: 'Curl bilanciere', muscle_group: 'Bicipiti' },
  ];

  it('returns all when query empty', () => {
    expect(filterExercisesByQuery(items, '  ')).toHaveLength(5);
  });

  it('filters by name', () => {
    expect(filterExercisesByQuery(items, 'squat')).toEqual([items[1]]);
  });

  it('filters by muscle group', () => {
    expect(filterExercisesByQuery(items, 'gambe')).toEqual([items[1]]);
  });

  it('matches accented query against plain catalog names', () => {
    expect(filterExercisesByQuery(items, 'pànca')).toEqual([items[0], items[3]]);
  });

  it('matches plain query against accented catalog names', () => {
    const accented = [{ name: 'Pànca piana', muscle_group: 'Pètto' }, ...items.slice(1)];
    expect(filterExercisesByQuery(accented, 'panca')).toEqual([accented[0], accented[3]]);
    expect(filterExercisesByQuery(accented, 'petto')).toEqual([accented[0], accented[3]]);
  });

  it('requires all tokens (AND) across name + group', () => {
    expect(filterExercisesByQuery(items, 'panca petto')).toEqual([items[0], items[3]]);
    expect(filterExercisesByQuery(items, 'panca gambe')).toEqual([]);
    expect(filterExercisesByQuery(items, 'curl bicipiti')).toEqual([items[4]]);
  });

  it('handles null muscle_group', () => {
    const mixed = [{ name: 'Plank', muscle_group: null }];
    expect(filterExercisesByQuery(mixed, 'plank')).toEqual(mixed);
    expect(filterExercisesByQuery(mixed, 'core')).toEqual([]);
  });
});
