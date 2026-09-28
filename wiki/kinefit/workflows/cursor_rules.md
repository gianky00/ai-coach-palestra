# Cursor Rules + Hook + MCP

Specializzazione Cursor **senza duplicare** la wiki.

| Layer                        | Ruolo                               |
| ---------------------------- | ----------------------------------- |
| `wiki/` + `mobile/GEMINI.md` | Conoscenza                          |
| `.cursor/rules/*.mdc`        | Vincoli ad alto rischio (iniezione) |
| `.cursor/hooks.json`         | `sessionStart` → boot reminder      |
| MCP `kinefit-agent`          | `resolve_domain` + `list_domains`   |
| Se divergono                 | **Vince la wiki**                   |

## Always-on (3)

`agents-wiki-boot`, `kinefit-agent-guidance`, `kinefit-rules-index` — ruoli non sovrapposti.

## Glob (4)

`mobile-src`, `supabase-functions`, `android-native`, `tests-smoke`.

## Skills (progetto)

| Skill          | Quando                                                |
| -------------- | ----------------------------------------------------- |
| `kinefit-boot` | Qualsiasi task sul repo — solo boot, non architettura |

## Hook

- File: `.cursor/hooks.json` → `node .cursor/hooks/session_start.cjs`
- Evento: `sessionStart` → `additional_context` (boot + MCP). Non blocca prompt.

## MCP `kinefit-agent`

- Config: `.cursor/mcp.json`
- Entry: `node ${workspaceFolder}/.cursor/mcp/kinefit_stdio.mjs` (path assoluto — evita Connecting se cwd ≠ repo)
- Mappa: `.cursor/kinefit-domain-map.json` (solo puntatori + `contract_globs`)
- Tools: `resolve_domain`, `list_domains`
- Smoke Gate F: `npm run mcp:check` (`scripts/check_mcp_stdio.mjs`)
- Abilitare in **Cursor Settings → MCP** (toggle ON). Se Connecting: Reload → Done → nuova chat

Test: `node --test scripts/domain_resolve.test.mjs`.

## Manutenzione

- Nuovo dominio → riga in `kinefit-domain-map.json` (+ nodo wiki), **non** una regola-copia.
- Nuovo vincolo “facile da violare” → `.mdc` corta + index.
- Protocollo: [[kinefit/workflows/pre_commit_wiki_protocol]].
