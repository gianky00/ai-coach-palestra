# KineFit — Premium Elite Workout Tracker

KineFit è un'app mobile professionale per il tracciamento degli allenamenti in palestra.

## Stack tecnologico

- **Mobile:** React Native (Expo SDK 54) + TypeScript + SQLite
- **Backend & Auth:** Supabase (RLS abilitata)
- **Offline-first:** SQLite locale + sync background
- **State:** Zustand + TanStack Query

## Struttura del progetto

- `/mobile`: Progetto Expo (React Native) — **unico prodotto attivo**
  - `/mobile/src/components/views`: Schermate (Oggi, Storico, Analisi, Profilo)
  - `/mobile/src/lib/sqlite.ts`: Storage offline locale
  - `/mobile/src/lib/offlineSync.ts`: Background sync con Supabase
  - `/mobile/__tests__`: Test unitari Vitest

## Convenzioni di sviluppo

1. **Offline resilience:** Tutte le scritture passano per `saveLogSafely` o `startWorkoutSafely`
2. **UI nativa:** `@expo/vector-icons` (Ionicons) + `react-native-safe-area-context`
3. **Haptic feedback:** `hapticService` per azioni di conferma
4. **Test:** Aggiungere test Vitest per logica pura in `__tests__/`

## Comandi principali

```bash
npm run mobile:dev      # Avvia Expo
npm run validate        # Typecheck + test
npm run mobile:build    # Build APK EAS
```

## Configurazione

Copia `mobile/.env.example` in `mobile/.env` e imposta le chiavi Supabase.
