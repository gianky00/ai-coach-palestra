/**
 * Deep-link smoke mode for local adb verify (zero real login / Garmin OAuth).
 *
 * Supported URLs:
 * - kinefit://smoke/auth
 * - kinefit://smoke/tabs?tab=oggi|storico|analisi|profilo
 */

export type SmokeTab = 'oggi' | 'storico' | 'analisi' | 'profilo';

export type SmokeMode = { kind: 'off' } | { kind: 'auth' } | { kind: 'tabs'; tab: SmokeTab };

export const SMOKE_TAB_ROUTES: Record<SmokeTab, 'Oggi' | 'Storico' | 'Analisi' | 'Profilo'> = {
  oggi: 'Oggi',
  storico: 'Storico',
  analisi: 'Analisi',
  profilo: 'Profilo',
};

const VALID_TABS = new Set<SmokeTab>(['oggi', 'storico', 'analisi', 'profilo']);

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
    return { kind: 'tabs', tab };
  }

  return { kind: 'off' };
}

export function isSmokeActive(mode: SmokeMode): boolean {
  return mode.kind !== 'off';
}
