# Modulo Auth

Sorgenti: `mobile/src/lib/AuthProvider.tsx`, `mobile/src/hooks/useAuth.ts`, `mobile/src/components/views/AuthView.tsx`, `mobile/src/platform/constants.ts`.

## Ruolo

Sessione Supabase Auth, schermata login, lettura env pubbliche. Prefisso canonico `KINEFIT_*`.

## Entrypoint

- `AuthProvider`, `useAuth`, `AuthContext`
- `AuthView`
- `getPublicEnv(logicalKey)` / `appConfig` in `platform/constants.ts`
- Chiavi tipiche: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SENTRY_DSN`, `GARMIN_CLIENT_ID`, `PRIVACY_POLICY_URL` (con prefisso `KINEFIT_`)

## Freeze

- Non reintrodurre pacchetti Expo né managed workflow.
- Preferire solo `KINEFIT_*` nei `.env` locali. Dual-read legacy `EXPO_PUBLIC_*` resta in `getPublicEnv` finché crash-critical (blank screen); non espandere il dual-read ad altri moduli.
- Allineare `mobile/.env.example` al prefisso `KINEFIT_*`.

## Smoke

- Deep-link: `kinefit://smoke/auth` (zero login reale)
- Vitest: `mobile/__tests__/platform/constants.test.ts` se presente

## Collegamenti

- [[kinefit/architecture/overview|Overview]]
- [[kinefit/modules/smoke|Smoke]]
- [[kinefit/INDEX|Grafo]]
