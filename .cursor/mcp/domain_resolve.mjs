/**
 * Resolve dominio KineFit → puntatori wiki/GEMINI (nessun contenuto architetturale).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const MAP_PATH = path.join(REPO_ROOT, '.cursor', 'kinefit-domain-map.json');

let _cache = null;

export function loadDomainMap() {
  if (_cache) return _cache;
  const raw = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
  _cache = raw && typeof raw === 'object' ? raw : { domains: [] };
  return _cache;
}

export function clearDomainMapCache() {
  _cache = null;
}

function norm(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, '_');
}

function pathPosix(s) {
  return String(s || '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '');
}

function ok(d, matchedBy, query) {
  const readFirst = ['AGENTS.md', 'wiki/INDEX.md', 'wiki/kinefit/INDEX.md'];
  for (const w of d.wiki || []) readFirst.push(w);
  for (const g of d.gemini || []) readFirst.push(g);
  return {
    ok: true,
    query,
    matched_by: matchedBy,
    domain_id: d.id,
    read_first: readFirst,
    smoke: d.smoke ?? null,
    cursor_rule: d.cursor_rule ?? null,
    skills: d.skills || [],
    notes: d.notes ?? null,
    reminder:
      'Leggi i path in read_first (wiki/GEMINI). Regole .mdc = solo vincoli. Se divergono → vince la wiki.',
  };
}

function matchPathPrefix(pathQ, domains, query) {
  const hits = [];
  for (const d of domains) {
    for (const pref of d.path_prefixes || []) {
      const prefN = pathPosix(pref);
      if (pathQ.startsWith(prefN) || pathQ.includes(prefN.replace(/\/$/, ''))) {
        hits.push([prefN.length, d]);
      }
    }
  }
  if (!hits.length) return null;
  hits.sort((a, b) => b[0] - a[0]);
  return ok(hits[0][1], 'path_prefix', query);
}

function matchAliasExact(q, domains, query) {
  for (const d of domains) {
    const keys = new Set([norm(d.id), ...(d.aliases || []).map(norm)]);
    if (keys.has(q)) return ok(d, 'alias', query);
  }
  return null;
}

function matchAliasFuzzy(q, domains, query) {
  const soft = [];
  for (const d of domains) {
    const keys = [norm(d.id), ...(d.aliases || []).map(norm)];
    if (keys.some((k) => q.includes(k) || k.includes(q))) soft.push(d);
  }
  if (soft.length === 1) return ok(soft[0], 'fuzzy', query);
  if (soft.length > 1) {
    return {
      ok: false,
      error: 'ambiguous',
      query,
      candidates: soft.map((d) => d.id),
      hint: 'Richiama resolve_domain con un id esatto.',
    };
  }
  return null;
}

export function listDomains() {
  const domains = loadDomainMap().domains || [];
  return domains.map((d) => ({
    id: d.id,
    aliases: d.aliases || [],
    wiki: d.wiki || [],
  }));
}

export function resolveDomain(query) {
  const raw = String(query || '').trim();
  const domains = loadDomainMap().domains || [];
  if (!raw) {
    return {
      ok: false,
      error: 'query_vuota',
      hint: 'Passa un path (mobile/src/...) o un alias (oggi, garmin, smoke).',
      domains: domains.map((d) => d.id),
    };
  }
  const q = norm(raw);
  let hit = matchPathPrefix(pathPosix(raw), domains, raw);
  if (hit) return hit;
  hit = matchAliasExact(q, domains, raw);
  if (hit) return hit;
  hit = matchAliasFuzzy(q, domains, raw);
  if (hit) return hit;
  return {
    ok: false,
    error: 'not_found',
    query: raw,
    domains: domains.map((d) => d.id),
    hint: 'Boot: AGENTS.md → wiki/INDEX.md → wiki/kinefit/INDEX.md',
  };
}
