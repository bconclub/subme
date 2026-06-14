# Subme — Backend setup

Status: **not provisioned yet.** No Subme Supabase project exists; the only
projects on the account are BCON PROXe and Alpha, which are **off-limits** (a
different brand each). Subme needs its **own** project.

Everything below is written and ready — it applies the moment a dedicated Subme
project's credentials land in `.env.local`.

## What you do
1. Create a **new** Supabase project named `Subme` (free tier is full at 2
   projects — pause/upgrade or use a different org so we don't touch the others).
2. Paste into `.env.local`: `EXPO_PUBLIC_SUPABASE_URL`,
   `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SUPABASE_PROJECT_REF`. Then tell me.

## What I do (once creds are in)
1. **Apply schema** — `supabase/migrations/0001_schema.sql` (profiles,
   subscriptions, price_history, renewal_log, consent_records, RLS, triggers).
2. **Seed catalog** — `supabase/migrations/0002_seed_catalog.sql` (43 services).
3. **Reconcile** — drop anything in the Subme project not in this schema
   (only that project; never BCON PROXe / Alpha).
4. **Deploy** the `notify-signup` edge function and wire a Database Webhook on
   `public.profiles` INSERT → sends you a WhatsApp on every registration.
5. The app flips from local-only to cloud automatically (it reads the env keys).

## WhatsApp registration alerts
- Function: `supabase/functions/notify-signup/index.ts`.
- Pick a provider in `.env.local` (`WHATSAPP_PROVIDER` = `cloud` | `gupshup` |
  `twilio`) and fill its keys + `ADMIN_ALERT_WHATSAPP_TO`.
- Gupshup is usually easiest for India; Meta Cloud API is free-tier but needs a
  Meta app + verified number.

## Tables (final shape)
`profiles` · `subscriptions` · `price_history` · `renewal_log` ·
`consent_records` · `catalog_services` — all RLS-locked to the owner, catalog
readable by all. Matches `src/lib/types.ts`.
