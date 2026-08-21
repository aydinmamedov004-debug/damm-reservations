# damm. — Reservation & Menu Web App

A reservation and menu web application for **damm.**, the rooftop wine bar
(Instagram [@damm.local](https://instagram.com/damm.local)) over the Old City
walls (İçərişəhər) in Baku. Built to replace manual (DM/phone) booking with a
self-serve reservation system.

The look, copy, wine list, and admin layout were designed collaboratively in
**Claude Design** (the "Wine restaurant website design" project) and then
implemented here as a real, working app — not just the static mockup.

## What this covers

| Requirement | Where |
|---|---|
| Customer makes a reservation | `/reserve` — date/time/guest picker with live per-slot availability, inline field validation, memorable confirmation code |
| Customer views the full menu | `/menu` — the real wine list (Chabiant, Savalan, Göygöl, İvanovka Bağları 1954…) plus snacks, filterable by category, always reflects admin edits |
| Admin adds/removes reservations, sees **all** tables at once | `/admin` → **Tonight** tab — quick filters (Today/All/Upcoming/Past/Cancelled/Trash), search, walk-in entry, confirm/seat/cancel/delete — with undo |
| Admin manages the menu | `/admin` → **Menu** tab — add items (glass/bottle or flat pricing), hide/show, delete |

Two extra admin views round out the design: **Requests** (a queue of pending
online reservations to Accept/Decline — separate from confirmed bookings) and
**Calendar** (a 7-night × time-slot heatmap of real booked-vs-capacity data).
The **Tonight** tab's stat row also tracks progress toward the
**500-bookings-in-month-one** launch goal.

## About the design

Layout and copy come from the Claude Design project `Damm Local Website.dc.html`
(design system: Nocturne), but the accent color does not — the design's
violet "Nocturne" accent didn't read as a wine bar, so it's been replaced
with a wine-red (bordeaux `#7A1F2B` in light mode, a brighter garnet
`#D66A7A` in dark mode for contrast). White ground kept from the original
(`#eeeff5` page / `#ffffff` cards, not stark white), Poppins headings over
an Inter body. The toggle (top right, every page) remembers the visitor's
choice in `localStorage` and otherwise follows OS preference.

The whole site is bilingual by design (English with Azerbaijani alongside —
nav links, hours, form labels) rather than a language switcher, which reads
better for a small bilingual audience than a toggle most people won't use.

All colors are CSS variables per theme (`app/globals.css`) behind semantic
Tailwind tokens (`bg-background`, `text-foreground`, `text-accent`, …), so
every page/component works in both themes without duplicated `dark:` classes
scattered everywhere.

**The wine list and snacks are real** — transcribed from the design project,
not placeholders (Azerbaijani houses: Chabiant, Savalan, Göygöl, İvanovka
Bağları 1954, plus Ağsu Nar, Aperol Spritz, non-alcoholic options, and an
11-item snacks/boards list). Edit it any time from `/admin` → Menu.

**Photos** (`lib/images.ts`): the home page hero and image-band photos are
real damm. photography — supplied directly and saved to
`public/images/hero.jpg` and `public/images/band.jpg`. Everything else (the
Visit page, and one photo per menu category — Red/White/Rosé/Other/Non
alcohol/Snacks) is freely licensed stock from Wikimedia Commons, since I
couldn't safely pull further photos from Instagram (login-gated CDN, reuse
rights unconfirmed) and had no working AI image generator in this session:
public domain/CC0 where available, attribution-only otherwise (credited in
the footer). One photo per menu *category*, not per wine — there's no real
photo of the specific Chabiant/Savalan/Göygöl bottles to source, so faking
47 individual product shots would have been worse than one honest category
image. Swap any of the Commons ones for real venue photography the same
way — drop the file in `public/images/` and point the URL in
`lib/images.ts` at `/images/your-file.jpg`.

## Running it

```bash
npm install
npm run db:migrate:local   # first time only — creates the local D1 database
npm run dev
```

Then open `http://localhost:3000`.

- Customer site: `/`, `/menu`, `/reserve`, `/visit`
- Admin: `/admin` (redirects to `/admin/login` if not signed in)
- **Admin password**: set in [.env.local](.env.local) (used by `next dev`) as
  `ADMIN_PASSWORD` (defaults to `damm2026` — change this before deploying).
  `.dev.vars` holds the same value for the Cloudflare-runtime preview
  (`npm run cf:preview`) — see [Deploying to Cloudflare](#deploying-to-cloudflare).

## How it works

- **Next.js 15 (App Router, TypeScript) + Tailwind CSS, deployed to
  Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare).**
- **Storage**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (a
  managed SQLite). `lib/db.ts` is the only file that touches it — every
  route goes through those functions, so it's the one place a future storage
  swap would happen. This app used to persist to a local `data/db.json`
  file; that only works on a server with a writable disk, which Cloudflare's
  Workers runtime deliberately doesn't have (ephemeral, stateless per
  request) — D1 is the fix, not a config tweak. Schema + seed data live in
  `migrations/0001_init.sql`.
- **Known limitation**: the capacity check (read seats booked, then insert)
  isn't wrapped in a transaction, so two requests landing in the same
  millisecond for the last seat in a slot could both succeed. Low risk at
  this venue's traffic (26 seats, one location) — worth fixing with a D1
  batch/transaction before scaling up.
- **Capacity**: damm. is rooftop-only (26 seats, `settings.totalSeats`) —
  there is no indoor room, so capacity is one number checked per 30-minute
  slot across the 18:00–02:00 window (`lib/slots.ts`). A booking that would
  exceed capacity for that slot is rejected online; admin-entered walk-ins
  bypass the cap.
- **Weather call**: `/admin` → Tonight has a "Close tonight (weather)" toggle
  (`settings.roofOpen`). Since there's no indoor fallback, closing it pauses
  online booking entirely — the reserve page shows a closed notice and blocks
  submission rather than offering an alternate seating.
- **Reservation form validation** (`components/ReservationForm.tsx`): every
  field is checked before submit — a name under 2 characters, a phone number
  with too few or too many digits, a malformed email, or no date/time picked
  each get their own inline message next to the field, both client-side and
  mirrored server-side in the API route as defense in depth.
- **Confirmation codes** (`lib/confirmationCode.ts`) are memorable by design —
  `ADJECTIVE-NOUN-##` themed to the space (e.g. `ROSY-SKYLINE-14`) instead of
  an opaque id, so a guest can read it out over the phone. Shown on the
  confirmation screen only — no email is sent, intentionally.
- **Undo, not just delete**: every status change (cancel, soft-delete, a
  declined request) records what the status was right before it, so "Delete"
  moves a reservation to a recoverable Trash rather than erasing it, and
  destructive actions pop a 7-second "Undo" toast. "Delete Forever" (from
  Trash) is the only irreversible action, and it asks for confirmation.
- **Admin auth**: a simple password (`ADMIN_PASSWORD`) issues an HttpOnly
  session cookie, checked server-side on every admin page and mutating API
  route. Intentionally lightweight for a single-staff-login use case — not
  meant to hold up to a public multi-admin launch without hardening (hashed
  credentials, rate limiting).
- **Known trade-off**: `npm audit` flags a source-map/file-disclosure
  advisory in a dev-tooling dependency bundled *inside* Next.js itself (not
  your code, not exploitable at runtime). Fixing it means jumping to Next 16
  — the OpenNext Cloudflare adapter in use does support 16.2.11+, so this is
  revisitable without re-doing the Cloudflare migration, just not done here.

## Toward the 500-bookings goal

- The reservation flow is one page, chip-based (date/time), under a
  minute to complete — friction is the #1 killer of online booking adoption.
- Put the `/reserve` link in the Instagram bio and pin a Story highlight to
  it — that's the highest-intent traffic source today (3,235 followers).
- A QR code on table tents/receipts linking to `/reserve` turns walk-ins into
  repeat online bookers.
- The Tonight tab's monthly counter gives a running check on pace toward
  500 — if week 1 is behind, that's the signal to push the Instagram link
  harder rather than waiting for month-end.

## Project structure

```
app/
  (site)/            customer-facing pages (home, menu, reserve, visit) + shared nav/footer
  admin/(auth)/       admin login (unprotected)
  admin/(protected)/  admin shell — Tonight / Calendar / Requests / Menu tabs (redirects to login if unauthenticated)
  api/                route handlers: reservations, menu, availability, admin auth, admin settings
lib/
  db.ts                 D1 data access layer — the only file that runs SQL
  types.ts               shared types (Reservation, MenuItem, Settings)
  slots.ts                time-slot + date-chip generation
  seed.ts                 readable source of the wine/snacks menu (generated migrations/0001_init.sql from this — not imported at runtime)
  confirmationCode.ts     memorable reservation codes
  menuFormat.ts            glass/bottle price formatting
  images.ts                free-licensed photo URLs + credits
components/             client components (reservation form, admin shell, theme toggle, quick-reserve widget)
migrations/             D1 schema + seed data (0001_init.sql)
wrangler.jsonc          Cloudflare Worker config — D1 binding, assets, compatibility flags
open-next.config.ts     OpenNext Cloudflare adapter config
```

## Deploying to Cloudflare

This app runs on Cloudflare Workers (via [OpenNext](https://opennext.js.org/cloudflare))
with [D1](https://developers.cloudflare.com/d1/) for storage. One-time setup:

```bash
# 1. Log in — opens a browser for you to authorize Wrangler against your
#    own Cloudflare account. Nothing is deployed by this step.
npx wrangler login

# 2. Create the real D1 database (a persistent cloud resource on your account).
npx wrangler d1 create damm-reservations-db
# Copy the "database_id" it prints into wrangler.jsonc, replacing
# "REPLACE_WITH_D1_DATABASE_ID".

# 3. Apply the schema + seed the real wine list into that database.
npm run db:migrate:remote

# 4. Set the admin password as a Worker secret (not committed anywhere).
npx wrangler secret put ADMIN_PASSWORD
```

Then, every time you want to ship a change:

```bash
npm run cf:deploy
```

`npm run cf:preview` builds the same way and runs it locally against the
**real** Cloudflare Worker runtime (workerd) before you deploy — useful for
catching anything `next dev` wouldn't (this is how the whole D1 migration
above was verified before ever touching the real account). Both scripts
regenerate `cloudflare-env.d.ts` (from `wrangler.jsonc`) automatically, so
TypeScript always knows about the current bindings.
