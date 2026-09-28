# Smoke, Maestro e Verify UI

Sorgenti: `mobile/src/lib/smokeMode.ts`, `scripts/android/verify_ui*.ps1`, `.maestro/flows/`, `scripts/run-maestro.ps1`.

## Ruolo

Verifica UI senza login reale (adb deep-link) e suite Maestro. Target emulatore di default: **Pixel_9a**.

## Entrypoint

Deep-link supportati (`smokeMode.ts`):

- `kinefit://smoke/auth`
- `kinefit://smoke/tabs?tab=oggi|storico|analisi|profilo`
- `kinefit://smoke/seed?days=7&sets=3`
- `kinefit://smoke/clear`
- Opzionali: `&timer=90`, `&modal=...`, `&pr=1`

Script:

- `npm run verify:ui` / `verify:ui:full` / `verify:ui:ops` / `verify:ui:seed`
- `npm run maestro:check` / `maestro:flows-check` / `e2e:*`
- Helpers: `scripts/android/lib/ui-shots.ps1`, `ui-verify-common.ps1`

Fixture id: `SMOKE_USER_ID`, `smoke-exercise-1`, sessioni `smoke-*`.

## Freeze

- Non rinominare/rimuovere testID usati da Maestro e verify UI.
- Non eliminare `ui-shots.ps1` / `ui-verify-common.ps1` / `.ui-shots/.gitkeep` / wrapper Maestro.
- Flow Maestro: niente hard `assertVisible` su `analytics-heatmap` senza branch `when:` (Gate F lint).

## Smoke

- Docs: `mobile/VERIFY.md`, `.maestro/README.md`
- Gate F in `scripts/run_quality_checks.py` controlla presenza file + lint flow

## Collegamenti

- [[kinefit/workflows/quality_gates|Quality Gates]]
- [[kinefit/modules/oggi|Oggi]]
- [[kinefit/INDEX|Grafo]]
