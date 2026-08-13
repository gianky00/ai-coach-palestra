/**
 * Scrub secrets / credentials from Sentry payloads before send.
 * Pure helpers — safe to unit-test without the native SDK.
 */

const SENSITIVE_KEY =
  /pass(word|wd)|secret|token|authorization|api[_-]?key|anon[_-]?key|refresh[_-]?token|access[_-]?token|pkce|verifier|bearer|cookie|set-cookie|private[_-]?key|email|phone/i;

const SENSITIVE_VALUE =
  /Bearer\s+\S+|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|sk_[A-Za-z0-9]+|sb_publishable_[A-Za-z0-9]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

const REDACTED = '[Redacted]';

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY.test(key);
}

export function redactString(value: string): string {
  if (!value) return value;
  if (SENSITIVE_VALUE.test(value)) {
    return value.replace(SENSITIVE_VALUE, REDACTED);
  }
  return value;
}

export function redactSensitive(value: unknown, depth = 0): unknown {
  if (depth > 6 || value == null) return value;

  if (typeof value === 'string') return redactString(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item, depth + 1));
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveKey(key)) {
        out[key] = REDACTED;
      } else {
        out[key] = redactSensitive(nested, depth + 1);
      }
    }
    return out;
  }

  return value;
}

type BreadcrumbLike = {
  message?: string;
  data?: Record<string, unknown>;
};

type EventLike = {
  message?: string;
  extra?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
  request?: object;
  breadcrumbs?: { values?: BreadcrumbLike[] } | BreadcrumbLike[];
  tags?: Record<string, unknown>;
  user?: { id?: unknown } | null;
};

export function redactBreadcrumb<T extends BreadcrumbLike>(breadcrumb: T): T {
  const next = { ...breadcrumb };
  if (typeof next.message === 'string') {
    next.message = redactString(next.message);
  }
  if (next.data && typeof next.data === 'object') {
    next.data = redactSensitive(next.data) as Record<string, unknown>;
  }
  return next;
}

export function redactSentryEvent<T extends EventLike>(event: T): T {
  const next = { ...event };

  if (typeof next.message === 'string') {
    next.message = redactString(next.message);
  }
  if (next.extra) {
    next.extra = redactSensitive(next.extra) as T['extra'];
  }
  if (next.contexts) {
    next.contexts = redactSensitive(next.contexts) as T['contexts'];
  }
  if (next.request) {
    next.request = redactSensitive(next.request) as T['request'];
  }
  if (next.tags) {
    next.tags = redactSensitive(next.tags) as T['tags'];
  }
  // Keep user id for triage; drop email / other PII-adjacent fields from events.
  if (next.user && typeof next.user === 'object') {
    next.user = (next.user.id != null ? { id: String(next.user.id) } : null) as T['user'];
  }

  const crumbs = next.breadcrumbs;
  if (Array.isArray(crumbs)) {
    next.breadcrumbs = crumbs.map((c) => redactBreadcrumb(c)) as T['breadcrumbs'];
  } else if (crumbs && Array.isArray(crumbs.values)) {
    next.breadcrumbs = {
      ...crumbs,
      values: crumbs.values.map((c) => redactBreadcrumb(c)),
    } as T['breadcrumbs'];
  }

  return next;
}
