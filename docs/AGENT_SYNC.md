# AGENT_SYNC — live coordination for parallel agents

> Keep this short. Append checklist entries; don't rewrite history.

## Bug policy

**Fix immediately. Never leave known fails.** If you find a broken test, smoke failure, or emulator flake you can reproduce — fix it in the same turn or hand off with a concrete fix path. Do not park red suites.

## Current architecture

- **Bare React Native + Android Studio** (no Expo runtime / managed workflow)
- Mobile app under `mobile/`; Android builds via Gradle / Android Studio
- Env prefix: `KINEFIT_*` (not Expo public vars)

## Active workstreams

| Stream                     | Focus                                                       |
| -------------------------- | ----------------------------------------------------------- |
| **Expo purge**             | Remove Expo leftovers; no restore of Expo tooling           |
| **Exhaustive emulator UI** | Full UI smoke / Maestro / emulator coverage on **Pixel_9a** |
| **New features**           | Product work on bare RN stack                               |

## Rules (do not violate)

1. **No Expo restore** — do not reintroduce Expo CLI, Expo modules, or managed workflow
2. **`KINEFIT_*` env** — use project env naming; keep `.env.example` aligned
3. **Preserve smoke `testID`s** — do not rename/remove IDs used by Maestro / UI smoke
4. **Emulator target: Pixel_9a** — default AVD for UI / suite runs

## Checklist template (append below)

```
### YYYY-MM-DD — <agent role>
- Files touched: …
- Bugs fixed: … (or "none")
- Notes / blockers: …
```

---

## Log

<!-- Agents: append newest entry at the bottom -->

### 2026-08-13 — sync bootstrap

- Files touched: `docs/AGENT_SYNC.md`
- Bugs fixed: none
- Notes: protocol created for parallel agents (Expo purge | emulator UI | features)
