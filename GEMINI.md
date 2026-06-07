# ♾️ KineFit - Premium Elite Workout Tracker

KineFit è un'applicazione professionale per il tracciamento degli allenamenti, progettata con un'estetica "Premium Elite" e un'architettura duale (Web + Nativa Mobile).

## 🛠️ Stack Tecnologico

- **Web:** React 19 + TypeScript + Vite + Zustand.
- **Mobile (Nativo):** React Native (Expo SDK 54) + TypeScript + SQLite.
- **Backend & Auth:** Supabase (RLS abilitata).
- **Offline-First:**
  - Web: IndexedDB.
  - Mobile: SQLite (Storage locale persistente ad alte prestazioni).
- **Gestione Dati:** TanStack Query per caching e sincronizzazione asincrona.

## 📂 Struttura del Progetto

- `/src`: Codice sorgente della web-app originale.
- `/mobile`: Progetto nativo Expo (React Native).
  - `/mobile/src/components/views`: Schermate native (Oggi, Storico, Analisi, Profilo).
  - `/mobile/src/lib/sqlite.ts`: Motore di storage offline locale.
  - `/mobile/src/lib/offlineSync.ts`: Logica di background sync con Supabase.

## 📜 Convenzioni di Sviluppo (Mobile Elite)

1. **Parità Funzionale:** Ogni modifica alla logica di business nei servizi (`/mobile/src/services`) deve essere testata per garantire coerenza con il database Supabase.
2. **Offline Resilience:** Tutte le operazioni di scrittura devono passare per `saveLogSafely` o `startWorkoutSafely` per garantire il salvataggio in SQLite in assenza di rete.
3. **UI Nativa:** Usare `@expo/vector-icons` (Ionicons) per le icone e `react-native-safe-area-context` per la gestione dei bordi dello schermo.
4. **Haptic Feedback:** Integrare sempre `hapticService` per le azioni di conferma (salvataggio, PR, fine timer).

## 🚀 Comandi Principali

### Web

- `npm run dev`: Avvia l'ambiente web.

### Mobile

- `npm run mobile:install`: Installa le dipendenze nativi.
- `npm run mobile:dev`: Avvia il server Expo (QR Code).
- `cd mobile; npx expo start --clear`: Avvio pulito in caso di errori di bundling.

---

_Nota: Consultare `mobile/MOBILE_ROADMAP.md` per lo stato di avanzamento delle funzionalità native._
