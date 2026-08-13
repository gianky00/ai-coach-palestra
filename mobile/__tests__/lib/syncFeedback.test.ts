import { describe, expect, it } from 'vitest';

import {
  buildSyncFeedback,
  isSyncFailureFeedback,
  mapSyncFeedback,
} from '../../src/lib/syncFeedback';

const fixedNow = () => new Date('2026-08-13T12:00:00.000Z');

describe('buildSyncFeedback / mapSyncFeedback', () => {
  it('aliases map to build', () => {
    expect(mapSyncFeedback).toBe(buildSyncFeedback);
  });

  it('maps full success', () => {
    const fb = buildSyncFeedback({ synced: 2, failed: 0, remaining: 0 }, fixedNow);
    expect(fb).toMatchObject({
      kind: 'ok',
      synced: 2,
      failed: 0,
      remaining: 0,
      title: 'Sincronizzato',
      at: '2026-08-13T12:00:00.000Z',
    });
    expect(fb.bannerText).toMatch(/2 elementi inviati/);
  });

  it('maps empty success', () => {
    const fb = buildSyncFeedback({ synced: 0, failed: 0 }, fixedNow);
    expect(fb.kind).toBe('ok');
    expect(fb.bannerText).toMatch(/Tutto sincronizzato/);
  });

  it('maps partial failure with failed count in banner', () => {
    const fb = buildSyncFeedback({ synced: 3, failed: 2, remaining: 2 }, fixedNow);
    expect(fb).toMatchObject({
      kind: 'partial',
      failed: 2,
      synced: 3,
      remaining: 2,
      title: 'Sync parziale',
    });
    expect(fb.bannerText).toMatch(/2 falliti/);
    expect(fb.bannerText).toMatch(/2 in coda/);
    expect(fb.message).toMatch(/3 ok/);
  });

  it('defaults remaining to failed when omitted', () => {
    const fb = buildSyncFeedback({ synced: 1, failed: 4 }, fixedNow);
    expect(fb.remaining).toBe(4);
    expect(fb.bannerText).toMatch(/4 falliti/);
  });

  it('maps total failure with failed count', () => {
    const fb = buildSyncFeedback({ synced: 0, failed: 1, remaining: 1 }, fixedNow);
    expect(fb).toMatchObject({
      kind: 'failed',
      failed: 1,
      title: 'Sync non riuscita',
    });
    expect(fb.bannerText).toMatch(/1 elemento non sincronizzato/);
  });

  it('clamps negative / non-finite counts', () => {
    const fb = buildSyncFeedback({ synced: -1, failed: Number.NaN, remaining: 2 }, fixedNow);
    expect(fb.kind).toBe('ok');
    const partial = buildSyncFeedback({ synced: 1.9, failed: 2.2, remaining: 3.7 }, fixedNow);
    expect(partial).toMatchObject({ kind: 'partial', synced: 1, failed: 2, remaining: 3 });
  });
});

describe('isSyncFailureFeedback', () => {
  it('is true only for partial/failed', () => {
    expect(isSyncFailureFeedback(null)).toBe(false);
    expect(isSyncFailureFeedback(buildSyncFeedback({ synced: 1, failed: 0 }, fixedNow))).toBe(
      false,
    );
    expect(isSyncFailureFeedback(buildSyncFeedback({ synced: 1, failed: 1 }, fixedNow))).toBe(true);
    expect(isSyncFailureFeedback(buildSyncFeedback({ synced: 0, failed: 2 }, fixedNow))).toBe(true);
  });
});
