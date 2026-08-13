/**
 * Pure Sentry breadcrumb / tag builders (no native SDK).
 * Safe for Vitest; wrappers in sentry.ts / syncTelemetry call addBreadcrumb / setTag.
 */

export type SyncFailureKind = 'delete_log' | 'session_upsert' | 'log_upsert' | 'save_log';

export type SyncFailureBreadcrumbInput = {
  kind: SyncFailureKind;
  /** PostgREST / Postgres code when available (e.g. 23503). */
  code?: string | null;
  /** Safe error text — callers should avoid PII; builder still strips emails. */
  message?: string | null;
};

export type BreadcrumbPayload = {
  category: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  data: Record<string, unknown>;
};

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

/** Strip email-shaped substrings from free text (defense in depth). */
export function stripEmails(text: string): string {
  return text.replace(EMAIL_RE, '[email]');
}

export function smokeModeTagValue(active: boolean): 'true' | 'false' {
  return active ? 'true' : 'false';
}

export function buildSmokeModeBreadcrumb(active: boolean): BreadcrumbPayload {
  return {
    category: 'smoke',
    level: 'info',
    message: active ? 'smoke.enabled' : 'smoke.disabled',
    data: { smoke_mode: smokeModeTagValue(active) },
  };
}

export function buildSyncFailureBreadcrumb(input: SyncFailureBreadcrumbInput): BreadcrumbPayload {
  const code = input.code ? String(input.code) : undefined;
  const raw = input.message ? String(input.message) : '';
  const message = raw ? stripEmails(raw).slice(0, 200) : undefined;

  return {
    category: 'sync',
    level: 'warning',
    message: `sync.${input.kind}.failed`,
    data: {
      kind: input.kind,
      ...(code ? { code } : {}),
      ...(message ? { message } : {}),
    },
  };
}

export function buildSyncSummaryBreadcrumb(result: {
  synced: number;
  failed: number;
}): BreadcrumbPayload | null {
  if (result.failed <= 0) return null;
  return {
    category: 'sync',
    level: 'warning',
    message: 'sync.batch.partial_or_failed',
    data: {
      synced: result.synced,
      failed: result.failed,
    },
  };
}
