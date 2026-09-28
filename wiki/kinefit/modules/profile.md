# Modulo Profile

Sorgenti: `mobile/src/components/views/ProfileView.tsx`, `mobile/src/services/profileService.ts`, `mobile/src/components/modals/SettingsModal.tsx`.

## Ruolo

Profilo utente, settings (unità, privacy URL), aggiornamento peso, edit profilo; entry UI verso Garmin Connect.

## Entrypoint

- View: `ProfileView`
- `profileService`, `profileMappers`
- Modals: `SettingsModal`, `WeightUpdateModal`, `ProfileEditModal`, `GarminConnectModal`
- Hook: `useGarminLinkStatus` (stato link; OAuth → [[kinefit/modules/garmin|Garmin]])
- Streak chip profilo: `profile-streak-chip`

## Freeze

TestID settings/units/version e switch smoke. Privacy: `settings-privacy-row` solo se `KINEFIT_PRIVACY_POLICY_URL` valorizzato. Nessun `Alert` dentro `services/`.

## Smoke

- Deep-link: `kinefit://smoke/tabs?tab=profilo` (+ `&modal=settings|weight|profile-edit|garmin`)
- Vitest view contracts dove presenti

## Collegamenti

- [[kinefit/modules/garmin|Garmin]]
- [[kinefit/modules/auth|Auth]]
- [[kinefit/INDEX|Grafo]]
