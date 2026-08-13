/** Session length helpers for History rows — pure, offline-safe. */

/** Whole minutes between start/end ISO timestamps; null if unknown/invalid. */
export function computeSessionDurationMins(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): number | null {
  if (!startTime || !endTime) return null;
  const start = Date.parse(startTime);
  const end = Date.parse(endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return Math.round((end - start) / 60000);
}

/** Compact chip label: `45 min`, `1h`, `1h 30m`, or `—` when unknown. */
export function formatSessionDurationLabel(mins: number | null | undefined): string {
  if (mins == null || !Number.isFinite(mins) || mins < 0) return '—';
  const n = Math.round(mins);
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Spoken label for VoiceOver / TalkBack. */
export function formatSessionDurationA11y(mins: number | null | undefined): string {
  if (mins == null || !Number.isFinite(mins) || mins < 0) return 'Durata non disponibile';
  const n = Math.round(mins);
  if (n === 0) return 'Durata: meno di un minuto';
  if (n === 1) return 'Durata: 1 minuto';
  if (n < 60) return `Durata: ${n} minuti`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  const hourWord = h === 1 ? '1 ora' : `${h} ore`;
  if (m === 0) return `Durata: ${hourWord}`;
  const minWord = m === 1 ? '1 minuto' : `${m} minuti`;
  return `Durata: ${hourWord} e ${minWord}`;
}
