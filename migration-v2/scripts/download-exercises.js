import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definiamo i percorsi delle cartelle locali
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets');
const EXERCISES_DIR = path.join(ASSETS_DIR, 'exercises');
const GROUPS_DIR = path.join(EXERCISES_DIR, 'groups');

// Assicuriamoci che tutte le cartelle esistano
fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(ASSETS_DIR, { recursive: true });
fs.mkdirSync(EXERCISES_DIR, { recursive: true });
fs.mkdirSync(GROUPS_DIR, { recursive: true });

// Immagini reali di fallback stabili per ciascun gruppo muscolare (Unsplash HD)
const GROUP_FALLBACKS = {
  petto:
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80',
  schiena:
    'https://images.unsplash.com/photo-1603387124444-85788a531e21?auto=format&fit=crop&w=600&q=80',
  lombari:
    'https://images.unsplash.com/photo-1603387124444-85788a531e21?auto=format&fit=crop&w=600&q=80',
  gambe:
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
  spalle:
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=600&q=80',
  bicipiti:
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
  tricipiti:
    'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?auto=format&fit=crop&w=600&q=80',
  core: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
  addominali:
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
  default:
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
};

// Mappatura dei 50 esercizi reali del database ad immagini reali ad alte prestazioni
const EXERCISES_MAP = {
  'panca piana':
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80',
  pulley:
    'https://images.unsplash.com/photo-1603387124444-85788a531e21?auto=format&fit=crop&w=600&q=80',
  plank:
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
  'lat machine avanti':
    'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=600&q=80',
  'lat machine presa inversa':
    'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=600&q=80',
  'bicipiti martello manubri':
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
  'bicipiti manubri alternati':
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
  'bicipiti bilanciere ez presa ampia':
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
  'bicipiti su panca scott con manubrio':
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
  'curl concentrato':
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
  'kick back manubrio':
    'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?auto=format&fit=crop&w=600&q=80',
  'tricipiti ercolina':
    'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?auto=format&fit=crop&w=600&q=80',
  'french press':
    'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?auto=format&fit=crop&w=600&q=80',
  'dip tra panche':
    'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?auto=format&fit=crop&w=600&q=80',
  'leg press 45°':
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
  'leg extension':
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
  'leg extension (richiamo)':
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
  'leg curl':
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
  'calf in piedi':
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
  'calf seduto':
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
  'stacco rumeno (rdl)':
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
  'affondi su posto monolaterali':
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
  'alzate laterali':
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=600&q=80',
  'alzate frontali':
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=600&q=80',
  'croci a 90°':
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=600&q=80',
  'revers fly 1 braccio per volta':
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=600&q=80',
  'shoulder press presa ampia':
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=600&q=80',
  'military press manubri':
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=600&q=80',
  'distensioni panca 30° manubri':
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80',
  'croci ai cavi alti':
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80',
  'croci panca piana':
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80',
  pullover:
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80',
  'chest press orizzontale':
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80',
  'rematore manubrio singolo':
    'https://images.unsplash.com/photo-1603387124444-85788a531e21?auto=format&fit=crop&w=600&q=80',
  'face pull ai cavi':
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=600&q=80',
  hiperextension:
    'https://images.unsplash.com/photo-1603387124444-85788a531e21?auto=format&fit=crop&w=600&q=80',
  'rowing machine':
    'https://images.unsplash.com/photo-1603387124444-85788a531e21?auto=format&fit=crop&w=600&q=80',
  pulldown:
    'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=600&q=80',
  addominali:
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
  'crunch inverso':
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
  'bicycle crunch':
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
  'abs machine':
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
};

// Funzione di utilità per scaricare un file via HTTPS
const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    https
      .get(url, (response) => {
        // In caso di redirect (es. Unsplash o Wikipedia)
        if (response.statusCode === 301 || response.statusCode === 302) {
          downloadFile(response.headers.location, dest).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Richiesta fallita con codice: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close(() => {
            resolve();
          });
        });
      })
      .on('error', (err) => {
        fs.unlink(dest, () => {}); // Elimina il file in caso di errore
        reject(err);
      });
  });
};

async function main() {
  console.log('\x1b[35m=== AVVIO SCARICAMENTO FOTO REALI ESERCIZI ===\x1b[0m\n');

  // 1. Scarica i fallback per i gruppi muscolari
  console.log(
    '\x1b[36m1. Scaricamento delle immagini di fallback per i gruppi muscolari...\x1b[0m',
  );
  for (const [group, url] of Object.entries(GROUP_FALLBACKS)) {
    const dest = path.join(GROUPS_DIR, `${group}.jpg`);
    try {
      console.log(`- Scarico fallback per: "${group}"...`);
      await downloadFile(url, dest);
    } catch (error) {
      console.error(
        `\x1b[31m  Errore durante lo scaricamento di "${group}": ${error.message}\x1b[0m`,
      );
    }
  }

  // 2. Scarica le immagini specifiche degli esercizi
  console.log(
    '\n\x1b[36m2. Scaricamento delle immagini specifiche per ciascun esercizio...\x1b[0m',
  );
  let downloadedCount = 0;

  for (const [exName, url] of Object.entries(EXERCISES_MAP)) {
    const filename = exName.replace(/\s+/g, '_').toLowerCase() + '.jpg';
    const dest = path.join(EXERCISES_DIR, filename);

    try {
      console.log(`- Scarico foto reale per: "${exName.toUpperCase()}"...`);
      await downloadFile(url, dest);
      downloadedCount++;
    } catch (error) {
      console.error(
        `\x1b[31m  Errore durante lo scaricamento di "${exName}": ${error.message}\x1b[0m`,
      );
    }
  }

  console.log(
    `\n\x1b[42m\x1b[30m SCARICAMENTO COMPLETATO! ${downloadedCount}/${Object.keys(EXERCISES_MAP).length} foto reali salvate localmente. \x1b[0m\n`,
  );
}

main();
