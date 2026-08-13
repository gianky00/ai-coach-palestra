import { startOfWeekMondayKey } from './streak';
import { toLocalDateKey } from './utils';

/** Max weeks you can step back from the current calendar week (Mon–Sun). */
export const ANALYTICS_MAX_WEEK_OFFSET = 52;

const MONTHS_SHORT = [
  'gen',
  'feb',
  'mar',
  'apr',
  'mag',
  'giu',
  'lug',
  'ago',
  'set',
  'ott',
  'nov',
  'dic',
] as const;

const MONTHS_LONG = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre',
] as const;

export type AnalyticsWeekRange = {
  /** 0 = current week; negative = weeks in the past. */
  offset: number;
  startKey: string;
  endKey: string;
  /** Inclusive start (local midnight). */
  start: Date;
  /** Inclusive end (local end-of-day). */
  end: Date;
  /** Compact UI label, e.g. `Questa settimana` / `10–16 ago`. */
  label: string;
  /** TalkBack / VoiceOver label. */
  a11yLabel: string;
  canGoPrev: boolean;
  canGoNext: boolean;
};

function parseLocalKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function addDaysKey(key: string, delta: number): string {
  const d = parseLocalKey(key);
  d.setDate(d.getDate() + delta);
  return toLocalDateKey(d);
}

/** Clamp week offset to [−ANALYTICS_MAX_WEEK_OFFSET, 0]. */
export function clampAnalyticsWeekOffset(offset: number): number {
  if (!Number.isFinite(offset)) return 0;
  const n = Math.trunc(offset);
  if (n > 0) return 0;
  if (n < -ANALYTICS_MAX_WEEK_OFFSET) return -ANALYTICS_MAX_WEEK_OFFSET;
  return n;
}

function formatDayMonthShort(key: string): string {
  const d = parseLocalKey(key);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

function formatDayMonthLong(key: string): string {
  const d = parseLocalKey(key);
  return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`;
}

/** Visible range label for the week selector. */
export function formatAnalyticsWeekLabel(
  startKey: string,
  endKey: string,
  isCurrent: boolean,
): string {
  if (isCurrent) return 'Questa settimana';
  const start = parseLocalKey(startKey);
  const end = parseLocalKey(endKey);
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}–${end.getDate()} ${MONTHS_SHORT[end.getMonth()]}`;
  }
  return `${formatDayMonthShort(startKey)} – ${formatDayMonthShort(endKey)}`;
}

/** Spoken label for the selected week. */
export function formatAnalyticsWeekA11yLabel(
  startKey: string,
  endKey: string,
  isCurrent: boolean,
): string {
  if (isCurrent) return 'Settimana selezionata: questa settimana';
  return `Settimana selezionata: dal ${formatDayMonthLong(startKey)} al ${formatDayMonthLong(endKey)}`;
}

/**
 * Resolve Mon–Sun local calendar week for a week offset (0 = week containing `now`).
 * Pure helper — no I/O.
 */
export function resolveAnalyticsWeekRange(
  offset: number,
  now: Date = new Date(),
): AnalyticsWeekRange {
  const clamped = clampAnalyticsWeekOffset(offset);
  const todayKey = toLocalDateKey(now);
  const currentMonday = startOfWeekMondayKey(todayKey);
  const startKey = addDaysKey(currentMonday, clamped * 7);
  const endKey = addDaysKey(startKey, 6);
  const isCurrent = clamped === 0;

  const start = parseLocalKey(startKey);
  start.setHours(0, 0, 0, 0);
  const end = parseLocalKey(endKey);
  end.setHours(23, 59, 59, 999);

  return {
    offset: clamped,
    startKey,
    endKey,
    start,
    end,
    label: formatAnalyticsWeekLabel(startKey, endKey, isCurrent),
    a11yLabel: formatAnalyticsWeekA11yLabel(startKey, endKey, isCurrent),
    canGoPrev: clamped > -ANALYTICS_MAX_WEEK_OFFSET,
    canGoNext: clamped < 0,
  };
}

/** Seven local date keys Mon→Sun for chart buckets. */
export function analyticsWeekDayKeys(startKey: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysKey(startKey, i));
}

export type AnalyticsEmptyCopy = {
  title: string;
  hint: string;
  a11y: string;
  ctaTitle: string;
  ctaHint: string;
};

/**
 * Empty-state copy for the selected analytics week (current vs past).
 * Pure helper — no I/O.
 */
export function buildAnalyticsEmptyCopy(opts: {
  isCurrentWeek: boolean;
  label: string;
  a11yLabel: string;
  canGoPrev: boolean;
  canGoNext: boolean;
}): AnalyticsEmptyCopy {
  const ctaTitle = 'Vai a Oggi e allena';
  const ctaHint = 'Apre la scheda Oggi per registrare un allenamento';

  if (opts.isCurrentWeek) {
    return {
      title: 'Nessun volume in questa settimana.',
      hint: 'Registra serie da Oggi: heatmap e grafico volume si aggiornano qui.',
      a11y: 'Nessun volume in questa settimana. Registra serie da Oggi per riempire heatmap e grafico.',
      ctaTitle,
      ctaHint,
    };
  }

  const neighborHint =
    opts.canGoPrev && opts.canGoNext
      ? 'Prova la settimana precedente o successiva, oppure registra serie da Oggi.'
      : opts.canGoNext
        ? 'Torna avanti verso questa settimana, oppure registra serie da Oggi.'
        : opts.canGoPrev
          ? 'Prova la settimana precedente, oppure registra serie da Oggi.'
          : 'Registra serie da Oggi per vedere volume e heatmap.';

  return {
    title: `Nessun volume per ${opts.label}.`,
    hint: neighborHint,
    a11y: `${opts.a11yLabel}. Nessun volume registrato.`,
    ctaTitle,
    ctaHint,
  };
}

export type AnalyticsWeekNavHints = {
  prevHint: string;
  nextHint: string;
};

/** TalkBack hints for week prev/next, including disabled bounds. */
export function analyticsWeekNavHints(opts: {
  canGoPrev: boolean;
  canGoNext: boolean;
}): AnalyticsWeekNavHints {
  return {
    prevHint: opts.canGoPrev
      ? 'Mostra volume della settimana precedente'
      : `Limite raggiunto: non puoi andare oltre ${ANALYTICS_MAX_WEEK_OFFSET} settimane fa`,
    nextHint: opts.canGoNext
      ? 'Mostra volume della settimana successiva'
      : 'Sei già sulla settimana corrente',
  };
}
