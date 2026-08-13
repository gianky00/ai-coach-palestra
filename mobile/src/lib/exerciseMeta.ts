import { SMOKE_EXERCISE_CATALOG } from './smokeSeedPlan';

export type ExerciseMeta = {
  name: string;
  muscle_group: string;
};

const SMOKE_META_BY_ID: ReadonlyMap<string, ExerciseMeta> = new Map(
  SMOKE_EXERCISE_CATALOG.map((e) => [e.id, { name: e.name, muscle_group: e.muscle_group }]),
);

/** Default when exercise id is unknown offline. */
export const UNKNOWN_EXERCISE_META: ExerciseMeta = {
  name: 'Esercizio',
  muscle_group: 'Varie',
};

/** Smoke catalog as a Map (id → name/group). */
export function smokeExerciseMetaCatalog(): ReadonlyMap<string, ExerciseMeta> {
  return SMOKE_META_BY_ID;
}

/** Build a mutable catalog map from rows (later entries win). */
export function buildExerciseMetaCatalog(
  rows: Iterable<{ id: string; name?: string | null; muscle_group?: string | null }>,
): Map<string, ExerciseMeta> {
  const map = new Map<string, ExerciseMeta>();
  for (const row of rows) {
    if (!row.id) continue;
    map.set(row.id, {
      name: (row.name || '').trim() || UNKNOWN_EXERCISE_META.name,
      muscle_group: (row.muscle_group || '').trim() || UNKNOWN_EXERCISE_META.muscle_group,
    });
  }
  return map;
}

/**
 * Resolve display meta for an exercise id.
 * Lookup order: `catalog` → smoke seed catalog → unknown fallback.
 */
export function resolveExerciseMeta(
  exerciseId: string | null | undefined,
  catalog?: ReadonlyMap<string, ExerciseMeta> | null,
): ExerciseMeta {
  if (!exerciseId) return { ...UNKNOWN_EXERCISE_META };
  const fromCatalog = catalog?.get(exerciseId);
  if (fromCatalog) return { ...fromCatalog };
  const fromSmoke = SMOKE_META_BY_ID.get(exerciseId);
  if (fromSmoke) return { ...fromSmoke };
  return { ...UNKNOWN_EXERCISE_META };
}

/** Merge base catalog with overrides (overrides win). */
export function mergeExerciseMetaCatalogs(
  base: ReadonlyMap<string, ExerciseMeta>,
  overrides: ReadonlyMap<string, ExerciseMeta>,
): Map<string, ExerciseMeta> {
  const merged = new Map(base);
  for (const [id, meta] of overrides) {
    merged.set(id, meta);
  }
  return merged;
}
