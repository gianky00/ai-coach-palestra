/**
 * KineFit design tokens — dark gym aesthetic, accent #00ff88.
 * Prefer importing from here instead of scattering magic hex values.
 */

export const colors = {
  bg: '#121212',
  surface: '#1a1a1a',
  surfaceElevated: '#222222',
  surfaceMuted: '#252525',
  border: '#333333',
  borderSubtle: '#2a2a2a',
  text: '#ffffff',
  textSecondary: '#aaaaaa',
  textMuted: '#888888',
  textDim: '#666666',
  textFaint: '#444444',
  accent: '#00ff88',
  accentMuted: '#00ff8833',
  accentSoft: '#00ff881a',
  accentOn: '#000000',
  danger: '#ff4444',
  dangerMuted: '#ff444433',
  warning: '#ffcc00',
  warningMuted: '#ffcc001a',
  warningBorder: '#ffcc0055',
  info: '#66b3ff',
  overlay: 'rgba(0,0,0,0.85)',
  overlaySoft: 'rgba(0,0,0,0.55)',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  full: 100,
} as const;

export const typography = {
  hero: { fontSize: 34, fontWeight: '900' as const, letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: '900' as const, letterSpacing: 0.3 },
  screenTitle: { fontSize: 30, fontWeight: '900' as const, letterSpacing: -0.3 },
  section: { fontSize: 17, fontWeight: '800' as const },
  body: { fontSize: 15, fontWeight: '600' as const },
  label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.6 },
  caption: { fontSize: 12, fontWeight: '600' as const },
  overline: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
} as const;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 } as const;

export const theme = { colors, space, radius, typography, hitSlop } as const;
export type Theme = typeof theme;
