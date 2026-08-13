import { describe, expect, it } from 'vitest';

import { filterExercisesByQuery } from '../../src/lib/exerciseFilter';

describe('filterExercisesByQuery', () => {
  const items = [
    { name: 'Panca piana', muscle_group: 'Petto' },
    { name: 'Squat', muscle_group: 'Gambe' },
    { name: 'Rematore', muscle_group: 'Dorso' },
  ];

  it('returns all when query empty', () => {
    expect(filterExercisesByQuery(items, '  ')).toHaveLength(3);
  });

  it('filters by name', () => {
    expect(filterExercisesByQuery(items, 'panca')).toEqual([items[0]]);
  });

  it('filters by muscle group', () => {
    expect(filterExercisesByQuery(items, 'gambe')).toEqual([items[1]]);
  });
});
