# Manutenzione e SRP — KineFit

Linee guida per mantenere moduli a responsabilità singola e ridurre regressioni.

## Principi

1. **Una responsabilità per file** — storage, crypto/PKCE, HTTP, UI e orchestration restano separati.
2. **Facade stabili** — i consumer importano entrypoint pubblici (`garminService`, `offlineSync`); gli interni possono cambiare.
3. **Niente UI nei services** — `Alert` / haptics restano in views/modals/hooks.
4. **Test sul facade** — i test unitari puntano all’API pubblica; gli interni si testano se puri/critici.

## Mappa Garmin / profilo

Alberi file e freeze: **[`wiki/kinefit/modules/garmin.md`](../wiki/kinefit/modules/garmin.md)** (mobile facade + edge).  
UI profilo: **[`wiki/kinefit/modules/profile.md`](../wiki/kinefit/modules/profile.md)**.  
Grafo: [`wiki/kinefit/INDEX.md`](../wiki/kinefit/INDEX.md).

## Build / run (promemoria)

- Prodotto nativo bare RN: `mobile/android` in **Android Studio** + Gradle; JS via **Metro**.
- Setup device: [SETUP_ANDROID.md](../mobile/SETUP_ANDROID.md).

## Checklist prima di un PR

- [ ] `npm run maintenance:all` (format + lint + typecheck/test + depcheck + gate A–E)
- [ ] Root `npm audit` clean; su mobile tollerare solo advisory noti Metro/`image-size` senza patch pubblicata
- [ ] Nessun nuovo god-file (>300 LOC) senza split pianificato
- [ ] Import pubblici invariati o con barrel re-export
- [ ] Nessun `Alert` / navigazione dentro `services/`
- [ ] Non usare `npm audit fix --force` su mobile (rompe allineamento moduli nativi RN)
- [ ] Dopo upgrade deps native-related: allinea versioni peer RN e riesegui `npm run android:assemble`
