# KineFit LLM Wiki — Master Index & Knowledge Graph

Benvenuto nella **LLM Wiki tecnica di KineFit** (`wiki/kinefit/`), il grafo di conoscenza per agenti IA e sviluppatori.

Hub multi-sezione: [[INDEX|wiki/INDEX.md]].

---

## Mappa di Navigazione e Grafo Principale

```
                     [ [[kinefit/INDEX]] ]
                             │
     ┌───────────────────────┼───────────────────────┐
     ▼                       ▼                       ▼
[[kinefit/architecture/overview]]  [[kinefit/modules/oggi]]   [[kinefit/workflows/pre_commit_wiki_protocol]]
     │                       │                       │
     ├─ [[kinefit/architecture/offline_sync]]  ├─ [[kinefit/modules/history]]  ├─ [[kinefit/workflows/docs_vs_wiki]]
     └─ [[kinefit/architecture/sqlite_schema]] ├─ [[kinefit/modules/analytics]] ├─ [[kinefit/workflows/cursor_rules]]
                             ├─ [[kinefit/modules/profile]]          └─ [[kinefit/workflows/quality_gates]]
                             ├─ [[kinefit/modules/auth]]
                             ├─ [[kinefit/modules/garmin]]
                             └─ [[kinefit/modules/smoke]]
```

---

## Sezioni della Wiki

### 1. Architettura di Sistema

- **[[kinefit/architecture/overview|Overview Architetturale]]**: bare React Native + Android Studio/Gradle + Metro, Zustand, TanStack Query, Supabase RLS.
- **[[kinefit/architecture/offline_sync|Offline Sync]]**: `saveLogSafely` / `startWorkoutSafely`, feedback banner, freeze `syncFeedback`.
- **[[kinefit/architecture/sqlite_schema|SQLite Schema]]**: `offline_logs` / `offline_sessions` / tombstones, indici idempotenti.

### 2. Moduli di Dominio

- **[[kinefit/modules/oggi|Oggi]]**: scheda giornaliera, log set, timer, streak, note sessione.
- **[[kinefit/modules/history|History]]**: storico sessione, merge offline, export CSV, badge PR.
- **[[kinefit/modules/analytics|Analytics]]**: volume muscolare, settimana lun–dom, empty state.
- **[[kinefit/modules/profile|Profile]]**: profilo, settings, peso, Garmin UI.
- **[[kinefit/modules/auth|Auth]]**: AuthProvider, env `KINEFIT_*`, niente Expo.
- **[[kinefit/modules/garmin|Garmin]]**: facade mobile + edge Supabase (PKCE, tokens, sync).
- **[[kinefit/modules/smoke|Smoke & Maestro]]**: deep-link `kinefit://smoke/...`, Pixel_9a, testID freeze.

### 3. Workflow Agentici

- **[[kinefit/workflows/pre_commit_wiki_protocol|Protocollo Wiki-Sync]]**: boot ogni prompt; aggiornare wiki prima di chiudere.
- **[[kinefit/workflows/docs_vs_wiki|Docs ops vs Wiki]]**: wiki = grafo; docs = ops; AGENT_SYNC = diario.
- **[[kinefit/workflows/cursor_rules|Cursor Rules + MCP]]**: `.mdc`, hook, domain map, `resolve_domain`.
- **[[kinefit/workflows/quality_gates|Quality Gates A–H]]**: Gate F include inventory + contract sync.

---

## Regole Auree per Agenti IA

1. **Boot ogni prompt**: leggere `AGENTS.md` → `wiki/INDEX.md` → questo `wiki/kinefit/INDEX.md` prima di agire (regola Cursor `agents-wiki-boot`).
2. **Diff Minimo**: modificare solo quanto strettamente necessario al task.
3. **Hard Freeze**: non cancellare `syncFeedback.ts` / `SyncFailBanner`; non rinominare testID smoke/Maestro; non reintrodurre Expo.
4. **Env**: preferire `KINEFIT_*`; dual-read legacy `EXPO_PUBLIC_*` solo in `platform/constants.ts` finché serve.
5. **Wiki Sync**: ad ogni modifica rilevante (schema, API pubblica, testID, Garmin, protocolli agente), aggiornare `/wiki/kinefit` prima di chiudere — vedi [[kinefit/workflows/pre_commit_wiki_protocol]].
6. **Test esistenti**: se il perimetro toccato ha già un Vitest, eseguirlo; se fallisce, correggere codice o test prima di chiudere.
