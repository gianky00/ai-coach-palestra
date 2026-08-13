/**
 * Deep-link smoke mode for local adb verify (zero real login / Garmin OAuth).
 *
 * Supported URLs:
 * - kinefit://smoke/auth
 * - kinefit://smoke/tabs?tab=oggi|storico|analisi|profilo
 * - kinefit://smoke/seed?days=7&sets=3 — insert SQLite fixtures (smoke-* ids)
 * - kinefit://smoke/clear — wipe smoke fixtures only
 * - optional: &timer=90 (seconds) → FloatingTimer visible for ±15 / close
 * - optional: &modal=log|weight|profile-edit|settings|garmin|add-exercise|session|notes
 * - optional: &pr=1 with modal=log → show log-pr-toast shell
 */

import type { Exercise } from '../types';

export type SmokeTab = 'oggi' | 'storico' | 'analisi' | 'profilo';

export type SmokeModal =
  'log' | 'weight' | 'profile-edit' | 'settings' | 'garmin' | 'add-exercise' | 'session' | 'notes';

export type SmokeSeedStatus = 'idle' | 'seeding' | 'clearing' | 'seeded' | 'cleared' | 'error';

export type SmokeMode =
  | { kind: 'off' }
  | { kind: 'auth' }
  | { kind: 'seed'; days: number; sets: number }
  | { kind: 'clear' }
  | {
      kind: 'tabs';
      tab: SmokeTab;
      timerSeconds?: number;
      modal?: SmokeModal;
      showPrToast?: boolean;
      seedStatus?: SmokeSeedStatus;
    };

export const SMOKE_TAB_ROUTES: Record<SmokeTab, 'Oggi' | 'Storico' | 'Analisi' | 'Profilo'> = {
  oggi: 'Oggi',
  storico: 'Storico',
  analisi: 'Analisi',
  profilo: 'Profilo',
};

export const SMOKE_USER_ID = 'smoke-user';
export const SMOKE_FIXTURE_SESSION_ID = 'smoke-session-1';

export const SMOKE_FIXTURE_EXERCISE: Exercise = {
  id: 'smoke-exercise-1',
  name: 'Smoke Bench',
  muscle_group: 'Petto',
  target_reps: '10',
  target_sets: 3,
  training_day: 'LUNEDI',
  rest_time: 90,
};

const VALID_TABS = new Set<SmokeTab>(['oggi', 'storico', 'analisi', 'profilo']);
const VALID_MODALS = new Set<SmokeModal>([
  'log',
  'weight',
  'profile-edit',
  'settings',
  'garmin',
  'add-exercise',
  'session',
  'notes',
]);

function parseTimerSeconds(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 15 || n > 3600) return undefined;
  return n;
}

function parseModal(raw: string | null): SmokeModal | undefined {
  if (!raw) return undefined;
  const key = raw.toLowerCase() as SmokeModal;
  return VALID_MODALS.has(key) ? key : undefined;
}

export function parseSeedParams(searchParams: URLSearchParams): { days: number; sets: number } {
  const daysRaw = searchParams.get('days');
  const setsRaw = searchParams.get('sets');
  const daysNum = daysRaw != null && daysRaw !== '' ? parseInt(daysRaw, 10) : 14;
  const setsNum = setsRaw != null && setsRaw !== '' ? parseInt(setsRaw, 10) : 3;
  const days = Number.isFinite(daysNum) ? Math.min(21, Math.max(1, Math.round(daysNum))) : 14;
  const sets = Number.isFinite(setsNum) ? Math.min(6, Math.max(1, Math.round(setsNum))) : 3;
  return { days, sets };
}

export function parseSmokeUrl(url: string | null | undefined): SmokeMode {
  if (!url) return { kind: 'off' };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { kind: 'off' };
  }
  const scheme = parsed.protocol.replace(':', '').toLowerCase();
  if (scheme !== 'kinefit') return { kind: 'off' };
  const host = (parsed.hostname || '').toLowerCase();
  const path = (parsed.pathname || '').replace(/^\/+|\/+$/g, '').toLowerCase();
  const segments = [host, ...path.split('/').filter(Boolean)].filter(Boolean);
  if (segments[0] !== 'smoke') return { kind: 'off' };
  const action = segments[1] || '';
  if (action === 'auth') return { kind: 'auth' };
  if (action === 'seed') {
    const { days, sets } = parseSeedParams(parsed.searchParams);
    return { kind: 'seed', days, sets };
  }
  if (action === 'clear') return { kind: 'clear' };
  if (action === 'tabs') {
    const raw = (parsed.searchParams.get('tab') || 'oggi').toLowerCase();
    const tab = (VALID_TABS.has(raw as SmokeTab) ? raw : 'oggi') as SmokeTab;
    const timerSeconds = parseTimerSeconds(parsed.searchParams.get('timer'));
    const modal = parseModal(parsed.searchParams.get('modal'));
    const showPrToast =
      parsed.searchParams.get('pr') === '1' || parsed.searchParams.get('pr') === 'true';
    return { kind: 'tabs', tab, timerSeconds, modal, showPrToast: showPrToast || undefined };
  }
  return { kind: 'off' };
}

export function isSmokeActive(mode: SmokeMode): boolean {
  return mode.kind !== 'off';
}

export function isSmokeFixtureExercise(exercise: { id?: string } | null | undefined): boolean {
  return !!exercise && exercise.id === SMOKE_FIXTURE_EXERCISE.id;
}

export function isSmokeDataMode(mode: SmokeMode): boolean {
  return mode.kind === 'tabs' || mode.kind === 'seed' || mode.kind === 'clear';
}
