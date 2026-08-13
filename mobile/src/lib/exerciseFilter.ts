/**
 * Exercise list search helpers (Oggi filter).
 * Pure — safe for Vitest (no RN imports).
 */

/** Strip combining marks after NFD so "Panca" ≈ "Pànca", "petto" ≈ "Pètto". */
const COMBINING_MARKS = /[\u0300-\u036f]/g;

/**
 * Normalize free-text for search: trim, lower-case, fold accents, collapse spaces.
 */
export function normalizeSearchText(raw: string): string {
  if (!raw) return '';
  return raw
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Split a normalized query into non-empty tokens (AND match). */
export function searchTokens(query: string): string[] {
  const q = normalizeSearchText(query);
  if (!q) return [];
  return q.split(' ').filter(Boolean);
}

/**
 * Filtro testo esercizi (nome / gruppo muscolare).
 * Case-insensitive, accent-insensitive; multi-token = AND across haystack.
 */
export function filterExercisesByQuery<T extends { name: string; muscle_group?: string | null }>(
  items: T[],
  query: string,
): T[] {
  const tokens = searchTokens(query);
  if (tokens.length === 0) return items;

  return items.filter((ex) => {
    const haystack = normalizeSearchText(`${ex.name || ''} ${ex.muscle_group || ''}`);
    return tokens.every((token) => haystack.includes(token));
  });
}
