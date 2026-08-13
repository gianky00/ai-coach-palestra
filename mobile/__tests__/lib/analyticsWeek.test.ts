import { describe, expect, it } from 'vitest';

import {
  ANALYTICS_MAX_WEEK_OFFSET,
  analyticsWeekDayKeys,
  analyticsWeekNavHints,
  buildAnalyticsEmptyCopy,
  clampAnalyticsWeekOffset,
  formatAnalyticsWeekA11yLabel,
  formatAnalyticsWeekLabel,
  resolveAnalyticsWeekRange,
} from '../../src/lib/analyticsWeek';

describe('clampAnalyticsWeekOffset', () => {
  it('clamps to [−max, 0]', () => {
    expect(clampAnalyticsWeekOffset(0)).toBe(0);
    expect(clampAnalyticsWeekOffset(-3)).toBe(-3);
    expect(clampAnalyticsWeekOffset(2)).toBe(0);
    expect(clampAnalyticsWeekOffset(-ANALYTICS_MAX_WEEK_OFFSET - 5)).toBe(
      -ANALYTICS_MAX_WEEK_OFFSET,
    );
    expect(clampAnalyticsWeekOffset(Number.NaN)).toBe(0);
  });
});

describe('resolveAnalyticsWeekRange', () => {
  // Thursday 13 Aug 2026 → week Mon 10 – Sun 16 Aug
  const thursday = new Date(2026, 7, 13, 15, 30, 0);

  it('resolves current Mon–Sun week', () => {
    const week = resolveAnalyticsWeekRange(0, thursday);
    expect(week.offset).toBe(0);
    expect(week.startKey).toBe('2026-08-10');
    expect(week.endKey).toBe('2026-08-16');
    expect(week.label).toBe('Questa settimana');
    expect(week.a11yLabel).toBe('Settimana selezionata: questa settimana');
    expect(week.canGoNext).toBe(false);
    expect(week.canGoPrev).toBe(true);
  });

  it('steps back one calendar week', () => {
    const week = resolveAnalyticsWeekRange(-1, thursday);
    expect(week.startKey).toBe('2026-08-03');
    expect(week.endKey).toBe('2026-08-09');
    expect(week.label).toBe('3–9 ago');
    expect(week.a11yLabel).toBe('Settimana selezionata: dal 3 agosto al 9 agosto');
    expect(week.canGoNext).toBe(true);
  });

  it('formats cross-month ranges', () => {
    // Week containing Mon 27 Jul 2026 when viewing from Aug 13 with offset that lands there
    const week = resolveAnalyticsWeekRange(-2, thursday);
    expect(week.startKey).toBe('2026-07-27');
    expect(week.endKey).toBe('2026-08-02');
    expect(week.label).toBe('27 lug – 2 ago');
  });

  it('disables prev at max lookback', () => {
    const week = resolveAnalyticsWeekRange(-ANALYTICS_MAX_WEEK_OFFSET, thursday);
    expect(week.offset).toBe(-ANALYTICS_MAX_WEEK_OFFSET);
    expect(week.canGoPrev).toBe(false);
    expect(week.canGoNext).toBe(true);
  });
});

describe('formatAnalyticsWeekLabel / a11y', () => {
  it('uses questa settimana for current', () => {
    expect(formatAnalyticsWeekLabel('2026-08-10', '2026-08-16', true)).toBe('Questa settimana');
    expect(formatAnalyticsWeekA11yLabel('2026-08-10', '2026-08-16', true)).toBe(
      'Settimana selezionata: questa settimana',
    );
  });
});

describe('analyticsWeekDayKeys', () => {
  it('returns seven Mon→Sun keys', () => {
    expect(analyticsWeekDayKeys('2026-08-10')).toEqual([
      '2026-08-10',
      '2026-08-11',
      '2026-08-12',
      '2026-08-13',
      '2026-08-14',
      '2026-08-15',
      '2026-08-16',
    ]);
  });
});

describe('buildAnalyticsEmptyCopy', () => {
  it('uses current-week CTA copy', () => {
    const copy = buildAnalyticsEmptyCopy({
      isCurrentWeek: true,
      label: 'Questa settimana',
      a11yLabel: 'Settimana selezionata: questa settimana',
      canGoPrev: true,
      canGoNext: false,
    });
    expect(copy.title).toBe('Nessun volume in questa settimana.');
    expect(copy.hint).toMatch(/Registra serie da Oggi/);
    expect(copy.ctaTitle).toBe('Vai a Oggi e allena');
    expect(copy.a11y).toMatch(/heatmap/);
  });

  it('names the selected past week and neighbor hints', () => {
    const mid = buildAnalyticsEmptyCopy({
      isCurrentWeek: false,
      label: '3–9 ago',
      a11yLabel: 'Settimana selezionata: dal 3 agosto al 9 agosto',
      canGoPrev: true,
      canGoNext: true,
    });
    expect(mid.title).toBe('Nessun volume per 3–9 ago.');
    expect(mid.hint).toMatch(/precedente o successiva/);
    expect(mid.a11y).toMatch(/Nessun volume registrato/);

    const atMax = buildAnalyticsEmptyCopy({
      isCurrentWeek: false,
      label: '1–7 ago',
      a11yLabel: 'Settimana selezionata: dal 1 agosto al 7 agosto',
      canGoPrev: false,
      canGoNext: true,
    });
    expect(atMax.hint).toMatch(/Torna avanti/);
  });
});

describe('analyticsWeekNavHints', () => {
  it('explains disabled prev/next bounds', () => {
    expect(analyticsWeekNavHints({ canGoPrev: true, canGoNext: true })).toEqual({
      prevHint: 'Mostra volume della settimana precedente',
      nextHint: 'Mostra volume della settimana successiva',
    });
    const atCurrent = analyticsWeekNavHints({ canGoPrev: true, canGoNext: false });
    expect(atCurrent.nextHint).toMatch(/settimana corrente/i);
    const atMax = analyticsWeekNavHints({ canGoPrev: false, canGoNext: true });
    expect(atMax.prevHint).toMatch(String(ANALYTICS_MAX_WEEK_OFFSET));
  });
});
