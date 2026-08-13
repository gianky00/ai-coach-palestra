/**
 * Pure mappers for offline-sync user feedback (banner / toast copy).
 * Safe for Vitest — no RN / Supabase imports.
 */

export type SyncFeedbackKind = 'ok' | 'partial' | 'failed';

export type SyncFeedback = {
  kind: SyncFeedbackKind;
  synced: number;
  failed: number;
  remaining: number;
  /** Short Italian banner / toast copy (includes failed count when relevant). */
  bannerText: string;
  title: string;
  message: string;
  at: string;
};

export type SyncFeedbackInput = {
  synced: number;
  failed: number;
  /** Queue items still pending after the batch (optional). */
  remaining?: number;
};

const clampCount = (n: number): number => {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
};

const elementi = (n: number) => (n === 1 ? 'elemento' : 'elementi');
const falliti = (n: number) => (n === 1 ? 'fallito' : 'falliti');
const inviati = (n: number) => (n === 1 ? 'inviato' : 'inviati');

/**
 * Map a sync batch into user-facing copy.
 * Prefer this name in call sites; `mapSyncFeedback` is an alias.
 */
export function buildSyncFeedback(
  result: SyncFeedbackInput,
  now: () => Date = () => new Date(),
): SyncFeedback {
  const synced = clampCount(result.synced);
  const failed = clampCount(result.failed);
  const remaining = result.remaining === undefined ? failed : clampCount(result.remaining);
  const at = now().toISOString();

  if (failed <= 0) {
    return {
      kind: 'ok',
      synced,
      failed: 0,
      remaining,
      bannerText:
        synced > 0 ? `${synced} ${elementi(synced)} ${inviati(synced)}` : 'Tutto sincronizzato',
      title: 'Sincronizzato',
      message:
        synced > 0
          ? `${synced} ${elementi(synced)} ${inviati(synced)}.`
          : 'Nessun elemento in coda.',
      at,
    };
  }

  if (synced > 0) {
    return {
      kind: 'partial',
      synced,
      failed,
      remaining,
      bannerText: `${failed} ${falliti(failed)} · ${remaining} in coda`,
      title: 'Sync parziale',
      message: `${synced} ok, ${failed} ${falliti(failed)}. ${remaining} ancora in coda. Riprova tra poco.`,
      at,
    };
  }

  return {
    kind: 'failed',
    synced: 0,
    failed,
    remaining,
    bannerText: `${failed} ${elementi(failed)} non sincronizzat${failed === 1 ? 'o' : 'i'}`,
    title: 'Sync non riuscita',
    message: `${failed} ${elementi(failed)} non ${inviati(failed)}. Controlla la connessione — i dati restano sul telefono.`,
    at,
  };
}

/** Alias kept for call-site clarity. */
export const mapSyncFeedback = buildSyncFeedback;

/** True when the user should see a persistent failure banner. */
export function isSyncFailureFeedback(
  feedback: SyncFeedback | null | undefined,
): feedback is SyncFeedback {
  return !!feedback && (feedback.kind === 'partial' || feedback.kind === 'failed');
}
