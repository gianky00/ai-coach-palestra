import { describe, expect, it } from 'vitest';

import {
  isSensitiveKey,
  redactBreadcrumb,
  redactSensitive,
  redactSentryEvent,
  redactString,
} from '../../src/lib/sentryRedact';

describe('sentryRedact', () => {
  it('flags credential-like keys', () => {
    expect(isSensitiveKey('access_token')).toBe(true);
    expect(isSensitiveKey('Authorization')).toBe(true);
    expect(isSensitiveKey('email')).toBe(true);
    expect(isSensitiveKey('exercise_id')).toBe(false);
  });

  it('redacts bearer / jwt / email substrings', () => {
    expect(redactString('Bearer abc.def.ghi')).toContain('[Redacted]');
    expect(redactString('token eyJhbGciOiJIUzI1NiJ9.aaa.bbb')).toContain('[Redacted]');
    expect(redactString('mail user@example.com ok')).toContain('[Redacted]');
  });

  it('redacts nested sensitive objects', () => {
    const out = redactSensitive({
      password: 'secret',
      nested: { refresh_token: 'r1', ok: 1 },
      list: [{ api_key: 'k' }],
    }) as Record<string, unknown>;

    expect(out.password).toBe('[Redacted]');
    expect((out.nested as Record<string, unknown>).refresh_token).toBe('[Redacted]');
    expect((out.nested as Record<string, unknown>).ok).toBe(1);
    expect((out.list as Record<string, unknown>[])[0]?.api_key).toBe('[Redacted]');
  });

  it('redacts breadcrumbs and strips user email from events', () => {
    const crumb = redactBreadcrumb({
      message: 'login user@example.com',
      data: { token: 'abc', kind: 'sync' },
    });
    expect(crumb.message).toContain('[Redacted]');
    expect(crumb.data?.token).toBe('[Redacted]');
    expect(crumb.data?.kind).toBe('sync');

    const event = redactSentryEvent({
      message: 'fail user@x.com',
      user: { id: 'u1', email: 'user@x.com', username: 'u' },
      extra: { password: 'x' },
      breadcrumbs: [{ message: 'Bearer tok', data: { access_token: 't' } }],
    });

    expect(event.message).toContain('[Redacted]');
    expect(event.user).toEqual({ id: 'u1' });
    expect(event.extra?.password).toBe('[Redacted]');
    const crumbs = event.breadcrumbs as { message?: string; data?: Record<string, unknown> }[];
    expect(crumbs[0]?.data?.access_token).toBe('[Redacted]');
  });
});
