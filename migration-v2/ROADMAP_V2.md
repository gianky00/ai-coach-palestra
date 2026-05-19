# 🚀 ROADMAP V2: Completamento Totale AI Coach

Questo documento traccia il piano per portare la WebApp React + Supabase a un livello di qualità commerciale ("App Definitiva").

## 🔒 FASE 1: Sicurezza e Isolamento (Authentication)
_Obiettivo: Rendere l'app privata e sicura per il tuo account._
- [ ] Creazione pagina di Login / Registrazione (Supabase Auth).
- [ ] Implementazione del Context Provider in React per mantenere la sessione attiva.
- [ ] Riattivazione della **Row Level Security (RLS)** su Supabase per blindare i dati (Errore 401 risolto permanentemente).
- [ ] Assegnazione automatica del `user_id` a ogni nuovo log o esercizio.

## 🏋️ FASE 2: Gestione Avanzata dell'Allenamento (Set Multipli)
_Obiettivo: Permettere di loggare l'intero allenamento, non solo l'ultimo set._
- [ ] Modifica UI Modale: permettere l'inserimento di più Set consecutivi per lo stesso esercizio (es. Set 1, Set 2, Set 3).
- [ ] Creazione del concetto di "Workout Session" (Inizio/Fine allenamento) collegato alla tabella `workout_sessions`.
- [ ] Feedback visivo sulle Card per mostrare quanti set sono stati completati rispetto al target (es. 2/4 completati).

## 📈 FASE 3: Analytics e Storico (Dashboard)
_Obiettivo: Visualizzare i progressi nel tempo._
- [ ] Attivazione del tab "Storico" nella Bottom Nav.
- [ ] Lista a scorrimento degli allenamenti passati raggruppati per data.
- [ ] Integrazione libreria Grafici (Recharts) per disegnare:
  - Curva del Volume Totale settimanale.
  - Progressione del Massimale Stimato (e1RM) per gli esercizi principali (Panca, Squat, ecc.).

## 🧬 FASE 4: Biometria e Personalizzazione (Profilo)
_Obiettivo: Gestire il corpo e l'ambiente dell'app._
- [ ] Attivazione tab "Info/Profilo".
- [ ] Funzione per aggiornare il Peso Corporeo salvandolo nella tabella `biometrics`.
- [ ] Creazione interfaccia per `user_settings` (scelta tema, durata timer di recupero default, peso bilanciere vuoto).

## ✈️ FASE 5: Offline First (PWA Definitiva)
_Obiettivo: Funzionamento garantito anche senza internet (es. in cantina/palestra)._
- [ ] Installazione e configurazione di `vite-plugin-pwa`.
- [ ] Caching locale avanzato (IndexedDB) per gli esercizi del giorno.
- [ ] Sincronizzazione "Background Sync": i log salvati offline vengono inviati automaticamente a Supabase appena torna la connessione.
- [ ] Generazione di Icone e Manifest per l'installazione nativa su iOS/Android.

---
**Stato Attuale:** Core Base + UI Reattiva completati. Pronti per la Fase 1.
