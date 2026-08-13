/** History session PR badge helpers — pure, offline-safe. */

export type PrLogLike = {
  is_pr?: boolean | null;
  isPr?: boolean | null;
};

function clampCount(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n);
}

/** Count logs flagged as personal records (`is_pr` / `isPr`). */
export function countSessionPrs(logs: PrLogLike[] | null | undefined): number {
  if (!logs?.length) return 0;
  let total = 0;
  for (const log of logs) {
    if (log?.is_pr || log?.isPr) total += 1;
  }
  return total;
}

export function sessionHadPr(logs: PrLogLike[] | null | undefined): boolean {
  return countSessionPrs(logs) > 0;
}

/** Compact chip label: `PR`, `2 PR`, or empty when none. */
export function formatSessionPrLabel(count: number | null | undefined): string {
  const n = clampCount(count ?? 0);
  if (n <= 0) return '';
  return n === 1 ? 'PR' : `${n} PR`;
}

/** Spoken label for VoiceOver / TalkBack; empty when no PRs. */
export function formatSessionPrA11y(count: number | null | undefined): string {
  const n = clampCount(count ?? 0);
  if (n <= 0) return '';
  if (n === 1) return '1 record personale';
  return `${n} record personali`;
}
