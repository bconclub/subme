# Play Store Listing - Subme

Scope at launch: **manual entry + analytics only**. No SMS reading, no
notification access, no bank/AA links, no payments. That keeps the data-safety
form short and the review low-risk.

## App identity
- **App name:** Subme - Subscription Tracker
- **Package:** `in.subme.app` (⚠ confirm before first production upload - package id is permanent)
- **Category:** Finance
- **Tags:** subscription manager, expense tracker, renewal reminder
- **Contact email:** bconclubx@gmail.com
- **Privacy policy URL:** required before submission - host a page stating: all data stored on device, no collection, no third-party sharing, DPDP-aligned, contact email. (TODO)

## Short description (≤80 chars)
> Track Netflix, Jio, Swiggy & every subscription. Know your monthly burn.

## Full description (≤4000 chars)
> **Every subscription. One clear picture.**
>
> India runs on subscriptions - OTT, music, telecom recharges, food
> memberships, AI tools, the gym. Subme shows what they actually cost you,
> and warns you before each renewal hits your account.
>
> **See your real burn**
> • Monthly burn in ₹, with proper Indian formatting (₹1,00,000 - not 100,000)
> • Annual projection and active-subscription count at a glance
> • Category breakdown donut and a 12-month spend trend
>
> **Never get surprise-charged again**
> • Renewal calendar - every charge date on a month grid
> • Local alerts before each renewal, at 9 AM IST, your choice of lead time
> • Days-away chips on everything that's about to bill
>
> **Add subscriptions in seconds**
> • Indian catalog built in: Netflix, JioHotstar, Spotify, Jio, Airtel,
>   Amazon Prime, YouTube Premium, Swiggy One, Zomato Gold, Cult.fit,
>   ChatGPT, Claude and 30+ more, with current plans and prices auto-filled
> • Custom entries for anything else - gym, milk, society dues
> • Pause, cancel-mark, or delete with a swipe
>
> **Track the details**
> • Lifetime spend per subscription
> • Price-change history (because they always creep up)
> • Full renewal log
>
> **Your data stays yours**
> • Everything lives on your phone - no bank logins, no SMS access, no account needed
> • DPDP-compliant consent dashboard - see and revoke any permission
> • Export everything as JSON, or wipe it all, any time
>
> Free plan tracks 5 subscriptions. Pro (unlimited + WhatsApp alerts) coming soon.

## Graphics checklist
| Asset | Spec | Status |
|---|---|---|
| App icon | 512×512 PNG, no alpha | from assets/images/icon.png (regenerate at 512) |
| Feature graphic | 1024×500 PNG | TODO - dark bg, "Every subscription. One clear picture." |
| Phone screenshots (min 2, rec 8) | 1080×1920+ | TODO - shoot after first preview build |

Screenshot shot-list (in order):
1. Dashboard - hero burn + donut (use realistic demo data: Netflix 649, Jio 349, Spotify 119, Swiggy One 399/q, ChatGPT 1999)
2. Next renewals list with days-away chips
3. Calendar month grid with renewal dots + day sheet open
4. Add flow - catalog grid with Indian services
5. Subscription detail - lifetime spend + price history
6. Onboarding privacy screen ("Your data stays yours.")
7. Settings consent dashboard
8. Notification example (renewal alert)

## Data safety form (manual-entry-only scope)
- **Does your app collect or share any of the required user data types?** → **No**
  (All data is stored locally on device. Nothing is transmitted to the developer
  or third parties. Optional phone number is stored on device only.)
- **Is all of the user data collected by your app encrypted in transit?** → N/A (no collection)
- **Do you provide a way for users to request that their data is deleted?** → Yes, in-app
  (Settings → Delete everything; plus full JSON export)
- SDKs: Expo/React Native only; no ads SDK, no analytics SDK at launch.
- When Supabase auth ships later, this form must be redone: collects email,
  phone (optional), financial info (user-provided subscription amounts) -
  encrypted in transit, deletable on request.

## Content rating questionnaire
- No UGC, no violence, no gambling, no real-money trading → expected **Everyone / 3+**.

## App access for review
- No login at launch (local mode) → "All functionality available without special access".

## Release notes (v1.0.0)
> First release: track every subscription, see monthly burn in ₹, renewal
> calendar, and get alerts before you're charged. 40+ Indian services built in.
> All data stays on your phone.

## Pre-submission checklist
- [ ] Confirm final package id (`in.subme.app`) and brand name
- [ ] versionCode automation: handled by EAS (`autoIncrement` in eas.json, appVersionSource=remote)
- [ ] Privacy policy URL live
- [ ] Feature graphic + 8 screenshots
- [ ] Signed AAB from `eas build --profile production-aab --platform android`
- [ ] Internal testing track first; promote after a week of crash-free sessions
