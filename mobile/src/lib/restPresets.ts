/** Preset secondi recupero — usati da FloatingTimer e LogExerciseModal. */
export const REST_PRESETS_SECONDS = [60, 90, 120, 180] as const;

export type RestPresetSeconds = (typeof REST_PRESETS_SECONDS)[number];

/**
 * Etichetta compatta per chip / countdown UI.
 * Interi minuti → "1 min"; altrimenti mm:ss (es. 90 → "1:30"); sotto il minuto → "45s".
 */
export function formatRestPresetLabel(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  if (rem === 0) return `${mins} min`;
  return `${mins}:${String(rem).padStart(2, '0')}`;
}

/** Durata in italiano per VoiceOver / TalkBack (senza verbo). */
export function formatRestDurationA11y(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0 secondi';
  const s = Math.round(seconds);
  if (s < 60) return s === 1 ? '1 secondo' : `${s} secondi`;
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  const minWord = mins === 1 ? '1 minuto' : `${mins} minuti`;
  if (rem === 0) return minWord;
  const secWord = rem === 1 ? '1 secondo' : `${rem} secondi`;
  return `${minWord} e ${secWord}`;
}

/** Accessibilità condivisa per chip recupero (Log + FloatingTimer). */
export function formatRestPresetA11yLabel(seconds: number): string {
  return `Avvia recupero ${formatRestDurationA11y(seconds)}`;
}

/** True se il valore è uno dei preset noti. */
export function isRestPreset(seconds: number): seconds is RestPresetSeconds {
  return (REST_PRESETS_SECONDS as readonly number[]).includes(seconds);
}
