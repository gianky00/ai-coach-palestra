import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addSyncFailureBreadcrumb,
  addSyncSummaryBreadcrumb,
  setSyncTelemetrySink,
} from '../../src/lib/syncTelemetry';

describe('syncTelemetry', () => {
  beforeEach(() => {
    setSyncTelemetrySink(null);
  });

  it('no-ops when sink is null', () => {
    expect(() =>
      addSyncFailureBreadcrumb({ kind: 'log_upsert', code: '23503', message: 'x' }),
    ).not.toThrow();
    expect(() => addSyncSummaryBreadcrumb({ synced: 0, failed: 1 })).not.toThrow();
  });

  it('forwards breadcrumbs to the wired sink', () => {
    const sink = vi.fn();
    setSyncTelemetrySink(sink);

    addSyncFailureBreadcrumb({
      kind: 'session_upsert',
      code: '400',
      message: 'boom user@example.com',
    });
    addSyncSummaryBreadcrumb({ synced: 2, failed: 1 });
    addSyncSummaryBreadcrumb({ synced: 1, failed: 0 }); // ignored

    expect(sink).toHaveBeenCalledTimes(2);
    expect(sink.mock.calls[0]?.[0]).toMatchObject({
      category: 'sync',
      message: 'sync.session_upsert.failed',
      data: { kind: 'session_upsert', code: '400', message: 'boom [email]' },
    });
    expect(sink.mock.calls[1]?.[0]).toMatchObject({
      message: 'sync.batch.partial_or_failed',
      data: { synced: 2, failed: 1 },
    });
  });
});
