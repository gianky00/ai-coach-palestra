/** Preset secondi recupero — usati da FloatingTimer e LogExerciseModal. */
export const REST_PRESETS_SECONDS = [60, 90, 120, 180] as const;

export type RestPresetSeconds = (typeof REST_PRESETS_SECONDS)[number];

/** Etichetta compatta per chip UI (es. 90 → "1:30"). */
export function formatRestPresetLabel(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  if (rem === 0) return `${mins}:00`;
  return `${mins}:${String(rem).padStart(2, '0')}`;
}

/** True se il valore è uno dei preset noti. */
export function isRestPreset(seconds: number): seconds is RestPresetSeconds {
  return (REST_PRESETS_SECONDS as readonly number[]).includes(seconds);
}
