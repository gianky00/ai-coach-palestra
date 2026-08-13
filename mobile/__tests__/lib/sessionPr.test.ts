import { describe, expect, it } from 'vitest';

import {
  countSessionPrs,
  formatSessionPrA11y,
  formatSessionPrLabel,
  sessionHadPr,
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

describe('formatSessionPrLabel', () => {
  it('formats compact Italian PR chip', () => {
    expect(formatSessionPrLabel(0)).toBe('');
    expect(formatSessionPrLabel(null)).toBe('');
    expect(formatSessionPrLabel(1)).toBe('PR');
    expect(formatSessionPrLabel(2)).toBe('2 PR');
    expect(formatSessionPrLabel(1.4)).toBe('PR');
  });
});

describe('formatSessionPrA11y', () => {
  it('speaks Italian PR phrases', () => {
    expect(formatSessionPrA11y(0)).toBe('');
    expect(formatSessionPrA11y(1)).toBe('1 record personale');
    expect(formatSessionPrA11y(3)).toBe('3 record personali');
  });
});
