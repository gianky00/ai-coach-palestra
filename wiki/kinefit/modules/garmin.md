# Modulo Garmin

Sorgenti: `mobile/src/services/garminService.ts`, `mobile/src/services/garmin/`, `supabase/functions/garmin/`.

## Ruolo

Collegamento account Garmin (OAuth PKCE), vault token, sync attività via Edge Function. Facade stabile lato mobile; edge spezzata per azione.

## Entrypoint

Mobile (consumer importano solo la facade):

```
services/garminService.ts          → re-export facade
services/garmin/
  constants.ts                     → keys, URL, tipi status
  garminStorage.ts                 → SecureStore token/client-id
  garminPkce.ts                    → PKCE + parse redirect
  garminApi.ts                     → invoke edge + read activities
  index.ts                         → orchestration connect/disconnect/sync
```

Edge:

```
supabase/functions/garmin/
  index.ts                         → auth + router azioni
  http.ts                          → CORS / json / env
  garminClient.ts                  → HTTP verso Garmin
  tokens.ts                        → vault token + refresh
  actions/exchange.ts
  actions/disconnect.ts
  actions/sync.ts                  → include mapper attività puro
```

UI: `GarminConnectModal`; stato: `useGarminLinkStatus`.

## Freeze

- Path di import pubblico: `services/garminService` (re-export).
- Niente UI (`Alert` / haptics) dentro `services/garmin/**`.
- Secret solo da env della function; non loggare token.

## Smoke

- Modal smoke: `kinefit://smoke/tabs?tab=profilo&modal=garmin` (no OAuth reale)
- Vitest: `mobile/__tests__/services/garminService.test.ts` se presente

## Collegamenti

- [[kinefit/modules/profile|Profile]]
- [[kinefit/workflows/docs_vs_wiki|Docs vs Wiki]]
- [[kinefit/INDEX|Grafo]]
