# Quality Gates A–H

Sorgenti: `scripts/run_quality_checks.py`, `scripts/quality_config.py`, `scripts/android/verify-gates.ps1`.

## Ruolo

Report PASS/FAIL per umani e agenti. CI Ubuntu = modalità `--quick` (A–E + F). Gate G–H (assemble + Pixel_9a UI) solo locale / `--full`.

## Entrypoint

| Gate | Cosa                                                                                                        |
| ---- | ----------------------------------------------------------------------------------------------------------- |
| A    | Prettier `format:check`                                                                                     |
| B    | ESLint                                                                                                      |
| C    | Mobile typecheck (`tsc`)                                                                                    |
| D    | Vitest unit                                                                                                 |
| E    | Vitest coverage                                                                                             |
| F    | File-presence Android/Maestro + **wiki inventory** + **wiki contract sync** + **wiki domain resolve tests** |
| G    | `assembleDebug`                                                                                             |
| H    | UI verify Pixel_9a (`verify:ui:full`)                                                                       |

Comandi:

```powershell
npm run quality          # python scripts/run_quality_checks.py (--quick default)
npm run quality:full
npm run gate             # A–E via verify-gates.ps1 -SkipHeavy
npm run gate:all         # A–H
npm run wiki:inventory
npm run wiki:check
npm run wiki:test        # node --test scripts/domain_resolve.test.mjs (anche Gate F)
```

## Freeze

- Non spegnere soglie coverage in `vitest.config.ts` senza accordo.
- Non usare `npm audit fix --force`.
- Non eliminare helper Gate F (ui-shots, Maestro wrappers, wiki scripts).

## Smoke

Vedi [[kinefit/modules/smoke|Smoke]]. Ops dettagliate: `docs/GEMINI.md`.

## Collegamenti

- [[kinefit/workflows/pre_commit_wiki_protocol|Wiki-Sync]]
- [[kinefit/workflows/cursor_rules|Cursor Rules + MCP]]
- [[kinefit/INDEX|Grafo]]
