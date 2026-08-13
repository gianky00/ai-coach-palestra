import { describe, expect, it } from 'vitest';

import {
  buildSmokeModeBreadcrumb,
  buildSyncFailureBreadcrumb,
  buildSyncSummaryBreadcrumb,
  smokeModeTagValue,
  stripEmails,
} from '../../src/lib/sentryBreadcrumbs';

describe('sentryBreadcrumbs', () => {
  it('maps smoke mode tag values', () => {
    expect(smokeModeTagValue(true)).toBe('true');
    expect(smokeModeTagValue(false)).toBe('false');
  });

  it('builds smoke breadcrumbs without URLs', () => {
    expect(buildSmokeModeBreadcrumb(true)).toEqual({
      category: 'smoke',
      level: 'info',
      message: 'smoke.enabled',
      data: { smoke_mode: 'true' },
    });
    expect(buildSmokeModeBreadcrumb(false).message).toBe('smoke.disabled');
  });

  it('strips emails from sync failure messages', () => {
    expect(stripEmails('denied for user@example.com')).toBe('denied for [email]');

    const crumb = buildSyncFailureBreadcrumb({
      kind: 'log_upsert',
      code: '23503',
      message: 'FK fail for user@example.com',
    });
    expect(crumb).toEqual({
      category: 'sync',
      level: 'warning',
      message: 'sync.log_upsert.failed',
      data: {
        kind: 'log_upsert',
        code: '23503',
        message: 'FK fail for [email]',
      },
    });
  });

  it('builds summary only when failures exist', () => {
    expect(buildSyncSummaryBreadcrumb({ synced: 2, failed: 0 })).toBeNull();
    expect(buildSyncSummaryBreadcrumb({ synced: 1, failed: 3 })).toEqual({
      category: 'sync',
      level: 'warning',
      message: 'sync.batch.partial_or_failed',
      data: { synced: 1, failed: 3 },
    });
  });
});
