# Docs ops vs LLM Wiki

## Split

| Path                                                                                                     | Ruolo                                        | Sync                                    |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------- |
| [`wiki/INDEX.md`](../../INDEX.md)                                                                        | Hub sezioni                                  | Se cambia il layout sezioni             |
| [`wiki/kinefit/`](../INDEX.md)                                                                           | Knowledge graph agente                       | **Obbligatorio** su modifiche rilevanti |
| [`docs/GEMINI.md`](../../../docs/GEMINI.md)                                                              | Ops: env, comandi PowerShell, checklist      | Solo se cambiano env/comandi/checklist  |
| [`docs/AGENT_SYNC.md`](../../../docs/AGENT_SYNC.md)                                                      | Diario coordinamento parallelo (append-only) | Append checklist; non è il grafo        |
| [`docs/`](../../../docs/) (altri)                                                                        | Runbook umani (store, testing, privacy)      | Quando cambia la procedura              |
| [`docs/archive/`](../../../docs/archive/README.md)                                                       | Piani/roadmap storici                        | No (storico)                            |
| [`mobile/VERIFY.md`](../../../mobile/VERIFY.md) / [`SETUP_ANDROID.md`](../../../mobile/SETUP_ANDROID.md) | Runbook device                               | Quando cambia il flusso verify/setup    |
| Root [`GEMINI.md`](../../../GEMINI.md)                                                                   | Stub boot (puntatori)                        | Se cambia l’ordine di boot              |

## Boot

`AGENTS.md` → `wiki/INDEX.md` (hub) → `wiki/kinefit/INDEX.md` → ops `docs/GEMINI.md` se serve → note `mobile/GEMINI.md`.

## Guardrail

- `scripts/check_wiki_sync.py` — layout entrypoint + wikilink + drift contract_globs
- `scripts/generate_module_maps.mjs --check` — inventario `mobile/GEMINI.md` fresco
