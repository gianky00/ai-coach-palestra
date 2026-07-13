# KineFit Mobile (Elite)

App React Native (Expo SDK 54) per il tracciamento allenamenti in palestra.

## Setup rapido

```bash
cd mobile
npm install --force
cp .env.example .env   # configura le chiavi Supabase
npx expo start --clear
```

## Struttura

| Cartella                 | Contenuto                                  |
| ------------------------ | ------------------------------------------ |
| `src/components/views`   | Schermate: Oggi, Storico, Analisi, Profilo |
| `src/components/modals`  | Log esercizio, impostazioni, riepilogo     |
| `src/lib/sqlite.ts`      | Database offline locale                    |
| `src/lib/offlineSync.ts` | Sync background con Supabase               |
| `src/services/`          | Layer accesso dati                         |
| `__tests__/`             | Test unitari Vitest                        |

## Configurazione Supabase

Le chiavi vanno in `mobile/.env` (non committare):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Per build EAS, configura gli stessi secret nel dashboard Expo.

Opzionale — monitoring errori con Sentry:

```env
EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

## Comandi

```bash
npm run typecheck      # TypeScript strict
npm test               # Vitest
npm run test:coverage  # Vitest + coverage (soglia 30%)
npm run test:watch     # Vitest watch
npm run e2e            # Maestro E2E (device + credenziali)
npm start              # Expo dev server
```

Vedi [TESTING_GUIDELINES.md](../docs/TESTING_GUIDELINES.md) e [STORE_SUBMISSION.md](../docs/STORE_SUBMISSION.md).

## Convenzioni

1. **Offline-first** — tutte le scritture passano da `saveLogSafely` / `startWorkoutSafely`
2. **Haptic feedback** — usa `hapticService` per conferme utente
3. **Safe area** — `react-native-safe-area-context` su tutte le view principali
