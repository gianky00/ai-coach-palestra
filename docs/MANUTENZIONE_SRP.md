# Manutenzione e SRP — KineFit

Linee guida per mantenere moduli a responsabilità singola e ridurre regressioni.

## Principi

1. **Una responsabilità per file** — storage, crypto/PKCE, HTTP, UI e orchestration restano separati.
2. **Facade stabili** — i consumer importano entrypoint pubblici (`garminService`, `offlineSync`); gli interni possono cambiare.
3. **Niente UI nei services** — `Alert` / haptics restano in views/modals/hooks.
4. **Test sul facade** — i test unitari puntano all’API pubblica; gli interni si testano se puri/critici.

## Mappa moduli Garmin (mobile)

```
services/garminService.ts          → re-export facade (import path stabile)
services/garmin/
  constants.ts                     → keys, URL, tipi status
  garminStorage.ts                 → SecureStore token/client-id
  garminPkce.ts                    → PKCE + parse redirect
  garminApi.ts                     → invoke edge + read activities
  index.ts                         → orchestration connect/disconnect/sync
```

## Mappa edge Garmin

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

## UI profilo

- `ProfileView` compone layout/menu
- `WeightUpdateModal` / `ProfileEditModal` — form dedicate
- `useGarminLinkStatus` — stato link condivisibile

## Build / run (promemoria)

- Prodotto nativo: `mobile/android` in **Android Studio** + Gradle; JS via **Metro**.
- Non promuovere Expo Go / EAS come path di sviluppo o release (vedi [SETUP_ANDROID.md](../mobile/SETUP_ANDROID.md)).

## Checklist prima di un PR

- [ ] `npm run maintenance:all` (format + lint + typecheck/test + depcheck + gate A–E)
- [ ] Root `npm audit` clean; su mobile tollerare solo advisory noti Metro/`image-size` senza patch pubblicata
- [ ] Nessun nuovo god-file (>300 LOC) senza split pianificato
- [ ] Import pubblici invariati o con barrel re-export
- [ ] Nessun `Alert` / navigazione dentro `services/`
- [ ] Non usare `npm audit fix --force` su mobile (rompe allineamento moduli nativi RN)
- [ ] Dopo upgrade deps native-related: `cd mobile && npx expo install --fix` (allinea versioni pacchetti; non è un flusso Expo Go)
