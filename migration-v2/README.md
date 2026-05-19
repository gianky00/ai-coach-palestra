# AI Coach - V2 Migration

Questa sottocartella contiene la migrazione del progetto "AI Coach" da Google Apps Script a un'architettura **Progressive Web App (PWA)** moderna.

## Stack Tecnologico (V2)
- **Framework:** React + TypeScript (Vite)
- **Styling:** CSS Moduli / Vanilla CSS (Niente Tailwind per mantenere il controllo totale)
- **Icone:** Lucide React
- **Database (Futuro):** Supabase (PostgreSQL)
- **Hosting (Futuro):** Vercel / Netlify

## Roadmap di Migrazione
1. [x] Inizializzazione progetto Vite.
2. [ ] Ricostruzione Layout Dashboard (Dark Mode UI).
3. [ ] Creazione componenti per Esercizi (Card, Modali).
4. [ ] Implementazione logica offline e local state.
5. [ ] Collegamento a Supabase per sincronizzazione dati e sostituzione Google Sheets.

Il codice originale Apps Script continua a vivere e funzionare nella cartella root `src/`. Questa cartella `migration-v2` è un cantiere isolato per testare la nuova app in locale.
