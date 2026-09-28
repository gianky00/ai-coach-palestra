import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { clearDomainMapCache, listDomains, resolveDomain } from '../.cursor/mcp/domain_resolve.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
void __dirname;

describe('kinefit domain_resolve', () => {
  clearDomainMapCache();

  it('lists domains with garmin and oggi', () => {
    const ids = listDomains().map((d) => d.id);
    assert.ok(ids.includes('garmin'));
    assert.ok(ids.includes('oggi'));
    assert.ok(ids.includes('offline_sync'));
  });

  it('resolves alias garmin', () => {
    const r = resolveDomain('garmin');
    assert.equal(r.ok, true);
    assert.equal(r.domain_id, 'garmin');
    assert.ok(r.read_first.includes('AGENTS.md'));
    assert.ok(r.read_first.includes('wiki/kinefit/INDEX.md'));
    assert.ok(r.read_first.some((p) => p.includes('garmin.md')));
  });

  it('resolves path offlineSync.ts', () => {
    const r = resolveDomain('mobile/src/lib/offlineSync.ts');
    assert.equal(r.ok, true);
    assert.equal(r.domain_id, 'offline_sync');
  });

  it('empty query fails', () => {
    const r = resolveDomain('');
    assert.equal(r.ok, false);
    assert.equal(r.error, 'query_vuota');
  });

  it('unknown query fails', () => {
    const r = resolveDomain('xyzzy-not-a-domain');
    assert.equal(r.ok, false);
    assert.equal(r.error, 'not_found');
  });
});
