# Subme

Subscription monitoring for India. Native Android (Expo / React Native), iOS later.

**Current mode: local-only.** No backend is provisioned yet - all data lives in
AsyncStorage on the device. The Supabase schema is ready in
`supabase/migrations/` and the app flips to cloud mode the moment
`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set (see
`.env.example`).

## Run

```bash
npm install
npm start            # Expo dev server (scan QR with Expo Go / dev client)
```

## Quality gates

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # expo lint
npm test             # vitest - pure-TS lib (IST date math, analytics, detection, matching)
```

## Builds (EAS)

```bash
eas build --profile preview-apk --platform android     # shareable APK
eas build --profile production-aab --platform android  # Play Store bundle
```

Profiles in `eas.json`: `dev` (dev client APK), `preview-apk` (internal APK,
auto-increment), `production-aab`. Play listing prep: `PLAYSTORE.md`.

## Architecture

- `src/app/` - expo-router screens: onboarding, 4 tabs (dashboard, subs,
  calendar, settings), subscription add/detail, dormant `(auth)` pair for
  Supabase OTP login.
- `src/lib/` - pure TS, unit-tested: `dates.ts` (IST-anchored, month-end-safe
  renewal math), `analytics.ts`, `detection.ts` + `matching.ts` (transaction →
  service/subscription matching for future auto-ingestion), `catalog.ts`
  (40+ Indian services, 2026 prices - source of truth; `npm run gen:seed`
  regenerates the SQL seed), `notifications.ts` (9 AM IST local alerts).
- `src/ingestion/types.ts` - `NormalizedTransaction` contract. Future SMS /
  notification-listener / AA adapters normalize into this; detection and
  matching already consume it.
- `src/stores/` - Zustand + AsyncStorage persistence. Swap target for Supabase
  once provisioned.
- `native/` - landing zone for future Kotlin modules (notification listener
  config plugin).
- `supabase/migrations/` - full schema (RLS, profiles trigger) + generated
  catalog seed. Not applied anywhere yet.

## Deliberate deviations from the original brief

- **No Supabase project** - per owner decision (2026-06-12): existing free-tier
  slots are occupied by other brands; keep everything local until a dedicated
  project exists.
- **Charts are hand-rolled SVG** (donut, sparkline) instead of victory-native -
  avoids the Skia native dependency, keeps the APK small and the preview build
  low-risk.
- **GPFC #2 schema reconstructed** from the product brief (document wasn't
  available); diff `supabase/migrations/0001_schema.sql` against the original
  before applying.
