# KineFit — Privacy Policy template (TODO — not live)

> **Status:** TEMPLATE / DRAFT ONLY.  
> Do **not** paste this URL into Play Console until you publish a real page under your domain.  
> There is **no** production privacy URL in this repo.

Fill the brackets, host the HTML/Markdown somewhere public (HTTPS), then set:

```text
KINEFIT_PRIVACY_POLICY_URL=https://YOUR_DOMAIN/privacy
```

in release `mobile/.env` (never commit the real secrets file). Play Console + in-app Settings row both use that same URL.

---

## Suggested hosting (pick one)

| Option                           | Notes                                                   |
| -------------------------------- | ------------------------------------------------------- |
| GitHub Pages / static site       | Free HTTPS; publish a single `privacy.html`             |
| Supabase Storage + public bucket | Same project as app; keep policy HTML only (no secrets) |
| Your domain / Notion public page | Fine if URL stays stable and is crawlable without login |

Play requires a **public** URL (no login wall). Prefer a stable path you will not rename.

---

## Draft policy (replace TODOs)

**Last updated:** `[YYYY-MM-DD]`  
**Controller:** `[LEGAL NAME / Coemi Elite Apps — update]`  
**Contact:** `[privacy@YOUR_DOMAIN]`

### What the app does

KineFit helps users log gym workouts (exercises, sets, weight, RPE), view history/analytics, optional habit streak, and optional Garmin connection.

### Data we process

| Category         | Examples                                         | Purpose                                   |
| ---------------- | ------------------------------------------------ | ----------------------------------------- |
| Account          | email, auth tokens                               | Login via Supabase Auth                   |
| Fitness activity | sessions, sets, body weight, notes, streak prefs | Core product + cloud sync / offline queue |
| Diagnostics      | crash/error events (Sentry)                      | Stability; PII redacted in app code       |
| Integrations     | Garmin OAuth tokens (if user connects)           | Sync wearable data via edge function      |

### Permissions (Android)

See `docs/STORE_SUBMISSION.md` §5 — declare only permissions actually merged in release (`INTERNET`, `POST_NOTIFICATIONS`, `VIBRATE`, network-state from NetInfo). Do not claim mic / external storage / overlay / biometrics if absent.

### Legal bases / retention / deletion

- **TODO:** lawful basis (contract / consent) under your jurisdiction
- **TODO:** retention period for account + workout data
- **TODO:** how users request account/data deletion (email process or in-product flow)
- Data in transit: HTTPS to Supabase / Sentry / Garmin endpoints

### Third parties

- Supabase (auth + database) — `[region / DPA link TODO]`
- Sentry (errors) — `sendDefaultPii: false` in app; DSN from env
- Garmin (optional OAuth) — only if user connects

### Children

App is not directed at children under `[13 / 16 — TODO per market]`.

### Changes

We may update this policy; the “Last updated” date will change. Material changes: `[how you notify — TODO]`.

---

## Play Console fields (same URL)

After publishing the real page, complete:

1. **App content → Privacy policy** → public URL
2. **Store listing** → Privacy policy URL (same)
3. **Data safety** questionnaire aligned with §5 of `STORE_SUBMISSION.md`
4. In-app: set `KINEFIT_PRIVACY_POLICY_URL` so Settings shows **Informativa privacy**
