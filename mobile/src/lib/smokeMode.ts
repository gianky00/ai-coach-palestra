/**
 * Deep-link smoke mode for local adb verify (zero real login / Garmin OAuth).
 *
 * Supported URLs:
 * - kinefit://smoke/auth
 * - kinefit://smoke/tabs?tab=oggi|storico|analisi|profilo
 * - optional: &timer=90 (seconds) → FloatingTimer visible for ±15 / close
 * - optional: &modal=log|weight|profile-edit|settings|garmin|add-exercise|session
 */

import type { Exercise } from '../types';

export type SmokeTab = 'oggi' | 'storico' | 'analisi' | 'profilo';

export type SmokeModal =
  'log' | 'weight' | 'profile-edit' | 'settings' | 'garmin' | 'add-exercise' | 'session';

export type SmokeMode =
  | { kind: 'off' }
  | { kind: 'auth' }
  | {
      kind: 'tabs';
      tab: SmokeTab;
      timerSeconds?: number;
      modal?: SmokeModal;
    };

export const SMOKE_TAB_ROUTES: Record<SmokeTab, 'Oggi' | 'Storico' | 'Analisi' | 'Profilo'> = {
  oggi: 'Oggi',
  storico: 'Storico',
  analisi: 'Analisi',
  profilo: 'Profilo',
};

export const SMOKE_USER_ID = 'smoke-user';
export const SMOKE_FIXTURE_SESSION_ID = 'smoke-session-1';

/** Fixture exercise for log-modal shell without credentials. */
export const SMOKE_FIXTURE_EXERCISE: Exercise = {
  id: 'smoke-exercise-1',
  name: 'Smoke Bench',
  muscle_group: 'Petto',
  target_reps: '10',
  target_sets: 3,
  training_day: 'Lunedì',
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

  // kinefit://smoke/auth → host=smoke, pathname=/auth
  // kinefit:///smoke/auth → pathname=/smoke/auth
  const host = (parsed.hostname || '').toLowerCase();
  const path = (parsed.pathname || '').replace(/^\/+|\/+$/g, '').toLowerCase();
  const segments = [host, ...path.split('/').filter(Boolean)].filter(Boolean);

  if (segments[0] !== 'smoke') return { kind: 'off' };

  const action = segments[1] || '';
  if (action === 'auth') return { kind: 'auth' };

  if (action === 'tabs') {
    const raw = (parsed.searchParams.get('tab') || 'oggi').toLowerCase();
    const tab = (VALID_TABS.has(raw as SmokeTab) ? raw : 'oggi') as SmokeTab;
    const timerSeconds = parseTimerSeconds(parsed.searchParams.get('timer'));
    const modal = parseModal(parsed.searchParams.get('modal'));
    return { kind: 'tabs', tab, timerSeconds, modal };
  }

  return { kind: 'off' };
}

export function isSmokeActive(mode: SmokeMode): boolean {
  return mode.kind !== 'off';
}

export function isSmokeFixtureExercise(exercise: { id?: string } | null | undefined): boolean {
  return !!exercise && exercise.id === SMOKE_FIXTURE_EXERCISE.id;
}
