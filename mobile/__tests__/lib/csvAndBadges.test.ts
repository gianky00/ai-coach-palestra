import { describe, expect, it } from 'vitest';

import { escapeCsv } from '../../src/lib/csv';
import { garminBadgeLabel } from '../../src/lib/garminBadges';

describe('escapeCsv', () => {
  it('lascia invariati valori semplici', () => {
    expect(escapeCsv('panca')).toBe('panca');
    expect(escapeCsv(100)).toBe('100');
    expect(escapeCsv(null)).toBe('');
  });

  it('protegge virgole, quote e newline', () => {
    expect(escapeCsv('a,b')).toBe('"a,b"');
    expect(escapeCsv('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsv('a\nb')).toBe('"a\nb"');
  });
});

describe('garminBadgeLabel', () => {
  it('mappa gli stati UI', () => {
    expect(garminBadgeLabel('demo')).toBe('Demo');
    expect(garminBadgeLabel('connected')).toBe('Connesso');
    expect(garminBadgeLabel('needs_reconnect')).toBe('Ricollega');
    expect(garminBadgeLabel('disconnected')).toBe('');
  });
});
