# AGENTS.md — KineFit

Guida corta per qualsiasi agente IA. **Non** sostituisce la documentazione completa: punta alle mappe operative.

## Boot obbligatorio (ogni prompt)

**Prima di agire**, leggere questo file e poi seguire l’ordine sotto. L’entrypoint di contesto è **`wiki/INDEX.md`** (hub) → **`wiki/kinefit/INDEX.md`** (grafo codice).

Regole Cursor: **`.cursor/rules/`** (indice `kinefit-rules-index.mdc`).  
Hook sessione: **`.cursor/hooks.json`**. MCP dominio: **`.cursor/mcp.json`** (`kinefit-agent`).  
Catalogo: [`wiki/kinefit/workflows/cursor_rules.md`](wiki/kinefit/workflows/cursor_rules.md).

## Leggere nell’ordine

1. [`wiki/INDEX.md`](wiki/INDEX.md) — hub sezioni wiki
2. [`wiki/kinefit/INDEX.md`](wiki/kinefit/INDEX.md) — **LLM Wiki di KineFit**
3. [`docs/GEMINI.md`](docs/GEMINI.md) — ops: env, comandi, checklist (architettura → wiki/kinefit)
4. [`mobile/GEMINI.md`](mobile/GEMINI.md) — note agente + inventario auto
5. Opzionale: [`docs/AGENT_SYNC.md`](docs/AGENT_SYNC.md) — diario parallel agents (non è il grafo)

## Vincoli rapidi

| Regola        | Dettaglio                                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Diff minimo   | Solo ciò che serve al task                                                                                                 |
| LLM Wiki Sync | Aggiornare `/wiki/kinefit` su modifiche rilevanti prima di chiudere (`wiki/kinefit/workflows/pre_commit_wiki_protocol.md`) |
| No Expo       | Non reintrodurre Expo CLI / moduli / managed workflow                                                                      |
| Env           | Preferire `KINEFIT_*`; dual-read `EXPO_PUBLIC_*` solo in `platform/constants.ts`                                           |
| Sync feedback | Non cancellare `syncFeedback.ts` / `SyncFailBanner` / wiring store                                                         |
| Smoke testID  | Non rinominare ID usati da Maestro / verify UI                                                                             |
| Emulator      | Default AVD: **Pixel_9a**                                                                                                  |
| Commit        | Solo se l’utente lo chiede                                                                                                 |

## Stack

Bare React Native + Android Studio/Gradle · Metro · Zustand + TanStack Query · SQLite · Supabase (RLS)

## Ambiente Windows (PowerShell)

| Scenario       | Comando                                     |
| -------------- | ------------------------------------------- |
| Metro          | `npm run metro`                             |
| Studio         | `npm run android:studio`                    |
| Gate A–E       | `npm run gate`                              |
| Quality quick  | `python scripts/run_quality_checks.py`      |
| Vitest mirato  | `npm --prefix mobile run test -- <pattern>` |
| Wiki inventory | `npm run wiki:inventory`                    |
| Wiki check     | `npm run wiki:check`                        |
| Wiki resolve   | `npm run wiki:test`                         |

## Qualità

- Se il codice toccato ha già un Vitest, eseguirlo prima di chiudere
- Gate F include wiki inventory, contract sync, domain resolve, version align, MCP stdio
- Unico controllore qualità: **`.\run_quality_checks.bat`** (o `npm run quality`). Gate G–H con `--full`
