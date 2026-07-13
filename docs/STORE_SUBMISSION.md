# KineFit — Checklist pubblicazione Store

> Guida operativa per Play Store e App Store. Aggiornata con Fase 5 produzione.

## 1. Prerequisiti tecnici

- [ ] `npm run validate` passing (typecheck + test)
- [ ] `npm run lint` e `npm run format:check` senza errori
- [ ] Migrazione `20260713000000_production_indexes_and_rpc.sql` applicata su Supabase produzione
- [ ] Secret EAS configurati: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SENTRY_DSN`
- [ ] Versioni allineate: `mobile/package.json`, `mobile/app.config.ts`, `eas.json` buildNumber/versionCode

## 2. Build EAS

```bash
# Preview APK (Android, test interno)
npm run mobile:build

# Production (entrambe le piattaforme)
cd mobile && npx eas build -p all --profile production
```

Verifica su device fisico:

- [ ] Login / registrazione
- [ ] Log set + timer recupero + beep
- [ ] Modalità aereo: salva set → torna online → sync completata (banner coda scompare)
- [ ] Export CSV dallo storico
- [ ] Onboarding first-run per nuovo utente

## 3. Sicurezza e dati

- [ ] RLS verificato con **secondo utente di test** (non vede dati del primo)
- [ ] Nessuna chiave hardcoded nel codice
- [ ] `console.log` solo sotto `__DEV__`

### Test RLS rapido

1. Crea utente A e utente B su Supabase Auth
2. Con utente A: crea esercizi e log
3. Con utente B: verifica che storico/analytics siano vuoti
4. Tentativo diretto PostgREST con token B su risorse A → 0 righe

## 4. Monitoring (Sentry)

- [ ] `EXPO_PUBLIC_SENTRY_DSN` impostato in EAS Secrets
- [ ] Build production non in `__DEV__` → crash inviati a Sentry
- [ ] Verifica evento di test (crash volontario in build preview)
- [ ] Opzionale: `SENTRY_AUTH_TOKEN` per upload source maps in EAS build

## 5. Test automatizzati

| Livello         | Comando                              | CI                      |
| --------------- | ------------------------------------ | ----------------------- |
| Unit + coverage | `cd mobile && npm run test:coverage` | ✅ GitHub Actions       |
| E2E Maestro     | `cd mobile && npm run e2e`           | Manuale / Maestro Cloud |

Credenziali E2E: `MAESTRO_TEST_EMAIL`, `MAESTRO_TEST_PASSWORD`

## 6. Play Store (Google)

- [ ] Account Google Play Developer ($25 una tantum)
- [ ] Scheda store: titolo, descrizione, screenshot (phone + tablet opzionale)
- [ ] Icona 512×512, feature graphic 1024×500
- [ ] Privacy policy URL pubblico (obbligatorio)
- [ ] Categoria: Salute e fitness
- [ ] Content rating questionnaire
- [ ] `eas submit -p android --profile production`

## 7. App Store (Apple)

- [ ] Apple Developer Program ($99/anno)
- [ ] Screenshots per ogni dimensione device richiesta
- [ ] Privacy policy + App Privacy details in App Store Connect
- [ ] Review notes: account demo per Apple (`MAESTRO_TEST_EMAIL`)
- [ ] `eas submit -p ios --profile production`

## 8. Documenti legali (se store pubblico)

- [ ] Privacy policy (trattamento dati, Supabase, Sentry)
- [ ] Termini di servizio
- [ ] Informativa cookie (non applicabile all'app nativa, solo se aggiungi web)

## 9. Post-lancio

- [ ] Monitorare Sentry prime 48h
- [ ] Verificare metriche crash-free > 99%
- [ ] Piano rollback: versione precedente su EAS + store

---

_Vedi anche: [AUDIT_E_PIANO_MIGLIORAMENTI.md](./AUDIT_E_PIANO_MIGLIORAMENTI.md) §12_
