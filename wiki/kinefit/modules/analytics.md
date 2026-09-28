# Modulo Analytics

Sorgenti: `mobile/src/components/views/AnalyticsView.tsx`, `mobile/src/services/analyticsService.ts`, `mobile/src/lib/analyticsWeek.ts`.

## Ruolo

Volume muscolare / heatmap e navigazione settimane calendario (lun–dom), empty state e a11y della week nav.

## Entrypoint

- View: `AnalyticsView`
- `analyticsService`
- `clampAnalyticsWeekOffset`, `resolveAnalyticsWeekRange`, `buildAnalyticsEmptyCopy`, `analyticsWeekNavHints`
- `ANALYTICS_MAX_WEEK_OFFSET` = 52
- UI: `MuscleHeatmap`, `VolumeChip`

## Freeze

TestID: `analytics-week-selector`, `analytics-week-*` (prev/next/label), `analytics-empty-state`. Non hard-assertare `analytics-heatmap` nei flow Maestro senza branch `when:` empty/heatmap (Gate F lint).

## Smoke

- Vitest su `analyticsWeek`
- Deep-link: `kinefit://smoke/tabs?tab=analisi`

## Collegamenti

- [[kinefit/modules/smoke|Smoke]]
- [[kinefit/INDEX|Grafo]]
