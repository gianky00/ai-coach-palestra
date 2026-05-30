import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextVersion = process.argv[2];
const rawNotes = process.argv[3] || '';

if (!nextVersion) {
  console.error('\x1b[31mErrore: Versione non specificata.\x1b[0m');
  process.exit(1);
}

const changelogPath = path.join(__dirname, '..', 'src', 'config', 'changelog.json');

console.log(`\x1b[36mAggiornamento di changelog.json per la versione v${nextVersion}...\x1b[0m`);

// Parsing delle note di rilascio Markdown per convertirle in array JSON
let notes = [];
if (rawNotes) {
  // Filtra e pulisce i punti elenco del Markdown (* o -)
  notes = rawNotes
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('-') || line.startsWith('*'))
    .map((line) => line.replace(/^[-*]\s+/, ''))
    .filter(Boolean);
}

// Se non ci sono punti elenco, prova a dividere per righe non vuote pulendo intestazioni
if (notes.length === 0 && rawNotes.trim()) {
  notes = rawNotes
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('###'))
    .filter(Boolean);
}

// Fallback se le note sono vuote
if (notes.length === 0) {
  notes = [`Aggiornamenti e ottimizzazioni per la versione v${nextVersion}`];
}

try {
  let changelog = [];
  if (fs.existsSync(changelogPath)) {
    changelog = JSON.parse(fs.readFileSync(changelogPath, 'utf8'));
  }

  // Previene duplicati se lo script viene innescato due volte accidentalmente
  changelog = changelog.filter((entry) => entry.version !== nextVersion);

  const today = new Date().toISOString().split('T')[0];
  changelog.unshift({
    version: nextVersion,
    date: today,
    notes: notes,
  });

  fs.writeFileSync(changelogPath, JSON.stringify(changelog, null, 2) + '\n', 'utf8');
  console.log('\x1b[32m✓ src/config/changelog.json aggiornato correttamente.\x1b[0m');
} catch (error) {
  console.error('\x1b[31mErrore durante la scrittura di changelog.json:\x1b[0m', error);
  process.exit(1);
}
