#!/usr/bin/env node
/**
 * Generate auto inventory section in mobile/GEMINI.md (path / LOC / exports).
 * Preserves manual notes above <!-- gemini:auto:start -->.
 *
 * Usage:
 *   node scripts/generate_module_maps.mjs
 *   node scripts/generate_module_maps.mjs --check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GEMINI_PATH = path.join(ROOT, 'mobile', 'GEMINI.md');
const START = '<!-- gemini:auto:start -->';
const END = '<!-- gemini:auto:end -->';

const SCAN_DIRS = [
  { label: 'mobile/src', abs: path.join(ROOT, 'mobile', 'src') },
  { label: 'supabase/functions', abs: path.join(ROOT, 'supabase', 'functions') },
];

const EXPORT_RE =
  /^export\s+(?:async\s+)?(?:function|const|class|type|interface|enum)\s+([A-Za-z0-9_$]+)/;
const REEXPORT_RE = /^export\s+\{[^}]+\}\s+from\s+/;
const STAR_REEXPORT_RE = /^export\s+\*\s+from\s+/;

function walkTsFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '__tests__') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkTsFiles(full, out);
    else if (/\.tsx?$/.test(ent.name) && !ent.name.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

function analyzeFile(absPath) {
  const rel = path.relative(ROOT, absPath).split(path.sep).join('/');
  const src = fs.readFileSync(absPath, 'utf8');
  const lines = src.length === 0 ? 0 : src.split(/\r?\n/).length;
  const exports = [];
  for (const line of src.split(/\r?\n/)) {
    const trimmed = line.trim();
    const m = trimmed.match(EXPORT_RE);
    if (m) {
      exports.push(m[1]);
      continue;
    }
    if (REEXPORT_RE.test(trimmed) || STAR_REEXPORT_RE.test(trimmed)) {
      exports.push('(re-export)');
    }
  }
  return { path: rel, loc: lines, exports };
}

function tableFor(files) {
  if (files.length === 0) return '_Nessun file._\n';
  let md = '| Path | Righe | Export |\n|------|-------|--------|\n';
  for (const f of files.sort((a, b) => a.path.localeCompare(b.path))) {
    const exp = f.exports.length ? f.exports.join(', ') : '—';
    md += `| \`${f.path}\` | ${f.loc} | ${exp.replace(/\|/g, '\\|')} |\n`;
  }
  return md + '\n';
}

function buildAutoBlock() {
  let md = `${START}\n`;
  md += '<!-- Generato da scripts/generate_module_maps.mjs — non editare a mano -->\n\n';
  for (const dir of SCAN_DIRS) {
    const files = walkTsFiles(dir.abs).map(analyzeFile);
    md += `## Inventario auto — \`${dir.label}\`\n\n`;
    md += tableFor(files);
  }
  md += '---\n';
  md +=
    'Knowledge graph: [`wiki/kinefit/INDEX.md`](../wiki/kinefit/INDEX.md). ' +
    'Ops: [`docs/GEMINI.md`](../docs/GEMINI.md).\n';
  md += `${END}\n`;
  return md;
}

function main() {
  const checkOnly = process.argv.includes('--check');
  if (!fs.existsSync(GEMINI_PATH)) {
    console.error(`Manca ${path.relative(ROOT, GEMINI_PATH)} — crea le note manuali prima.`);
    process.exit(2);
  }
  const existing = fs.readFileSync(GEMINI_PATH, 'utf8');
  if (!existing.includes(START) || !existing.includes(END)) {
    console.error('Marcatori <!-- gemini:auto:start/end --> mancanti in mobile/GEMINI.md');
    process.exit(2);
  }
  const before = existing.split(START)[0];
  const afterParts = existing.split(END);
  const after = afterParts.length > 1 ? afterParts.slice(1).join(END) : '\n';
  const auto = buildAutoBlock();
  const next = before + auto + (after.startsWith('\n') ? after.slice(1) : after);

  if (checkOnly) {
    if (next === existing) {
      console.log('OK: mobile/GEMINI.md inventory allineato');
      process.exit(0);
    }
    console.error('FAIL: mobile/GEMINI.md inventory stantio — esegui npm run wiki:inventory');
    process.exit(1);
  }

  if (next === existing) {
    console.log('Invariato mobile/GEMINI.md');
  } else {
    fs.writeFileSync(GEMINI_PATH, next, 'utf8');
    console.log('Aggiornato mobile/GEMINI.md');
  }
}

main();
