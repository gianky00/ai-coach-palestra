/** Filtro testo esercizi (nome / gruppo muscolare) — case-insensitive. */
export function filterExercisesByQuery<T extends { name: string; muscle_group?: string | null }>(
  items: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((ex) => {
    const name = (ex.name || '').toLowerCase();
    const group = (ex.muscle_group || '').toLowerCase();
    return name.includes(q) || group.includes(q);
  });
}
