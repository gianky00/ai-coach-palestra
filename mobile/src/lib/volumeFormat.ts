/** Format volume (kg) for Oggi summary chip — locale-stable Italian grouping. */

function clampNonNegative(kg: number): number {
  if (!Number.isFinite(kg) || kg <= 0) return 0;
  return kg;
}

/** Group digits with `.` (it-IT), independent of Node/ICU locale data. */
export function formatItInt(n: number): string {
  const abs = Math.round(Math.abs(n));
  const raw = String(abs);
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Compact chip label, e.g. `0 kg`, `350 kg`, `1.250 kg`. */
export function formatVolumeKg(kg: number): string {
  const n = Math.round(clampNonNegative(kg));
  return `${formatItInt(n)} kg`;
}

/** Spoken label for VoiceOver / TalkBack. */
export function formatVolumeA11yLabel(kg: number): string {
  const n = Math.round(clampNonNegative(kg));
  if (n === 0) return 'Volume di oggi: zero chilogrammi';
  return `Volume di oggi: ${formatItInt(n)} chilogrammi`;
}
