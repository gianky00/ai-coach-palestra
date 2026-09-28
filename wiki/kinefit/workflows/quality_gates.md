# Quality Gates A–H

Sorgenti: `run_quality_checks.bat` → `scripts/run_quality_checks.py`, `scripts/quality_config.py`, `scripts/android/verify-gates.ps1`.

## Ruolo

**Unico controllore qualità del repo:** `.\run_quality_checks.bat` (alias npm: `npm run quality`).  
Niente GitHub Actions CI: i gate si lanciano in locale (Windows).

## Entrypoint

| Gate | Cosa                                                                                   |
| ---- | -------------------------------------------------------------------------------------- |
| A    | Prettier `format:check`                                                                |
| B    | ESLint                                                                                 |
| C    | Mobile typecheck (`tsc`)                                                               |
| D    | Vitest unit                                                                            |
| E    | Vitest coverage                                                                        |
| F    | Android/Maestro presence + wiki inventory/contract/resolve + version align + MCP stdio |
| G    | `assembleDebug` (`--full`)                                                             |
| H    | UI verify Pixel_9a (`--full`)                                                          |

Comandi:

```powershell
.\run_quality_checks.bat                 # --quick (default)
.\run_quality_checks.bat --full          # + G + H
.\run_quality_checks.bat --fix
.\run_quality_checks.bat --no-advisory
npm run wiki:check
npm run mcp:check
npm run android:check-version
```

Report: `logs/quality_report.log`.

## Freeze

- Non spegnere soglie coverage in `vitest.config.ts` senza accordo.
- Non usare `npm audit fix --force`.
- Non eliminare helper Gate F (ui-shots, Maestro wrappers, wiki/MCP scripts).
- MCP: `.cursor/mcp.json` con `${workspaceFolder}/.cursor/mcp/kinefit_stdio.mjs`.

## Smoke

Vedi [[kinefit/modules/smoke|Smoke]]. Ops: `docs/GEMINI.md`. MCP: [[kinefit/workflows/cursor_rules]].

## Collegamenti

- [[kinefit/workflows/pre_commit_wiki_protocol|Wiki-Sync]]
- [[kinefit/workflows/cursor_rules|Cursor Rules + MCP]]
- [[kinefit/INDEX|Grafo]]
