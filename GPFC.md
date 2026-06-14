# Subme — Complete UI Specification (GPFC)

Auto-detection-first subscription tracker. India-first. Native Android (iOS later).
Dark glassmorphism. This document is the source of truth for recreating every
screen in a design tool: structure, copy, tokens, states, interactions.

---

## 1. Design system

### 1.1 Color tokens
| Token | Hex / value | Use |
|---|---|---|
| `bg` | `#06080C` | App canvas (behind aurora) |
| `bgDeep` | `#04060A` | Deepest base |
| `glass` | `rgba(255,255,255,0.06)` | Card wash over blur |
| `glassStrong` | `rgba(255,255,255,0.10)` | Hero/focused card wash |
| `glassBorder` | `rgba(255,255,255,0.12)` | Card 1px border |
| `glassBorderStrong` | `rgba(255,255,255,0.20)` | Strong card border |
| `hairline` | `rgba(255,255,255,0.08)` | Dividers |
| `ink` | `#F2F6FC` | Primary text |
| `muted` | `#9FB0C3` | Secondary text |
| `faint` | `#6B7B8F` | Tertiary text / hints |
| `accent` | `#34E5B0` | Brand green (active, CTAs) |
| `accentDim` | `#10B981` | Fallback logo / dim accent |
| `violet` | `#8B7CFF` | Secondary accent |
| `blue` / `info` | `#5B9DFF` | Info accent |
| `warn` | `#FFC24B` | Warning (2–3 day chips) |
| `danger` | `#FF6B6B` | Danger (today/overdue, delete) |

### 1.2 Gradients (linear, top-left → bottom-right unless noted)
| Name | Stops | Use |
|---|---|---|
| `hero` | `#1FE0C4 → #2EA8FF` | Burn hero, primary CTAs, add button, scan button |
| `upgrade` | `#8B7CFF → #5B9DFF` | Upgrade banner |
| `danger` | `#FF7A7A → #FF4D6D` | Destructive emphasis |
| `aurora1` | `#16E0B0 → transparent` | Background blob (teal) |
| `aurora2` | `#7C5CFF → transparent` | Background blob (violet) |
| `aurora3` | `#2E8BFF → transparent` | Background blob (blue) |

Text on `hero` gradient = `#042018` (near-black green), labels at 65–70% opacity.

### 1.3 Category colors (donut, legend dots)
streaming `#FF6B6B` · music `#34E5B0` · telecom `#5B9DFF` · food `#FF9F45` ·
fitness `#FF6FB5` · productivity `#A78BFA` · ai `#2DE0CF` · shopping `#FFC24B` ·
news `#9FB0C3` · gaming `#5BE584` · education `#5BB8FF` · finance `#FFD24B` ·
other `#7E8BA0`

### 1.4 Typography
System sans. Scale (px): `24` screen titles (bold) · `44` hero number (bold) ·
`18` section headers (bold) · `16` body/buttons · `15` row titles (bold) ·
`14` body-small · `13` row meta · `12` labels · `11`/`10` micro (evidence, chips).
Weights: 700 numbers & titles, 600 semibold, 500 medium, 400 body.
All-caps + letter-spacing for eyebrow labels (e.g. "MONTHLY BURN").

### 1.5 Spacing & shape
Screen horizontal padding `16`. Card padding `16`. Vertical rhythm `8 / 12 / 16 / 20`.
Radius: hero `28` · cards `24` · rows & banners `22` · inner chips `12` · pills `999`.
Floating bottom tab bar; scroll content gets `~112px` bottom clearance.

### 1.6 Glass surface recipe
`BlurView` (intensity 35–60, tint dark) + translucent white wash (`glass` or
`glassStrong`) + 1px `glassBorder`. On web, blur degrades to a CSS approximation
+ solid `rgba(18,26,36,0.7)` fallback so it never looks broken.

### 1.7 Iconography
Ionicons (outline). Key icons: `sparkles` (inbox/detect), `grid` (dashboard),
`albums` (subs), `calendar`, `settings`, `scan`, `add`, `rocket` (upgrade),
`chatbox-ellipses` (SMS evidence), `pause`/`play`/`close-circle`/`trash` (row
actions), `shield-checkmark`, `wallet`, `download`, `chevron-back/forward`.

---

## 2. Navigation map

```
Root Stack (no headers, dark bg)
├── index            → redirect: onboardingDone ? /(tabs)/inbox : /onboarding
├── onboarding       → 3-step intro (no tab bar)
├── (auth)           → login, otp        [dormant until Supabase]
├── (tabs)           → floating glass bottom bar, 5 tabs
│   ├── inbox        ★ home / initial route
│   ├── dashboard
│   ├── subscriptions
│   ├── calendar
│   └── settings
└── subscription
    ├── add          → full-screen modal-style form
    └── [id]         → subscription detail
```

Bottom tab bar: 5 items, blurred translucent, active = `accent`, inactive = `faint`,
labels 11px. Order: **Inbox · Dashboard · Subs · Calendar · Settings.**

Every screen sits on the **AuroraBackground**: `bg` canvas + 3 blurred gradient
blobs (teal top-left, violet mid-right, blue lower-left), non-interactive.

---

## 3. Reusable components

| Component | Anatomy | States / notes |
|---|---|---|
| **Screen** | Aurora bg + safe-area top padding + optional 16px h-padding | wrapper for all screens |
| **Card** | Frosted glass surface, radius 24 | `tone: base \| strong`, `intensity` |
| **Banner** | Gradient slab, radius 22: icon tile (44, white@22%) + title + body + optional white pill CTA + optional dismiss × | `colorsPair` swappable (upgrade/hero) |
| **Donut** | SVG ring, track + per-category arcs, 2px gaps | size & strokeWidth props |
| **Sparkline** | SVG polyline + end dot, accent stroke | needs ≥2 points |
| **DaysChip** | Pill: `today`/`tomorrow`/`Nd`/`overdue` | ≤1d danger, ≤3d warn, else neutral |
| **ServiceLogo** | Rounded square, brand color, 2-letter initials | size prop (36–56) |
| **EmptyState** | Centered icon tile + title + body + optional CTA pill | used on empty inbox/subs/calendar/dashboard |
| **PlanPicker** | Bottom-sheet modal: service header + list of plan rows (name + ₹ + cycle) | slides up; tap plan to pick |
| **SubRow** | Swipeable row: logo + name + plan/cycle + ₹ + DaysChip | swipe-left reveals Pause/Resume, Cancel, Delete |

---

## 4. Screens (top-to-bottom anatomy)

### 4.1 Onboarding  `/onboarding`
3 steps, single screen, swipe via buttons. No tab bar. Bottom: gradient
**primary button** + (steps 2–3) a **Back** text link.

- **Step 0 — Value prop**
  - Icon tile (accent, wallet icon)
  - H1: "Every subscription.\nOne clear picture."
  - Body: "Netflix, Jio, Swiggy One, ChatGPT — India runs on subscriptions.
    Subme shows what they cost you every month, and warns you before each
    renewal hits."
  - Button: **Get started**
- **Step 1 — Privacy promise**
  - Icon tile (info blue, shield-checkmark)
  - H1: "Your data stays yours."
  - Body: DPDP-compliant promise, all on-device.
  - Field: Phone number (optional, +91) — "for WhatsApp renewal alerts, coming soon"
  - Button: **I like that** / Back
- **Step 2 — Quick add**
  - Title: "What do you pay for?" + subtitle "Tap to add — prices auto-filled."
  - **Grid, 3 columns** of top-12 Indian services: each tile = ServiceLogo +
    name + (`from ₹X` or `Added ✓`). Tap toggles add; multi-plan services open
    **PlanPicker**.
  - At free cap (5): inline warn line.
  - Button: **Done — track N** (or "Skip for now") / Back
- Finishing sets `local_notifications` consent + `onboardingDone`, routes to Inbox.

### 4.2 Inbox  `/(tabs)/inbox`  ★ HOME
The auto-detection hub. Pull-to-refresh = scan.

- **Header row**: eyebrow "Auto-detected" + title "Inbox" · right: **Scan now**
  gradient pill (scan icon; shows spinner + "Scanning" while active).
- **Populated state** — "N found on your account — confirm what's yours." then a
  list of **detection cards** (strong glass), each:
  - Row: ServiceLogo (44) + name (bold) + `₹amount · Cycle · Plan` + **`NN% match`**
    pill (accent).
  - **Evidence box** (inset, faint): SMS snippet w/ chat icon + "Seen <date> · XXacct".
  - Action row: **Not mine** (outline pill) + **Add to Subme** (gradient pill, wider).
  - Footer link: "Add one manually instead".
- **Empty state** — EmptyState (sparkles): "No new subscriptions found" + body +
  **Scan now** CTA, with "Add manually instead" under it.
- If last scan used the demo feed: tiny footnote "Demo scan (sample SMS)…".
- Interactions: **Add to Subme** → creates subscription (source=detected),
  removes card. **Not mine** → dismiss, never resurfaces.

### 4.3 Dashboard  `/(tabs)/dashboard`
Analytics. Pull-to-refresh = roll renewals forward.

- **Header**: eyebrow "Good to see you" + title "Dashboard" · right: gradient
  **+** button (→ add).
- **Hero card** (gradient `hero`, radius 28): eyebrow "MONTHLY BURN" + big ₹ number
  (44px). Sub-row: `₹X per year` | divider | `N active`.
- **Detected nudge banner** (gradient `hero`, only if pending>0): sparkles + "N new
  subscriptions detected" + "Open inbox" pill → Inbox.
- **Upgrade banner** (gradient `upgrade`, only at free cap): rocket + "You've hit
  the free limit" + "See Subme Pro" → Settings.
- **Category card** (strong glass): **Donut** (132) on left + legend (top 5
  categories: color dot + label + ₹/mo) on right.
- **Spend card** (glass): eyebrow "SPEND · LAST 12 MONTHS" + **Sparkline**, or
  empty hint if no charges logged yet.
- **Next renewals**: section header + up to 5 glass rows (logo + name + `date · ₹`
  + DaysChip). Tap → detail.
- **Empty state** (no subs): EmptyState (wallet) + "Add a subscription" CTA.
- Indian number formatting throughout (₹1,00,000 ; compact ₹1.2L / ₹45.5k).

### 4.4 Subscriptions  `/(tabs)/subscriptions`
Manage list.

- **Header**: title "Subscriptions" + **+** circle button (→ add).
- **Search bar** (glass): magnifier + input "Search name, plan, category" + clear ×.
- **Sectioned list**: sections **Active / Paused / Cancelled** (only non-empty
  shown), each header `TITLE · count`. Rows = **SubRow** (swipe for actions),
  thin hairline separators.
- **Swipe actions** (right side): Pause↔Resume, Cancel, Delete (delete confirms
  via alert).
- **Empty states**: no subs → EmptyState (albums) "Add your first"; no search
  match → EmptyState (search) with the query echoed.

### 4.5 Calendar  `/(tabs)/calendar`
Month view of renewals.

- Title "Calendar".
- **Month card** (glass): header `‹ Month YYYY ›` nav · weekday row (M T W T F S S,
  Monday-first) · **day grid** (6×7). Today = accent ring; selected = accent fill;
  a day with renewals shows a small **warn dot**.
- **Due summary card**: "Due in <Month>" + ₹ total.
- **Selected-day list** (when a dotted day tapped): "Due on D Month · ₹total" +
  rows (logo + name + ₹) → detail. Otherwise hint "Tap a dotted date to see what's
  due."
- **Empty state** (no active subs): EmptyState (calendar) + "Add a subscription".

### 4.6 Settings  `/(tabs)/settings`
Profile, alerts, privacy, data.

- Title "Settings".
- **Plan card**: "Free plan" + "N/5 subscriptions tracked" + **Upgrade** pill
  (→ "coming soon" alert).
- **Profile card**: Name field, Phone field (+91, "for WhatsApp alerts, coming soon").
- **Renewal alerts card**: toggle "Alert me before renewals" (sub: "At 9:00 AM IST"),
  and when on, a day-picker row of pills: **Same day · 1d · 2d · 3d · 7d**.
- **Privacy & consent card**: DPDP intro line + 4 consent rows, each label + detail
  + toggle:
  - Renewal alerts on this phone (on)
  - WhatsApp alerts (toggleable, "coming soon")
  - Auto-detect from app notifications (disabled, "coming soon")
  - Auto-detect from SMS (disabled, "coming soon")
- **Your data card**: **Export my data** (download icon → JSON share sheet) ·
  **Delete everything** (trash, danger → confirm alert → wipe → onboarding).
- Footer: "Subme 1.0.0 · Made in India 🇮🇳 · Your data stays yours."

### 4.7 Subscription detail  `/subscription/[id]`
- **Header**: ‹ back · service name · **Edit / Save** toggle (right).
- **Identity card** (glass, centered): ServiceLogo (56) + ₹ price (editable inline
  when editing) + `Plan · Cycle · Category`. If active: "Renews <date>" + DaysChip;
  else status word.
- **Two stat cards** (side by side): **Lifetime spend** ₹ · **Since** <start date>.
- **Action row** (3 buttons): Pause/Resume · Mark cancelled · Delete (danger,
  confirms).
- **Notes**: editable multiline when editing, else card (or placeholder hint).
- **Price history**: card, dated rows of price changes.
- **Renewal log**: card, dated rows of charges (or "first one lands on <date>").

### 4.8 Add subscription  `/subscription/add`
- **Header**: ‹ back · "Add subscription".
- **Mode toggle** (segmented): **From catalog** | **Custom**.
- **Catalog mode**: search input (autofocus) + result rows (logo + name +
  `Category · from ₹X`) → tap selects & autofills. Link "Can't find it? Add a
  custom subscription".
- **Form** (after pick / custom): service header or Name field · Plan (chips for
  catalog multi-plan, or text for custom) · **Price ₹** · **Billing cycle** chips
  (Weekly/Monthly/Quarterly/Yearly) · Category chips (custom only) · **Started on**
  (YYYY-MM-DD) · **Start tracking** button. Validates name/price/date; enforces
  free cap.

### 4.9 Auth (dormant)  `/(auth)/login`, `/otp`
Built, not in the flow until Supabase exists. Login = email field + "Email me a
code". OTP = 6-digit field + Verify. In local mode they show an "offline build"
notice.

---

## 5. Notifications
- **Renewal alert** (channel "renewals"): fires 09:00 IST, `days_before` ahead.
  "<Service> renews <when> — ₹X · plan. Pause or cancel in Subme if you don't
  need it."
- **Detection alert** (channel "detections"): after a scan finds new subs.
  "New subscription found on your account / Tap to review and add them — one tap
  each. No typing." Tapping → Inbox.

---

## 6. Key flows
1. **Onboarding** → value → privacy (+phone) → quick-add grid → Inbox.
2. **Auto-detect** → (launch or Scan now) → engine reads SMS → detection cards in
   Inbox → **Add to Subme** (one tap) → tracked subscription.
3. **Manual add** (fallback) → Add screen → catalog or custom → tracked.
4. **Renewal** → engine matches a charge to an existing sub → logs it + advances
   the date (no user action).
5. **Manage** → Subscriptions swipe / Detail screen → pause / cancel / delete / edit.

---

## 7. Screen inventory (quick count)
9 screens: Onboarding, Inbox, Dashboard, Subscriptions, Calendar, Settings,
Detail, Add, (Auth ×2 dormant).
11 components: Screen, AuroraBackground, Card/Glass, Banner, Donut, Sparkline,
DaysChip, ServiceLogo, EmptyState, PlanPicker, SubRow.
