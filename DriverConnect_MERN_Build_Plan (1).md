# DriverConnect — MERN Stack Build Plan
*Customer / Driver / Admin as separate apps & URLs, sharing one backend and one source of truth.*

> **Note on Drivers4Me reference:** I looked at Drivers4Me's publicly described feature set (verified/background-checked drivers, real-time tracking, transparent fare breakdown, driver rating + photo, professional "uniformed" trust signals, B2B accounts) to borrow as *functional* inspiration below. The plan does not copy their actual logo, color palette, layout, or copy — that's their brand IP. What you get is an original design system built around the same trust-signal *ideas*.

---

## 1. Architecture Overview

Three separate frontend applications, one shared backend, one database. This is what "different URLs, same logic" means in practice:

```
                        ┌─────────────────────────┐
                        │   MongoDB Atlas (M0)     │
                        │  Users / Drivers / Trips │
                        └────────────▲─────────────┘
                                     │
                        ┌────────────┴─────────────┐
                        │   Node.js + Express API   │
                        │   + Socket.io (realtime)  │
                        │   One backend, RBAC-gated │
                        └───┬───────────┬───────────┘
              customer JWT  │           │  driver JWT       │ admin JWT
                            │           │                    │
              ┌─────────────▼──┐  ┌─────▼──────────┐  ┌──────▼─────────┐
              │  Customer App   │  │   Driver App    │  │  Admin Panel   │
              │  (React, Vite)  │  │  (React, Vite)  │  │ (React, Vite)  │
              │ app.<domain>    │  │ drive.<domain>  │  │ admin.<domain> │
              └─────────────────┘  └─────────────────┘  └────────────────┘
```

**Why one backend, three frontends (not three backends):** all three apps read and write the *same* `bookings` collection and must agree on the same state machine. Splitting the backend by role invites the exact bug we fixed last round — two services disagreeing about whether a booking is still "searching." One Express API with role-based access control (RBAC) middleware is both simpler to build and safer.

**Repo shape (npm/yarn workspaces or Turborepo — free, no paid tooling needed):**
```
/apps
  /customer-web      → React app, customer login + booking + tracking
  /driver-web        → React app, driver login + KYC + accept/trip flow
  /admin-web         → React app, admin login + verification + ops
  /server            → Express API + Socket.io + Mongoose models
/packages
  /shared-types       → TypeScript types (Booking, User, Driver, enums) used by all four apps
  /api-client         → Typed fetch wrapper, one per role, shared logic
```
A shared-types package is the single most important guardrail here: it's what stops the customer app, driver app, and backend from silently drifting on what a `Booking` object looks like.

---

## 2. Separate URLs — How to Do This for Free

**For the prototype (zero cost, no domain purchase needed):** deploy each app as its own Vercel/Netlify project. Each gets its own free `*.vercel.app` URL automatically:
- `driverconnect-customer.vercel.app`
- `driverconnect-driver.vercel.app`
- `driverconnect-admin.vercel.app`

This already satisfies "different URLs, different login pages" — no shared login screen, no role-switcher, each app is its own deployable unit.

**When you're ready for a real domain (~$10-12/yr, the only non-free line item in this whole plan):** point subdomains at the same three deployments — `app.yourdomain.com`, `drive.yourdomain.com`, `admin.yourdomain.com`. No code changes needed, just DNS + a domain rename in your hosting dashboard.

**Admin app should not be publicly linked or indexable** — no link to it from the customer/driver apps, `robots.txt` disallow, and (important) IP-agnostic but auth-gated: admin login still requires role=`admin` in the JWT, checked server-side on every request, not just hidden by URL obscurity.

---

## 3. Tech Stack

| Layer | Choice | Free-tier reality | Notes |
|---|---|---|---|
| Frontend (×3) | **React + Vite + TypeScript + Tailwind** | Vercel free tier per project | Vite over CRA — faster builds, CRA is effectively unmaintained |
| Backend | **Node.js + Express + TypeScript** | Render free web service (cold-starts after ~15 min idle — same caveat class as Supabase's pause, budget for it before a demo) | Plain Express, not NestJS, for a solo/small prototype — less ceremony for agents to generate consistently |
| Database | **MongoDB Atlas (M0 free cluster)** | 512 MB storage, free indefinitely (not a trial) — confirm current cap at mongodb.com/pricing before relying on it | No auto-pause behavior like Supabase, which is actually an advantage for demo reliability |
| Realtime | **Socket.io** (on the same Express server) | Free — self-hosted, no third-party realtime quota | Namespaces/rooms per role and per booking (Section 6) |
| Auth | **JWT (access + refresh) + bcrypt**, role embedded in token | Free, self-built | Three login endpoints (`/auth/customer/login`, `/auth/driver/login`, `/auth/admin/login`) issuing role-scoped tokens |
| OTP | **Dev-mode fixed OTP** behind an env flag; Twilio trial credit when you need real SMS | Twilio gives limited trial credit, not perpetual free | Never let the dev-OTP path be reachable in the prod env var config |
| File storage (KYC docs, photos) | **Cloudinary free tier** | Generous free-forever tier for storage + bandwidth at prototype scale | Simplest drop-in for MERN — signed upload from client, no server-side file handling needed |
| Maps | **Mapbox or Leaflet + OpenStreetMap** | Confirm current Mapbox free quota before relying on it | unchanged reasoning from earlier plan |
| Payments | **Razorpay test mode** | Free | unchanged |
| Hosting (frontends) | **Vercel** (3 separate projects) | Free | unchanged |
| Hosting (backend) | **Render** free web service | Free, with cold-start caveat above | Alternative: Fly.io free allowance if Render's cold starts are a problem for your demo |
| Error tracking | Sentry (or similar) free tier | Confirm current quota | Same reasoning as before — cheap insurance |
| CI | GitHub Actions | Free minutes for small repos | Lint + typecheck + build, required on every PR |

---

## 4. Data Model (Mongoose)

Kept close to your original ERD, translated to MongoDB idioms — subdocuments where the data is always read together, references where it's queried independently.

```ts
// User (customer)
{
  _id, phone, name, email,
  addresses: [{ label, lat, lng }],
  vehicles: [{ make, model, transmission }],
  rating: Number,
  createdAt
}

// Driver
{
  _id, phone, name,
  kyc: { licenseUrl, aadhaarUrl, photoUrl, status: 'pending'|'verified'|'rejected' },
  vehicleSkills: [String],           // types of car they can drive
  isOnline: Boolean,
  location: { type: "Point", coordinates: [lng, lat] },  // GeoJSON, 2dsphere-indexed
  rating: Number,
  bankDetails: { accountNo, ifsc },  // encrypted at rest
  createdAt
}

// Booking
{
  _id, customerId, driverId,
  type: 'local'|'roundtrip'|'hourly'|'outstation',
  pickup: { lat, lng, address },
  drop: { lat, lng, address },
  status: 'created'|'searching'|'assigned'|'driver_arrived'|'otp_verified'|
          'started'|'completed'|'paid'|'closed'|'cancelled',
  otp: String,          // hashed
  fare: { estimate, final, breakdown },
  timestamps: { createdAt, assignedAt, startedAt, completedAt },
}

// Rating
{ bookingId, raterId, rateeId, stars, tags: [String], comment }

// ProcessedWebhookEvent
{ eventId: { type: String, unique: true }, processedAt }
```

**Required indexes (this is where MERN prototypes usually skip a step that bites later):**
- `Driver.location` → `2dsphere` index (enables `$near`/`$geoWithin` queries — this is Mongo's equivalent of the PostGIS `ST_DWithin` query from the earlier plan)
- `Booking.status` → regular index (admin ops dashboard and matching queries filter on this constantly)
- `ProcessedWebhookEvent.eventId` → unique index (this *is* the idempotency guarantee, not just a lookup optimization)

---

## 5. State Machine & Concurrency (Mongo version of the earlier fix)

Same state machine as before — `created → searching → assigned → driver_arrived → otp_verified → started → completed → paid → closed` (with `cancelled` branching off the pre-`started` states) — enforced server-side, not just in the UI.

**Concurrency-safe accept, MERN-native pattern:**
```ts
const booking = await Booking.findOneAndUpdate(
  { _id: bookingId, status: "searching" },
  { $set: { status: "assigned", driverId, "timestamps.assignedAt": new Date() } },
  { new: true }
);

if (!booking) {
  // another driver already got it — return 409, driver app shows
  // "request no longer available", not a silent overwrite
  return res.status(409).json({ error: "booking_already_assigned" });
}
```
This is the direct MongoDB equivalent of the Postgres conditional `UPDATE ... WHERE status = 'searching'` from the earlier plan — `findOneAndUpdate` with the status in the filter is atomic in MongoDB, so this is still the correct fix, not just a stack-appropriate rewrite.

**Webhook idempotency (Razorpay test mode):**
```ts
try {
  await ProcessedWebhookEvent.create({ eventId: event.id });
} catch (e) {
  if (e.code === 11000) return res.sendStatus(200); // duplicate delivery, already handled
  throw e;
}
// ...proceed to update booking/payment status
```

---

## 6. Realtime Architecture (Socket.io)

- **Namespaces per app**, not one global socket pool: `/customer`, `/driver`, `/admin` — each authenticated with the same JWT used for REST calls (verified once, on connection).
- **Rooms per booking**, not a broadcast to everyone: on booking creation, candidate drivers join a room `search:{bookingId}`; on accept, both parties join `trip:{bookingId}`, and only that room receives location ticks and status events for that trip.
- **Location updates: emit, don't persist per tick.** Driver app emits `location:update` every 2-3s to the `trip:{bookingId}` room via Socket.io — this is in-memory pub/sub, not a DB write. Persist a location checkpoint to Mongo every ~30s for post-trip audit/replay, exactly the same reasoning as the Supabase Broadcast-vs-postgres_changes fix from the last review — the stack changed, the principle (don't write-amplify high-frequency ticks to your primary DB) didn't.
- **Matching broadcast:** when a booking is created, the backend queries nearby online+verified drivers via the `2dsphere` index, then emits `booking:request` only to those drivers' sockets — not a global broadcast, which both scales better and avoids showing every driver in the country a request that's clearly out of range.

---

## 7. Security Baseline (MERN version)

- **RBAC middleware on every route**, keyed off the JWT's `role` claim — `requireRole('admin')`, `requireRole('driver')`, etc. — checked server-side, never inferred from which frontend the request "looks like" it came from.
- **Password/OTP hashing** with bcrypt; JWT secrets and Cloudinary/Razorpay keys in environment variables, never in the client bundle (Vite only exposes vars prefixed `VITE_` to the client — keep secrets out of that prefix entirely).
- **Rate limiting on auth/OTP endpoints** (`express-rate-limit`, free, a few lines) — without this, your dev-mode fixed OTP is a trivially bruteable login if you ever expose it beyond your own testing.
- **CORS locked to your three known frontend origins**, not `*`.
- **Admin app**: not linked publicly, not indexed, still fully auth-gated server-side as noted in Section 2.

---

## 8. UI / Design System — "Professional, Drivers4Me-caliber, but yours"

Borrow the *trust signals* that make an on-demand driver app feel credible, expressed in your own visual language:

- **Verified badge** on every driver card/profile — small checkmark + "Verified" chip, consistently placed (top-right of avatar), reused identically across customer app, driver's own profile, and admin verification queue.
- **Driver card pattern**: photo, name, star rating with count (e.g. "4.8 · 1,240 trips"), vehicle type, ETA — this exact card component should be shared (via the `shared-types`/component pattern) between the "finding driver" screen and the "driver assigned" screen so it doesn't visually reset.
- **Transparent fare breakdown** before every confirm step — base + distance + time + tolls, never just a lump total; this is a trust signal, not just a UI nicety.
- **Live map with a smoothly interpolated marker**, not a marker that jumps every 2-3 seconds — animate between ticks client-side (a simple `requestAnimationFrame` lerp between last two known points) since raw socket ticks look janky otherwise.
- **Design tokens** (define once, use everywhere): a professional, non-generic palette — e.g. a deep navy/ink primary with a single confident accent color (teal or amber) for CTAs and the verified badge, neutral grays for structure, one accent-colored "live" indicator style used consistently for anything real-time (online toggle, live tracking dot, SOS button state).
- **Typography**: one clean sans-serif (Inter or similar) at consistent weight/size steps — resist the urge to introduce a second typeface for "personality"; consistency reads as more professional than variety here.
- **Admin panel** should look deliberately different in tone from the two consumer apps — denser tables, less whitespace, utilitarian — because it's a different job to be done, and a bespoke ops dashboard.

---

## 9. Build Phases (MERN-mapped)

| Phase | Scope | Maps to earlier plan |
|---|---|---|
| 0 | Repo scaffold (workspaces), shared-types package, Mongoose schemas + indexes | Foundation |
| 1 | Express API skeleton, JWT auth (3 role-scoped login endpoints), RBAC middleware, deploy empty shells of all 4 apps | Setup |
| 2 | Customer + Driver login/OTP (dev-mode), profile forms, KYC upload wizard (Cloudinary), Admin verification queue | Auth & profiles |
| 3 | Booking creation, geospatial matching query, Socket.io request broadcast, atomic accept endpoint | Core booking flow |
| 4 | Live trip: Socket.io rooms, animated map tracking, OTP-gated start, fare timer, idempotent completion | Live trip experience |
| 5 | Ratings, trip history, Razorpay test-mode checkout + idempotent webhook | Ratings/payments |
| 6 | Seed script (fake drivers/customers with realistic geo-spread), admin ops table polish | Seed + admin |
| 7 | UI design-system pass across all 3 apps, responsive check, error states, Sentry wiring | Polish |

---

## 10. Detailed Antigravity Agent Workflow

Nine agents, mostly sequential, two parallelizable. Same core discipline as before — Task List and Implementation Plan artifacts are your approval gate *before* code is written, walkthrough artifacts are required proof for anything demo-critical, and `/docs/decisions.md` is the running log every new agent reads first.

**Before dispatching anything:** commit this document, the shared data model (Section 4), and the state machine (Section 5) to `/docs/spec.md` in the repo root. Every agent below should be told to read it first.

---

**Agent 1 — Monorepo & shared packages**
> "Set up an npm/yarn workspaces monorepo per the structure in `/docs/spec.md` Section 1: `/apps/customer-web`, `/apps/driver-web`, `/apps/admin-web` (React + Vite + TS + Tailwind), `/apps/server` (Express + TS), `/packages/shared-types`, `/packages/api-client`. Deploy all four as empty shells (three to Vercel, one to Render) so every later change is auto-previewed. Produce a Task List and Implementation Plan before writing code."

**Agent 2 — Database & auth core** *(depends on Agent 1)*
> "Implement the Mongoose schemas from `/docs/spec.md` Section 4 with the required indexes (2dsphere on Driver.location, index on Booking.status, unique index on ProcessedWebhookEvent.eventId). Implement JWT auth with three role-scoped login endpoints and RBAC middleware per Section 7. Dev-mode OTP behind an env flag that cannot be true when `NODE_ENV=production`. Write these types into `/packages/shared-types` so all three frontends import the same Booking/User/Driver shape."

**Agent 3 — Customer app: auth, profile, booking creation** *(depends on Agent 2)*
> "Build the customer-web login (phone + dev-OTP), profile/address/vehicle forms, and the booking creation flow (pickup/drop pin, trip type, fare estimate) per Section 8's design system (driver card pattern, fare breakdown, design tokens). Do not build the live-tracking screen yet — that's Agent 5."

**Agent 4 — Driver app: auth, KYC, online toggle, accept flow** *(depends on Agent 2, parallel with Agent 3)*
> "Build driver-web login, the KYC upload wizard (Cloudinary signed uploads for license/Aadhaar/photo), online/offline toggle, and the incoming-request modal with the atomic accept endpoint from Section 5. Require a walkthrough artifact demonstrating the concurrent-accept race case explicitly: two simulated driver sessions accepting the same booking, second one receiving the 409 and showing 'no longer available' — do not accept 'should work' without this recorded proof."

**Agent 5 — Realtime & matching service** *(depends on Agent 2, feeds Agents 3 & 4)*
> "Implement the Socket.io layer from Section 6: namespaces per role, rooms per booking, geospatial matching query on booking creation, location-tick broadcast (emit-only, not persisted per tick) with a 30s DB checkpoint. Wire this into the customer app's live-tracking screen (animated marker, not a jumpy one) and the driver app's active-trip screen."

**Agent 6 — Admin panel** *(depends on Agent 2, parallel with Agents 3-5)*
> "Build admin-web: login, KYC verification queue (approve/reject against Driver.kyc.status), live bookings table filtered by status, basic user/driver management. Not publicly linked, `robots.txt` disallow, RBAC-gated per Section 7. Visually distinct from the consumer apps per Section 8's admin design note."

**Agent 7 — Ratings, history, payments** *(depends on Agents 3-5)*
> "Implement two-way ratings, trip history/invoice views, and Razorpay test-mode checkout with the idempotent webhook handler from Section 5 (ProcessedWebhookEvent pattern). Verify with a walkthrough that a duplicated webhook delivery does not double-process a payment."

**Agent 8 — Seed data & E2E verification** *(depends on all above)*
> "Write a seed script generating ~15 realistic fake drivers geo-spread around [your demo city] and a handful of fake customers. Then run and record a full end-to-end browser walkthrough: customer books → driver receives and accepts → live tracking animates → OTP start → trip completes → both rate → customer pays (test mode). This is the master demo-readiness artifact — require it before considering the prototype done."

**Agent 9 — UI/design-system polish pass** *(parallelizable, after Agent 8's loop works)*
> "Apply the Section 8 design tokens consistently across all three apps: shared driver-card component, consistent verified-badge placement, typography scale, loading/empty/error states, mobile responsive pass. This agent should not touch business logic — flag anything that looks like a logic gap instead of silently 'fixing' it."

---

**CI gate (unchanged requirement):** no agent's PR merges without GitHub Actions lint + typecheck + build passing — set this up as part of Agent 1's task, since every agent after it depends on it holding.

**Review order for every agent's output (unchanged):** Task List → Implementation Plan → Walkthrough/screenshots → Diffs. Reject scope creep at the Task List stage, before code exists.

---

## Sign-off Note

This is the same underlying product and the same hard-won fixes from the earlier review (state machine, atomic accept, write-amplification avoidance, idempotent webhooks) — re-expressed in MERN idioms rather than Supabase/Postgres ones. The one new structural decision specific to this version is the three-separate-app split with a single shared backend and a shared-types package; that's what makes "different URLs" safe rather than three copies of the same logic silently drifting apart.
