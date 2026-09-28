# Modulo History

Sorgenti: `mobile/src/components/views/HistoryView.tsx`, `mobile/src/lib/historySessions.ts`, `mobile/src/services/exportService.ts`, `mobile/src/services/sessionPrService.ts`.

## Ruolo

Storico sessioni (remote + offline merge), dettaglio set, export CSV, badge PR e «In coda» per sessioni ancora offline.

## Entrypoint

- View: `HistoryView`
- `buildOfflineHistorySessions`, `mergeHistorySessions`, `enrichHistorySessionsWithExercises`, `collectMissingExerciseIds`
- `exportService`, `sessionPrService` / `sessionPr` lib
- Modal: `SessionDetailsModal` (fallback offline logs)

## Freeze

TestID: `history-empty-state`, `history-session-offline-*`, `history-session-pr-*` (pattern usati da smoke/verify). Non rimuovere il merge offline senza aggiornare questo nodo.

## Smoke

- Vitest: `mobile/__tests__/lib/historySessions*.ts` (o pattern equivalente)
- Deep-link: `kinefit://smoke/tabs?tab=storico`

## Collegamenti

- [[kinefit/architecture/offline_sync|Offline Sync]]
- [[kinefit/modules/oggi|Oggi]]
- [[kinefit/INDEX|Grafo]]
