import { describe, expect, it } from 'vitest';

import {
  buildExerciseMetaCatalog,
  mergeExerciseMetaCatalogs,
  resolveExerciseMeta,
  smokeExerciseMetaCatalog,
  UNKNOWN_EXERCISE_META,
} from '../../src/lib/exerciseMeta';

describe('exerciseMeta', () => {
  it('resolves smoke catalog ids without overrides', () => {
    const meta = resolveExerciseMeta('smoke-seed-ex-bench');
    expect(meta).toEqual({ name: 'Smoke Bench', muscle_group: 'Petto' });
  });

  it('prefers caller catalog over smoke', () => {
    const catalog = buildExerciseMetaCatalog([
      { id: 'smoke-seed-ex-bench', name: 'Panca locale', muscle_group: 'Petto' },
    ]);
    expect(resolveExerciseMeta('smoke-seed-ex-bench', catalog)).toEqual({
      name: 'Panca locale',
      muscle_group: 'Petto',
    });
  });

  it('falls back to unknown meta', () => {
    expect(resolveExerciseMeta('missing-id')).toEqual(UNKNOWN_EXERCISE_META);
    expect(resolveExerciseMeta(null)).toEqual(UNKNOWN_EXERCISE_META);
    expect(resolveExerciseMeta('')).toEqual(UNKNOWN_EXERCISE_META);
  });

  it('buildExerciseMetaCatalog trims blanks to defaults', () => {
    const map = buildExerciseMetaCatalog([
      { id: 'e1', name: '  ', muscle_group: null },
      { id: '', name: 'skip' },
    ]);
    expect(map.get('e1')).toEqual(UNKNOWN_EXERCISE_META);
    expect(map.has('')).toBe(false);
  });

  it('mergeExerciseMetaCatalogs lets overrides win', () => {
    const base = smokeExerciseMetaCatalog();
    const overrides = buildExerciseMetaCatalog([
      { id: 'custom', name: 'Curl', muscle_group: 'Bicipiti' },
    ]);
    const merged = mergeExerciseMetaCatalogs(base, overrides);
    expect(merged.get('custom')).toEqual({ name: 'Curl', muscle_group: 'Bicipiti' });
    expect(merged.get('smoke-seed-ex-bench')?.name).toBe('Smoke Bench');
  });
});
