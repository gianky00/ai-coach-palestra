import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const getPackageJsonPath = () => path.join(__dirname, '..', 'package.json');

const getPackageJson = () => {
  const data = fs.readFileSync(getPackageJsonPath(), 'utf8');
  return JSON.parse(data);
};

const savePackageJson = (json) => {
  fs.writeFileSync(getPackageJsonPath(), JSON.stringify(json, null, 2) + '\n', 'utf8');
};

const runCommand = (command) => {
  console.log(`\x1b[36mEsecuzione: ${command}\x1b[0m`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`\x1b[31mErrore durante l'esecuzione del comando: ${command}\x1b[0m`);
    return false;
  }
};

const bumpVersion = (currentVersion, type) => {
  const parts = currentVersion.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Versione corrente non valida: ${currentVersion}`);
  }

  let [major, minor, patch] = parts;

  switch (type) {
    case 'major':
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor += 1;
      patch = 0;
      break;
    case 'patch':
    default:
      patch += 1;
      break;
  }

  return `${major}.${minor}.${patch}`;
};

console.log('\x1b[1m\x1b[35m=== AUTOMATIZZAZIONE DEL RILASCIO SEMANTICO KINEFIT ===\x1b[0m\n');

const pkg = getPackageJson();
const currentVersion = pkg.version;
console.log(`Versione attuale: \x1b[32mv${currentVersion}\x1b[0m\n`);

rl.question('Seleziona il tipo di rilascio (patch [default], minor, major): ', (answer) => {
  const type = answer.trim().toLowerCase() || 'patch';

  if (!['patch', 'minor', 'major'].includes(type)) {
    console.log('\x1b[31mOpzione non valida. Rilascio annullato.\x1b[0m');
    rl.close();
    process.exit(1);
  }

  const nextVersion = bumpVersion(currentVersion, type);
  console.log(`\nNuova versione proposta: \x1b[32mv${nextVersion}\x1b[0m\n`);

  rl.question(
    'Avviare i controlli di qualità automatizzati prima del rilascio? (s/n): ',
    (runChecks) => {
      if (runChecks.trim().toLowerCase() === 's') {
        console.log('\n\x1b[33mAvvio di "npm run validate"...\x1b[0m');
        if (!runCommand('npm run validate')) {
          console.log('\x1b[31mControlli di qualità falliti. Rilascio interrotto.\x1b[0m');
          rl.close();
          process.exit(1);
        }

        console.log('\n\x1b[33mAvvio di "npm run build"...\x1b[0m');
        if (!runCommand('npm run build')) {
          console.log('\x1b[31mBuild di produzione fallita. Rilascio interrotto.\x1b[0m');
          rl.close();
          process.exit(1);
        }
        console.log('\n\x1b[32m✓ Tutti i controlli sono passati con successo!\x1b[0m\n');
      }

      rl.question(`Confermi il rilascio di v${nextVersion}? (s/n): `, (confirm) => {
        if (confirm.trim().toLowerCase() !== 's') {
          console.log("\x1b[31mRilascio annullato dall'utente.\x1b[0m");
          rl.close();
          process.exit(0);
        }

        // Aggiorna package.json
        pkg.version = nextVersion;
        savePackageJson(pkg);
        console.log('\x1b[32mpackage.json aggiornato con successo.\x1b[0m');

        // Git Operations
        console.log('\n\x1b[33mCreazione del commit e del tag Git...\x1b[0m');

        const commitSuccess = runCommand(
          `git commit -am "chore(release): bump version to v${nextVersion}"`,
        );
        if (!commitSuccess) {
          console.log(
            '\x1b[33mNessun file modificato o errore nel commit. Continuo con la creazione del tag...\x1b[0m',
          );
        }

        const tagSuccess = runCommand(`git tag -a v${nextVersion} -m "Release v${nextVersion}"`);

        if (tagSuccess) {
          console.log(
            `\n\x1b[42m\x1b[30m RILASCIO v${nextVersion} COMPLETATO CON SUCCESSO! \x1b[0m`,
          );
          console.log(`\nPer inviare i cambiamenti al repository remoto, esegui:`);
          console.log(`\x1b[36mgit push origin main --tags\x1b[0m\n`);
        } else {
          console.log('\x1b[31mErrore durante la creazione del tag Git.\x1b[0m');
        }

        rl.close();
      });
    },
  );
});
