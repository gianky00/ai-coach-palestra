/** Format volume (kg) for Oggi / History chips — locale-stable Italian grouping. */

export type VolumeLogLike = {
  weight?: number | null;
  reps?: number | null;
};

export type VolumeA11yContext = 'today' | 'session';

function clampNonNegative(kg: number): number {
  if (!Number.isFinite(kg) || kg <= 0) return 0;
  return kg;
}

/** Sum weight×reps across session logs; clamps non-finite / negative inputs. */
export function computeSessionVolumeKg(logs: VolumeLogLike[] | null | undefined): number {
  if (!logs?.length) return 0;
  let total = 0;
  for (const log of logs) {
    const w = Number(log.weight);
    const r = Number(log.reps);
    const weight = Number.isFinite(w) ? w : 0;
    const reps = Number.isFinite(r) ? r : 0;
    total += weight * reps;
  }
  return clampNonNegative(total);
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
export function formatVolumeA11yLabel(kg: number, context: VolumeA11yContext = 'today'): string {
  const n = Math.round(clampNonNegative(kg));
  const head = context === 'session' ? 'Volume sessione' : 'Volume di oggi';
  if (n === 0) return `${head}: zero chilogrammi`;
  return `${head}: ${formatItInt(n)} chilogrammi`;
}
