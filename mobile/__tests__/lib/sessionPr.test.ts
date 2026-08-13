import { describe, expect, it } from 'vitest';

import {
  countSessionPrs,
  formatPrToastA11y,
  formatPrToastLabel,
  formatSessionPrA11y,
  formatSessionPrLabel,
  sessionHadPr,
  shouldShowSessionPrBadge,
} from '../../src/lib/sessionPr';

describe('countSessionPrs / sessionHadPr', () => {
  it('counts is_pr and isPr flags', () => {
    expect(countSessionPrs(null)).toBe(0);
    expect(countSessionPrs([])).toBe(0);
    expect(
      countSessionPrs([{ is_pr: true }, { isPr: true }, { is_pr: false }, { isPr: null }]),
    ).toBe(2);
    expect(sessionHadPr([{ is_pr: true }])).toBe(true);
    expect(sessionHadPr([{ isPr: false }])).toBe(false);
  });
});

describe('formatSessionPrLabel / badge visibility', () => {
  it('formats compact Italian PR chip', () => {
    expect(formatSessionPrLabel(0)).toBe('');
    expect(formatSessionPrLabel(null)).toBe('');
    expect(formatSessionPrLabel(1)).toBe('PR');
    expect(formatSessionPrLabel(2)).toBe('2 PR');
    expect(formatSessionPrLabel(1.4)).toBe('PR');
    expect(formatSessionPrLabel(-3)).toBe('');
  });

  it('hides badge when empty / invalid', () => {
    expect(shouldShowSessionPrBadge(0)).toBe(false);
    expect(shouldShowSessionPrBadge(null)).toBe(false);
    expect(shouldShowSessionPrBadge(-1)).toBe(false);
    expect(shouldShowSessionPrBadge(1)).toBe(true);
  });
});

describe('formatSessionPrA11y', () => {
  it('speaks Italian PR phrases (first vs many)', () => {
    expect(formatSessionPrA11y(0)).toBe('');
    expect(formatSessionPrA11y(1)).toBe('Primo record personale');
    expect(formatSessionPrA11y(3)).toBe('3 record personali');
  });
});

describe('formatPrToast*', () => {
  it('distinguishes first PR vs another in-session', () => {
    expect(formatPrToastLabel(0)).toBe('Nuovo record personale!');
    expect(formatPrToastLabel(undefined)).toBe('Nuovo record personale!');
    expect(formatPrToastLabel(2)).toBe('Ancora un record personale!');
    expect(formatPrToastA11y(0)).toBe('Nuovo record personale');
    expect(formatPrToastA11y(1)).toBe('Ancora un record personale');
  });
});
