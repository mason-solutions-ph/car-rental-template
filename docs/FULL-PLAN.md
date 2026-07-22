# Car Rental Template — Full Implementation Plan

> **How to use this doc:** Implement **one phase at a time**, top to bottom.  
> Each phase ends with **Done when** checkboxes. Do not skip phases that write data contracts (schema, types, seed).  
> Stack already installed: **Next.js 16 App Router · shadcn (radix-nova) · Supabase SSR · GSAP + `@gsap/react` · Tailwind v4 · bun**.  
> Payments: **PayMongo** (Checkout Session V2 · PHP · webhooks) — **required for v1**, not optional.

---

## Table of contents

1. [Product vision](#1-product-vision)
2. [User roles & journeys](#2-user-roles--journeys)
3. [Site map & routes](#3-site-map--routes)
4. [Design system](#4-design-system)
5. [Domain model](#5-domain-model)
6. [Database schema (full SQL)](#6-database-schema-full-sql)
7. [Auth, RLS & security](#7-auth-rls--security)
8. [Target file tree](#8-target-file-tree)
9. [Shared types & utilities](#9-shared-types--utilities)
10. [GSAP motion system](#10-gsap-motion-system)
11. [shadcn components to install](#11-shadcn-components-to-install)
12. [Phase-by-phase implementation](#12-phase-by-phase-implementation)
13. [Seed data](#13-seed-data)
14. [Payments — PayMongo (v1 required)](#14-payments--paymongo-v1-required)
15. [SEO, a11y, performance](#15-seo-a11y-performance)
16. [Testing matrix](#16-testing-matrix)
17. [Deployment checklist](#17-deployment-checklist)
18. [Definition of done (whole product)](#18-definition-of-done-whole-product)
19. [Open product decisions (defaults locked)](#19-open-product-decisions-defaults-locked)
20. [Phase index (quick checklist)](#20-phase-index-quick-checklist)

---

## 1. Product vision

### What we’re building

A **premium car rental marketing + booking template**: browse fleet → pick dates/location → view car detail → **pay with PayMongo** → manage bookings (customer) + light admin for fleet & reservations.

Not a multi-operator marketplace in v1. One brand, one fleet, one admin. **Payments go through PayMongo** (hosted Checkout Session V2; currency **PHP** / centavos).

### Brand feel

- **Positioning:** Modern, confident, slightly editorial — think boutique airport / city rental, not budget coupon site.
- **Visual:** Neutral base (existing shadcn tokens), high-contrast primary, large photography, restrained type, strong CTAs.
- **Motion:** Purposeful GSAP (hero, card entrances, section reveals). No endless bounce spam. Respect `prefers-reduced-motion`.

### Primary goals

1. Convert a visitor into a **paid booking** (PayMongo Checkout) in under 3 minutes.
2. Showcase fleet with filters that feel instant.
3. Give operators a **simple admin** to mark cars available and manage paid / unpaid / cancelled bookings without a full back-office suite.

### Non-goals (v1)

- Multi-tenant dealers / franchise portals  
- Real-time GPS vehicle tracking  
- In-app chat support  
- Native mobile apps  
- Complex insurance underwriting  
- Stripe or other PSPs (PayMongo only)  
- Custom PCI card forms (use hosted Checkout)  
- Automatic refunds / partial captures  
- Live inventory locking beyond booking status + date overlap + unpaid hold window

---

## 2. User roles & journeys

### Roles

| Role | Who | Capabilities |
|------|-----|----------------|
| **Guest** | Anonymous visitor | Browse home, fleet, car detail, locations, about, contact. Start booking → prompted to sign in. |
| **Customer** | Authenticated renter | All guest + create booking, view “My bookings”, cancel pending/confirmed (rules below). |
| **Admin** | Staff (role flag) | Customer powers + admin dashboard: cars CRUD-ish, bookings list, status updates, locations. |

### Canonical journeys

#### J1 — Discover, book & pay (happy path)

1. Land on `/` → hero + search strip (pickup location, dates, optional class).
2. Submit search → `/cars?location=&from=&to=&class=`.
3. Filter/sort fleet → open `/cars/[slug]`.
4. Review specs, gallery, price (₱) → **Book & pay**.
5. Booking form prefilled with dates/location → submit.
6. If guest → `/login?next=/cars/[slug]/book` then return.
7. Server creates booking (`status=pending`, `payment_status=unpaid`) + **PayMongo Checkout Session V2**.
8. Redirect browser to PayMongo hosted checkout (`checkout_url`).
9. Customer pays (card / GCash / Maya / etc. per enabled channels).
10. PayMongo fires webhook `checkout_session.payment.paid` → app marks `payment_status=paid`, `status=confirmed`.
11. Customer lands on `success_url` → `/account/bookings/[id]?paid=1` with reference code.
12. If they abandon checkout → `cancel_url` → booking stays `unpaid`/`pending`; “Pay now” can recreate session.

#### J2 — Browse without dates

1. Nav → Fleet → `/cars` shows all available cars.
2. Apply filters client/server via search params.
3. Same path into detail + book (dates required at submit).

#### J3 — Manage booking

1. Customer → `/account/bookings`.
2. Open booking → cancel if eligible (see rules) and start date is ≥ 24h away.
3. If unpaid, show **Pay now** (new PayMongo Checkout Session).
4. Status timeline: pending (awaiting payment) → confirmed (paid) → active → completed | cancelled.

#### J4 — Admin ops

1. Admin → `/admin`.
2. See counts: unpaid/pending, paid/confirmed, cars available, revenue (sum of `paid` totals).
3. Bookings table → view PayMongo IDs, mark `active` / `completed` / `cancelled` (refunds manual in PayMongo dashboard for v1).
4. Cars table → toggle `is_published`, edit daily rate (centavos), mark maintenance.

### Status rules (booking lifecycle)

**Two axes:** operational `status` + `payment_status`. Keep both; do not overload one enum.

#### `payment_status`

| Value | Meaning |
|-------|---------|
| `unpaid` | Checkout not completed |
| `paid` | Webhook confirmed successful payment |
| `failed` | Payment attempt failed (optional set) |
| `refunded` | Full refund recorded (admin / later webhook) |
| `expired` | Checkout abandoned past hold window (optional job) |

#### `status` (operational)

| From | To | Who / trigger | Notes |
|------|-----|---------------|--------|
| — | `pending` | Customer create booking | Awaiting PayMongo payment |
| `pending` | `confirmed` | **Webhook** `checkout_session.payment.paid` | Auto after pay; admin override rare |
| `pending` | `cancelled` | Customer, Admin, or expire job | Unpaid cancel frees inventory |
| `confirmed` | `cancelled` | Customer (≥24h) or Admin | Paid cancel → manual refund process v1 |
| `confirmed` | `active` | Admin | Vehicle out |
| `active` | `completed` | Admin | Returned |
| any non-terminal | `cancelled` | Admin | Always allowed |

Terminal states: `completed`, `cancelled`.

**Inventory hold:** Treat `pending` + `unpaid` as holding the car for **30 minutes** (constant `CHECKOUT_HOLD_MINUTES`). Overlap checks include those rows only if `created_at` is within the hold window **or** `payment_status = paid` / status ∈ (`confirmed`, `active`).  
Implement in availability query (app layer or SQL) so abandoned checkouts don’t block the car forever.

### Pricing rules (v1) — PHP / PayMongo

PayMongo amounts are **integer centavos** (1 PHP = 100 centavos). Use the same unit in DB (`*_cents` columns store **centavos**).

```
rental_days = max(1, ceil of 24h blocks between pickup and dropoff)
subtotal    = daily_rate_cents * rental_days   // centavos
fees        = 0  (or fixed fee later)
total       = subtotal + fees                 // send this to PayMongo `amount`
currency    = PHP
```

Display with `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })`.

No taxes engine in v1 — optional note: “Government taxes may apply.”

### Availability rules (v1)

A car is **bookable** for `[pickup_at, dropoff_at)` if:

1. `cars.is_published = true`
2. `cars.status = 'available'` (not `maintenance` / `retired`)
3. No overlapping booking on that car where the other booking still **holds inventory**:
   - `status` ∈ (`confirmed`, `active`), **or**
   - `status = pending` AND `payment_status = unpaid` AND `created_at > now() - hold interval`, **or**
   - `status = pending` AND `payment_status = paid` (edge before status flip)
4. Overlap definition: existing.pickup_at < new.dropoff_at AND existing.dropoff_at > new.pickup_at
5. Minimum rental: 1 day; max: 30 days (configurable constant)

---

## 3. Site map & routes

### Public

| Route | Purpose | Auth |
|-------|---------|------|
| `/` | Marketing home + quick search | Public |
| `/cars` | Fleet catalog + filters | Public |
| `/cars/[slug]` | Car detail + CTA | Public |
| `/cars/[slug]/book` | Booking form (dates/driver) → PayMongo | Customer (redirect login) |
| `/bookings/payment/success` | Return URL after PayMongo pay | Customer |
| `/bookings/payment/cancel` | Return URL if checkout cancelled | Customer |
| `/locations` | Pickup/dropoff locations list | Public |
| `/locations/[slug]` | Location detail (optional v1.1) | Public |
| `/about` | Brand story | Public |
| `/contact` | Contact form (mailto or Supabase table) | Public |
| `/faq` | FAQ accordion | Public |
| `/terms` | Terms of rental | Public |
| `/privacy` | Privacy policy | Public |

### Auth

| Route | Purpose |
|-------|---------|
| `/login` | Email/password + magic link optional |
| `/signup` | Register |
| `/auth/callback` | OAuth / email confirm exchange |
| `/auth/signout` | Route handler or server action |

### Account (customer)

| Route | Purpose |
|-------|---------|
| `/account` | Redirect → bookings |
| `/account/bookings` | List my bookings |
| `/account/bookings/[id]` | Booking detail |
| `/account/profile` | Name, phone, license # (profile table) |

### Admin

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard stats |
| `/admin/cars` | Fleet list + edit |
| `/admin/cars/new` | Create car |
| `/admin/cars/[id]/edit` | Edit car |
| `/admin/bookings` | All bookings |
| `/admin/bookings/[id]` | Booking detail + status |
| `/admin/locations` | Locations CRUD |

### API / webhooks

| Route | Purpose |
|-------|---------|
| `POST /api/webhooks/paymongo` | PayMongo event receiver (raw body, verify signature) |
| `POST /api/contact` | Contact form (if not server action) |
| Bookings / checkout create | Prefer **server actions** → then redirect to Checkout URL |

---

## 4. Design system

### Foundations (already partially present)

- **Tokens:** `app/globals.css` shadcn semantic colors — keep; do not invent raw blues for surfaces.
- **Font:** Geist Sans / Geist Mono (layout already sets variables).
- **Radius:** existing `--radius`.
- **Icons:** `lucide-react`.
- **Dark mode:** Support class `.dark` via `next-themes` (Phase 2). Default: system or light for marketing.

### Layout chrome

```
┌─────────────────────────────────────────────┐
│ SiteHeader  (logo · nav · search · auth)    │
├─────────────────────────────────────────────┤
│                                             │
│  page content (max-w-6xl / full-bleed hero) │
│                                             │
├─────────────────────────────────────────────┤
│ SiteFooter  (links · legal · contact)       │
└─────────────────────────────────────────────┘
```

- Sticky header with blur (`backdrop-blur`, border-b).
- Mobile: Sheet nav.
- Admin: separate shell (`AdminSidebar` + top bar), no marketing footer.

### Section patterns (marketing)

1. **Hero** — full-bleed image/video optional, H1, subcopy, search card overlay or below.
2. **Logo/trust strip** — optional.
3. **Featured cars** — 3–6 horizontal cards.
4. **How it works** — 3 steps with icons.
5. **Locations teaser** — 2–3 cities.
6. **Testimonials** — 3 quotes (static content ok).
7. **CTA band** — “Ready to drive?”
8. **Footer**.

### Component density

- Marketing: comfortable (`gap-6`–`gap-12`, large type).
- Catalog: medium.
- Admin tables: compact.

### Copy tone

Short, confident. Prefer “Reserve the 911 for the weekend” over “Our premium selection of vehicles awaits your booking journey.”

---

## 5. Domain model

### Ubiquitous language

| Term | Meaning |
|------|---------|
| **Car** | A rentable vehicle unit (one row ≈ one physical car or SKU; v1 one row per model unit). |
| **Slug** | URL-safe unique identifier for a car or location. |
| **Location** | Physical pickup/dropoff point (airport, downtown). |
| **Booking** | A reservation of one car for a time range by one customer. |
| **Daily rate** | Price per 24h block in **integer centavos** (PHP). Column name `daily_rate_cents` = centavos. |
| **Profile** | Extended user info beyond `auth.users`. |
| **Admin** | User with `profiles.role = 'admin'`. |
| **Published** | Car visible on public site. |
| **Available (status)** | Car operationally free to rent (not in shop). Distinct from date availability. |
| **Checkout Session** | PayMongo hosted payment page (V2). One session per pay attempt. |
| **Payment status** | Whether money was captured (`unpaid` / `paid` / …). Independent of fleet ops status. |

### Entities (relationships)

```
profiles 1───* bookings *───1 cars
locations 1───* bookings (pickup)
locations 1───* bookings (dropoff)
cars *───1 locations (default_location optional)
cars 1───* car_images
```

### Enums

```ts
type UserRole = "customer" | "admin";
type CarStatus = "available" | "maintenance" | "retired";
type CarClass =
  | "economy"
  | "compact"
  | "sedan"
  | "suv"
  | "luxury"
  | "sports"
  | "van";
type Transmission = "automatic" | "manual";
type FuelType = "gasoline" | "diesel" | "hybrid" | "electric";
type BookingStatus =
  | "pending"
  | "confirmed"
  | "active"
  | "completed"
  | "cancelled";

type PaymentStatus =
  | "unpaid"
  | "paid"
  | "failed"
  | "refunded"
  | "expired";
```

---

## 6. Database schema (full SQL)

> Run in Supabase SQL editor **in order**, or as migration files under `supabase/migrations/`.

### 6.1 Extensions & helpers

```sql
-- 001_extensions.sql
create extension if not exists "pgcrypto";

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

### 6.2 Profiles

```sql
-- 002_profiles.sql
create type public.user_role as enum ('customer', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  license_number text,
  role public.user_role not null default 'customer',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'customer'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
```

### 6.3 Locations

```sql
-- 003_locations.sql
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  city text not null,
  region text,
  country text not null default 'PH',
  address_line1 text,
  postal_code text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  phone text,
  hours_note text, -- e.g. "Mon–Sun 8am–8pm"
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger locations_set_updated_at
before update on public.locations
for each row execute function public.set_updated_at();
```

### 6.4 Cars & images

```sql
-- 004_cars.sql
create type public.car_status as enum ('available', 'maintenance', 'retired');
create type public.car_class as enum (
  'economy', 'compact', 'sedan', 'suv', 'luxury', 'sports', 'van'
);
create type public.transmission as enum ('automatic', 'manual');
create type public.fuel_type as enum ('gasoline', 'diesel', 'hybrid', 'electric');

create table public.cars (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,                    -- "Porsche 911 Carrera"
  make text not null,
  model text not null,
  trim text,
  year int not null check (year >= 1990 and year <= 2100),
  class public.car_class not null,
  transmission public.transmission not null default 'automatic',
  fuel_type public.fuel_type not null default 'gasoline',
  seats int not null default 5 check (seats > 0 and seats <= 15),
  doors int not null default 4 check (doors > 0 and doors <= 6),
  luggage_capacity int,                  -- soft bags
  daily_rate_cents int not null check (daily_rate_cents > 0), -- centavos (PHP)
  currency text not null default 'PHP',
  description text,
  features text[] not null default '{}', -- {"Bluetooth","Apple CarPlay"}
  hero_image_url text,
  status public.car_status not null default 'available',
  is_published boolean not null default false,
  default_location_id uuid references public.locations (id) on delete set null,
  mileage_limit_per_day int,             -- null = unlimited
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cars_published_idx on public.cars (is_published, status);
create index cars_class_idx on public.cars (class);
create index cars_location_idx on public.cars (default_location_id);

create trigger cars_set_updated_at
before update on public.cars
for each row execute function public.set_updated_at();

create table public.car_images (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars (id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index car_images_car_id_idx on public.car_images (car_id, sort_order);
```

### 6.5 Bookings

```sql
-- 005_bookings.sql
create type public.booking_status as enum (
  'pending', 'confirmed', 'active', 'completed', 'cancelled'
);

create type public.payment_status as enum (
  'unpaid', 'paid', 'failed', 'refunded', 'expired'
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,   -- e.g. CR-A1B2C3
  customer_id uuid not null references public.profiles (id) on delete restrict,
  car_id uuid not null references public.cars (id) on delete restrict,
  pickup_location_id uuid not null references public.locations (id),
  dropoff_location_id uuid not null references public.locations (id),
  pickup_at timestamptz not null,
  dropoff_at timestamptz not null,
  status public.booking_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  daily_rate_cents int not null,         -- snapshot (centavos) at booking time
  rental_days int not null check (rental_days >= 1),
  subtotal_cents int not null,
  fees_cents int not null default 0,
  total_cents int not null,              -- amount sent to PayMongo (centavos)
  currency text not null default 'PHP',
  -- PayMongo
  paymongo_checkout_session_id text unique,
  paymongo_payment_intent_id text,
  paymongo_payment_id text,
  paid_at timestamptz,
  amount_paid_cents int,                 -- confirmed paid amount (centavos)
  customer_note text,
  admin_note text,
  driver_full_name text,
  driver_phone text,
  driver_license_number text,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_dates_valid check (dropoff_at > pickup_at)
);

create index bookings_customer_idx on public.bookings (customer_id, created_at desc);
create index bookings_car_idx on public.bookings (car_id, pickup_at, dropoff_at);
create index bookings_status_idx on public.bookings (status);
create index bookings_payment_status_idx on public.bookings (payment_status);
create index bookings_paymongo_cs_idx on public.bookings (paymongo_checkout_session_id);

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

-- Reference code generator
create or replace function public.generate_booking_reference()
returns trigger
language plpgsql
as $$
declare
  code text;
begin
  if new.reference_code is null or new.reference_code = '' then
    code := 'CR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    new.reference_code := code;
  end if;
  return new;
end;
$$;

create trigger bookings_set_reference
before insert on public.bookings
for each row execute function public.generate_booking_reference();
```

### 6.6 Availability helper (SQL function)

```sql
-- 006_availability.sql
-- Hold unpaid pending bookings for 30 minutes only
create or replace function public.car_is_available(
  p_car_id uuid,
  p_pickup timestamptz,
  p_dropoff timestamptz,
  p_exclude_booking_id uuid default null,
  p_hold_minutes int default 30
)
returns boolean
language sql
stable
as $$
  select
    exists (
      select 1 from public.cars c
      where c.id = p_car_id
        and c.is_published = true
        and c.status = 'available'
    )
    and not exists (
      select 1 from public.bookings b
      where b.car_id = p_car_id
        and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
        and b.pickup_at < p_dropoff
        and b.dropoff_at > p_pickup
        and (
          b.status in ('confirmed', 'active')
          or (
            b.status = 'pending'
            and b.payment_status = 'paid'
          )
          or (
            b.status = 'pending'
            and b.payment_status = 'unpaid'
            and b.created_at > now() - make_interval(mins => p_hold_minutes)
          )
        )
    );
$$;
```

### 6.7 Contact messages (optional)

```sql
-- 007_contact.sql
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);
```

### 6.8 Storage buckets (Supabase Storage)

| Bucket | Public | Use |
|--------|--------|-----|
| `car-images` | yes (read) | Fleet photography |
| `avatars` | yes (read) | Optional profile pics |

Policies: public read; write only admin (or service role via admin upload later).

---

## 7. Auth, RLS & security

### Auth methods (v1)

1. **Email + password** (primary)
2. Optional later: Google OAuth, magic link

### Env vars

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
# Optional admin server ops only:
# SUPABASE_SERVICE_ROLE_KEY=   # NEVER expose to client

# PayMongo — Dashboard → Developers → API keys
# https://dashboard.paymongo.com
PAYMONGO_SECRET_KEY=sk_test_...          # server only — Basic auth username, password empty
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_...  # only if client-side Elements ever needed; Checkout V2 can skip
PAYMONGO_WEBHOOK_SECRET=whsk_...         # webhook signing secret from webhook resource
NEXT_PUBLIC_APP_URL=http://localhost:3000    # used for success/cancel/webhook absolute URLs
```

**Auth to PayMongo REST:** HTTP Basic — username = `PAYMONGO_SECRET_KEY`, password = empty string.  
Never expose `PAYMONGO_SECRET_KEY` or `PAYMONGO_WEBHOOK_SECRET` to the browser.

### Helpers in app

```ts
// lib/auth/roles.ts
export async function requireUser() { /* redirect /login */ }
export async function requireAdmin() { /* redirect / or 403 */ }
export async function getProfile() { /* join profiles */ }
```

### RLS policies (full)

```sql
-- 008_rls.sql
alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.cars enable row level security;
alter table public.car_images enable row level security;
alter table public.bookings enable row level security;
alter table public.contact_messages enable row level security;

-- Helper: is_admin()
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- PROFILES
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = (select role from public.profiles where id = auth.uid())
  -- users cannot escalate role
);

create policy "profiles_admin_all"
on public.profiles for all
using (public.is_admin());

-- LOCATIONS: public read published
create policy "locations_public_read"
on public.locations for select
using (is_published = true or public.is_admin());

create policy "locations_admin_write"
on public.locations for all
using (public.is_admin())
with check (public.is_admin());

-- CARS: public read published + available-ish
create policy "cars_public_read"
on public.cars for select
using (
  (is_published = true and status <> 'retired')
  or public.is_admin()
);

create policy "cars_admin_write"
on public.cars for all
using (public.is_admin())
with check (public.is_admin());

-- CAR IMAGES: readable if parent car readable
create policy "car_images_public_read"
on public.car_images for select
using (
  exists (
    select 1 from public.cars c
    where c.id = car_id
      and (c.is_published = true or public.is_admin())
  )
);

create policy "car_images_admin_write"
on public.car_images for all
using (public.is_admin())
with check (public.is_admin());

-- BOOKINGS
create policy "bookings_select_own_or_admin"
on public.bookings for select
using (customer_id = auth.uid() or public.is_admin());

create policy "bookings_insert_own"
on public.bookings for insert
with check (
  customer_id = auth.uid()
  and status = 'pending'
);

create policy "bookings_update_own_cancel"
on public.bookings for update
using (customer_id = auth.uid() or public.is_admin())
with check (
  public.is_admin()
  or (
    customer_id = auth.uid()
    -- customer may only cancel; enforce more in app layer
  )
);

create policy "bookings_admin_all"
on public.bookings for all
using (public.is_admin())
with check (public.is_admin());

-- CONTACT: anyone can insert; only admin read
create policy "contact_insert_anon"
on public.contact_messages for insert
with check (true);

create policy "contact_admin_read"
on public.contact_messages for select
using (public.is_admin());
```

### App-layer security (must implement even with RLS)

1. Recompute **price on server** from `cars.daily_rate_cents` — never trust client totals.
2. Re-check **availability** on server at booking create.
3. Validate date range (min 1 day, max 30, dropoff > pickup).
4. Admin routes guarded by `requireAdmin()` **and** RLS.
5. Never ship service role key or PayMongo secret/webhook secret to browser.
6. Sanitize contact form (length limits, honeypot optional).
7. **Trust webhooks (verified) for payment confirmation** — never mark `paid` from the success URL alone (user can open it unpaid).
8. Success URL may **reconcile** by retrieving Checkout Session from PayMongo API if webhook is delayed — still verify server-side with secret key.

### Promoting first admin

```sql
update public.profiles
set role = 'admin'
where id = '<your-auth-user-uuid>';
```

---

## 8. Target file tree

```
app/
  layout.tsx                 # root: fonts, providers, chrome
  page.tsx                   # home
  globals.css
  (marketing)/
    layout.tsx               # SiteHeader + SiteFooter
    cars/
      page.tsx               # catalog
      [slug]/
        page.tsx             # detail
        book/
          page.tsx           # booking form (auth)
    locations/
      page.tsx
      [slug]/page.tsx        # optional
    about/page.tsx
    contact/page.tsx
    faq/page.tsx
    terms/page.tsx
    privacy/page.tsx
  (auth)/
    layout.tsx               # centered card layout
    login/page.tsx
    signup/page.tsx
  auth/
    callback/route.ts
    signout/route.ts
  account/
    layout.tsx               # requireUser
    page.tsx                 # redirect
    bookings/
      page.tsx
      [id]/page.tsx
    profile/page.tsx
  admin/
    layout.tsx               # requireAdmin + AdminShell
    page.tsx
    cars/
      page.tsx
      new/page.tsx
      [id]/edit/page.tsx
    bookings/
      page.tsx
      [id]/page.tsx
    locations/page.tsx
  actions/
    auth.ts
    bookings.ts
    payments.ts
    cars.ts
    contact.ts
    profile.ts
    locations.ts
  api/
    webhooks/
      paymongo/
        route.ts
  bookings/
    payment/
      success/page.tsx
      cancel/page.tsx

components/
  layout/
    site-header.tsx
    site-footer.tsx
    mobile-nav.tsx
    admin-sidebar.tsx
    admin-shell.tsx
  home/
    hero.tsx
    hero-search.tsx
    featured-cars.tsx
    how-it-works.tsx
    locations-teaser.tsx
    testimonials.tsx
    cta-band.tsx
  cars/
    car-card.tsx
    car-grid.tsx
    car-filters.tsx
    car-gallery.tsx
    car-specs.tsx
    car-price.tsx
    sort-select.tsx
  booking/
    booking-form.tsx
    booking-summary.tsx
    date-range-fields.tsx
    location-select.tsx
  account/
    booking-list.tsx
    booking-status-badge.tsx
    cancel-booking-button.tsx
  admin/
    stats-cards.tsx
    cars-table.tsx
    car-form.tsx
    bookings-table.tsx
    booking-status-form.tsx
    locations-table.tsx
  motion/
    fade-in.tsx              # exists → move here
    reveal-on-scroll.tsx
    stagger-children.tsx
    page-transition.tsx      # optional
  providers/
    theme-provider.tsx
    app-providers.tsx
  ui/                        # shadcn

lib/
  supabase/
    client.ts
    server.ts
    proxy.ts
    admin.ts                 # optional service-role server only (webhook updates if RLS blocks)
  paymongo/
    client.ts                # fetch wrappers, Basic auth
    checkout.ts              # createCheckoutSession(booking)
    webhooks.ts              # verify signature + parse events
    types.ts                 # Checkout Session / event types
  gsap.ts
  utils.ts
  auth/
    require-user.ts
    require-admin.ts
    get-session-profile.ts
  cars/
    queries.ts
    filters.ts
    pricing.ts
    availability.ts
  bookings/
    queries.ts
    actions-helpers.ts
    status.ts
    mark-paid.ts             # shared by webhook + success reconcile
  locations/queries.ts
  format/
    currency.ts              # PHP / centavos
    date.ts
  constants.ts
  validations/
    booking.ts
    auth.ts
    car.ts
    contact.ts
    profile.ts

types/
  database.ts                # generated or hand-written
  index.ts

supabase/
  migrations/
    001_extensions.sql
    ...
  seed.sql

docs/
  FULL-PLAN.md               # this file

hooks/
  use-media-query.ts
  use-reduced-motion.ts
```

---

## 9. Shared types & utilities

### Hand-written types (until `supabase gen types`)

```ts
// types/database.ts — mirror SQL enums + row shapes
export type Profile = { id: string; full_name: string | null; ... }
export type Car = { ... }
export type Booking = { ... }
export type Location = { ... }
export type CarWithImages = Car & { car_images: CarImage[] }
export type BookingWithRelations = Booking & {
  car: Pick<Car, "id" | "name" | "slug" | "hero_image_url">
  pickup_location: Pick<Location, "id" | "name" | "city">
  dropoff_location: Pick<Location, "id" | "name" | "city">
}
```

### Constants

```ts
// lib/constants.ts
export const MIN_RENTAL_DAYS = 1;
export const MAX_RENTAL_DAYS = 30;
export const CANCEL_MIN_HOURS_BEFORE_PICKUP = 24;
export const CHECKOUT_HOLD_MINUTES = 30;
export const SITE_NAME = "Aether Drive"; // rename brand
export const DEFAULT_CURRENCY = "PHP";
export const CAR_CLASSES = [...] as const;
```

### Pricing

```ts
// lib/cars/pricing.ts — all money ints are centavos
export function rentalDays(pickup: Date, dropoff: Date): number
export function quoteRental(dailyRateCentavos: number, pickup: Date, dropoff: Date): {
  rentalDays: number
  subtotalCents: number
  feesCents: number
  totalCents: number
}
export function formatMoney(centavos: number, currency = "PHP"): string
// e.g. formatMoney(250000) → "₱2,500.00"
```

### Filters (URL search params contract)

```
/cars?
  q=          // text search name/make/model
  class=suv   // multi: class=suv,luxury OR repeated
  transmission=automatic
  fuel=electric
  seats=5     // min seats
  minPrice=   // dollars or cents — pick dollars in UI, convert
  maxPrice=
  location=   // location slug or id
  from=       // ISO date
  to=
  sort=price_asc|price_desc|name|newest
  page=1
```

Server parses with a small `parseCarSearchParams(sp: URLSearchParams)` — never trust raw strings in queries.

### Validation (Zod recommended)

Install: `bun add zod`

Schemas for booking create, login, signup, contact, car form, profile update.

---

## 10. GSAP motion system

### Principles

1. All GSAP only inside `useGSAP` / client components.
2. Always pass **`scope: ref`**.
3. Respect reduced motion: if `prefers-reduced-motion: reduce`, skip animation or set duration 0.
4. Prefer opacity + transform (x/y/scale) — never animate layout width thrash.
5. One system: `components/motion/*` + `lib/gsap.ts`.

### Primitives to build

| Component | Behavior |
|-----------|----------|
| `FadeIn` | Mount fade + y (exists) |
| `RevealOnScroll` | ScrollTrigger once, fade/y |
| `StaggerChildren` | Children stagger on mount/scroll |
| `CountUp` | Optional stats numbers (admin/home) |

### Page-level motion map

| Page | Motion |
|------|--------|
| Home hero | Headline words / lines fade-up; search card delay |
| Featured cars | Stagger cards |
| How it works | Stagger steps on scroll |
| Fleet grid | Soft stagger on filter change (`revertOnUpdate`) |
| Car detail | Gallery fade; specs list stagger |
| Booking success | Subtle scale/fade confirmation |
| Admin | Minimal or none |

### ScrollTrigger

- Install registration once in `lib/gsap.ts` if used:

```ts
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(useGSAP, ScrollTrigger);
```

- Kill/revert via useGSAP cleanup automatically.

---

## 11. shadcn components to install

Install in batches as phases need them (don’t dump unused chrome early if you prefer lean; full list for the product):

```bash
# Navigation & overlays
npx shadcn@latest add sheet navigation-menu dropdown-menu avatar separator

# Forms
npx shadcn@latest add form field input label textarea select checkbox radio-group switch calendar popover

# Feedback & display
npx shadcn@latest add dialog alert-dialog alert badge table skeleton spinner sonner tooltip tabs accordion card button

# Admin extras
npx shadcn@latest add sidebar breadcrumb pagination scroll-area
```

Also:

```bash
bun add zod date-fns react-day-picker next-themes
# if using shadcn form with react-hook-form:
bun add react-hook-form @hookform/resolvers
```

**Toast:** `sonner` + `<Toaster />` in root providers.

---

## 12. Phase-by-phase implementation

Each phase is one implementable unit. Finish **Done when** before starting the next.

---

### Phase 0 — Foundations lock-in

**Goal:** Project conventions, env, providers, folder skeleton, brand constants.

**Tasks**

1. Confirm `.env.local` has working Supabase URL + publishable key **and** PayMongo placeholders (`PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`).
2. Create folders: `components/layout`, `components/motion`, `components/providers`, `lib/auth`, `lib/cars`, `lib/bookings`, `lib/paymongo`, `lib/format`, `lib/validations`, `types`, `supabase/migrations`, `app/actions`, `app/api/webhooks`.
3. Move `components/fade-in.tsx` → `components/motion/fade-in.tsx`; fix imports.
4. Add `lib/constants.ts` (include `DEFAULT_CURRENCY = "PHP"`, `CHECKOUT_HOLD_MINUTES = 30`), `lib/format/currency.ts` (en-PH), `lib/format/date.ts`.
5. Add `components/providers/theme-provider.tsx` + `app-providers.tsx` (ThemeProvider + Toaster).
6. Wrap root layout children with `AppProviders`.
7. Set site metadata title template: `%s · Aether Drive` (or your brand).
8. Add `zod` dependency.
9. Write empty `types/database.ts` with enums only (include `PaymentStatus`; fill in Phase 1).
10. Update `.env.example` with PayMongo keys documented.

**Files**

- `components/providers/*`
- `lib/constants.ts`
- `lib/format/*`
- `app/layout.tsx` (providers, metadata)
- `docs/FULL-PLAN.md` (reference)

**Done when**

- [x] `bun run build` passes
- [x] Theme toggle optional but providers mount without error
- [x] Folder skeleton exists
- [x] Env loads without proxy crash

---

### Phase 1 — Database + types + seed

**Goal:** Full schema live on Supabase; seed 3 locations + 8–12 cars; TypeScript types match.

**Tasks**

1. Create migration files `supabase/migrations/001`…`008` from §6–§7 (or paste SQL in dashboard in order).
2. Run migrations.
3. Run seed SQL (§13).
4. Promote your user to admin (after first signup, or insert manually).
5. Hand-write or generate types into `types/database.ts`.
6. Optional: `supabase gen types typescript --project-id … > types/database.ts`.

**Done when**

- [ ] Tables visible in Supabase Table Editor
- [ ] RLS enabled on all public tables
- [ ] Seed cars appear when querying as anon (published only)
- [ ] `car_is_available` function returns true for a free car
- [ ] Types compile

---

### Phase 2 — Site chrome (header/footer/layouts)

**Goal:** Every marketing page shares nav/footer; auth/admin shells exist as stubs.

**Tasks**

1. Install shadcn: `sheet`, `navigation-menu`, `dropdown-menu`, `avatar`, `separator`, `button` (exists), `sonner`.
2. Build `SiteHeader`:
   - Logo → `/`
   - Links: Fleet, Locations, About, Contact
   - CTA: “Book a car” → `/cars`
   - Auth: if logged out “Sign in”; if in Avatar menu (Account, Admin if role, Sign out)
3. Build `MobileNav` with Sheet.
4. Build `SiteFooter`: columns (Explore, Company, Legal), copyright.
5. `app/(marketing)/layout.tsx` wraps header/footer.
6. Move public pages under `(marketing)` route group (home can stay `app/page.tsx` or move inside group — **prefer** `app/(marketing)/page.tsx` and delete root page conflict carefully).
   - Next.js: only one `page.tsx` for `/`. Use either `app/page.tsx` importing marketing layout pieces OR route group without double page.
   - **Recommended:** keep `app/page.tsx` as home; wrap via root layout composition OR use `(marketing)` only for nested routes and share header in root for non-admin/auth.
   - **Cleaner recommended structure:**
     - Root layout: providers only
     - `(marketing)/layout.tsx`: header/footer
     - `(marketing)/page.tsx`: home
     - Delete old stack page content
7. Stub `(auth)/layout.tsx` centered.
8. Stub `admin/layout.tsx` with placeholder sidebar (guard later).

**Done when**

- [ ] Home shows real header/footer
- [ ] Mobile sheet works
- [ ] Nav links 404 until pages exist is OK for now OR add placeholder pages
- [ ] Build passes

---

### Phase 3 — Design tokens polish + empty states

**Goal:** Marketing-grade base styles; reusable Empty/Skeleton patterns.

**Tasks**

1. Install `skeleton`, `empty` (if available), `alert`.
2. Tweak `globals.css` only if needed (avoid drive-by); ensure body uses `font-sans`.
3. Create `components/ui` usage examples not required — just confirm tokens look good on dark/light.
4. Add `components/shared/empty-state.tsx` composing shadcn Empty or simple Card.

**Done when**

- [ ] Light/dark both readable
- [ ] Skeleton component available for catalogs

---

### Phase 4 — Data access layer (cars & locations)

**Goal:** Server-side query functions only — no UI yet beyond optional scripts.

**Tasks**

1. `lib/cars/queries.ts`:
   - `getPublishedCars(filters)`
   - `getCarBySlug(slug)`
   - `getFeaturedCars(limit)`
2. `lib/cars/filters.ts`: parse search params → filter object → Supabase query builder.
3. `lib/cars/pricing.ts`: rental days + quote + format.
4. `lib/cars/availability.ts`: wrap RPC `car_is_available` or client-side filter using bookings.
5. `lib/locations/queries.ts`: `getPublishedLocations()`, `getLocationBySlug()`.
6. Use `createClient` from `lib/supabase/server.ts` in all of the above.

**Done when**

- [ ] Temporary server component page or script can log cars
- [ ] Filters for class + price work in query layer
- [ ] Invalid slug returns null (not throw)

---

### Phase 5 — Home page (marketing)

**Goal:** Conversion-ready home replacing stack checklist.

**Sections (implement as components)**

1. `Hero` + `HeroSearch` (location select, date from/to, class optional) → GET `/cars?...`
2. `FeaturedCars` (from DB)
3. `HowItWorks` (static 3 steps)
4. `LocationsTeaser` (from DB)
5. `Testimonials` (static content in `lib/content/testimonials.ts`)
6. `CtaBand`

**Motion:** FadeIn / stagger on featured; hero entrance.

**Done when**

- [ ] Search navigates with correct query string
- [ ] Featured cars render from Supabase (fallback empty state if no env)
- [ ] Lighthouse-ish: images have sizes/priority on hero
- [ ] Build passes

---

### Phase 6 — Fleet catalog `/cars`

**Goal:** Filterable grid of cars.

**UI**

- Left filters (desktop) / Sheet filters (mobile): class, transmission, fuel, seats, price range, location
- Sort select
- Grid of `CarCard`: image, name, class badge, seats, transmission, daily price, CTA
- Pagination or “Load more” (start with page size 12)

**Data**

- Server Component reads `searchParams`, calls `getPublishedCars`
- If `from`+`to` present, filter to available cars only

**Motion:** Stagger cards; re-stagger on filter with keys

**Done when**

- [ ] All filters reflected in URL (shareable)
- [ ] Empty filter state shows Empty
- [ ] Card links to `/cars/[slug]` preserving dates in query if present
- [ ] Loading: use `loading.tsx` skeleton grid

---

### Phase 7 — Car detail `/cars/[slug]`

**Goal:** Desire + clarity + primary CTA.

**Sections**

1. Gallery (hero + thumbs) — `CarGallery`
2. Title, year, class badges
3. Price per day + estimated total if dates in query
4. Specs grid (seats, transmission, fuel, doors, luggage)
5. Features list
6. Description
7. Sticky bottom CTA on mobile: Book
8. “Included” fine print static

**Tasks**

1. `generateStaticParams` optional — prefer dynamic with revalidate
2. `generateMetadata` from car name/description
3. Not found → `notFound()`
4. Book button → `/cars/[slug]/book?from&to&pickup&dropoff`

**Done when**

- [ ] Unknown slug → 404
- [ ] Metadata title correct
- [ ] Dates from query show quote via pricing helper
- [ ] Images alt text set

---

### Phase 8 — Auth (login / signup / callback / guard)

**Goal:** Working email/password auth with profile row.

**Tasks**

1. Pages: `/login`, `/signup` with shadcn Field + Input + Button
2. Server actions or client `supabase.auth.signInWithPassword` / `signUp`
3. `app/auth/callback/route.ts` for email confirm / OAuth code exchange (`exchangeCodeForSession`)
4. `app/auth/signout/route.ts` POST
5. `lib/auth/require-user.ts` — redirect to `/login?next=`
6. `lib/auth/require-admin.ts`
7. `lib/auth/get-session-profile.ts` — user + profile role
8. Header reflects session (server-fetched profile in header via async component or client listener)
9. Proxy already refreshes session — verify with login

**UX**

- Show errors with Alert / toast
- After login redirect to `next` or `/account/bookings`

**Done when**

- [ ] Sign up creates auth user + profile
- [ ] Login works; sign out clears session
- [ ] Protected page redirects guests
- [ ] RLS: user reads own profile

---

### Phase 9 — Booking + PayMongo checkout

**Goal:** Authenticated user creates an unpaid booking, is sent to **PayMongo Checkout Session V2**, and can complete payment.

**Route:** `/cars/[slug]/book`

**Form fields**

- Pickup location (select)
- Dropoff location (select; default same)
- Pickup datetime
- Dropoff datetime
- Driver full name, phone, license
- Optional note
- Summary card: car, days, rate, **total ₱**, payment methods note (“Card, GCash, Maya, etc. via PayMongo”)

**Libs first (before UI)**

1. `lib/paymongo/client.ts` — `paymongoFetch(path, init)` with Basic auth (`Buffer.from(\`${secret}:\`).toString("base64")`).
2. `lib/paymongo/checkout.ts` — `createCheckoutSession({ bookingId, referenceCode, amountCentavos, description, successUrl, cancelUrl, customerEmail? })`.
3. `lib/paymongo/types.ts` — response shapes (`data.id`, `data.attributes.checkout_url`, …).
4. Read [Create Checkout Session V2](https://docs.paymongo.com/reference/create-a-checkout-v2) for current payload fields (`line_items` / `send_email_receipt` / `show_description` / `payment_method_types` as dashboard allows).

**Server action `createBookingAndCheckout`**

1. `requireUser()`
2. Validate with Zod
3. Load car; reject if not published / not `available`
4. RPC `car_is_available` (30‑min hold rules)
5. Compute quote from **DB** `daily_rate_cents` (centavos) — ignore client total
6. Insert booking:
   - `status = pending`
   - `payment_status = unpaid`
   - money snapshot fields
7. Call PayMongo create Checkout Session V2:
   - `amount` = `total_cents` (centavos)
   - `currency` = `PHP`
   - `description` = `Booking {reference_code} — {car name}`
   - `success_url` = `${APP_URL}/bookings/payment/success?booking_id={id}`
   - `cancel_url` = `${APP_URL}/bookings/payment/cancel?booking_id={id}`
   - Put `booking_id` / `reference_code` in metadata if API supports custom metadata/reference fields
8. Save `paymongo_checkout_session_id` on booking
9. **Redirect** to `checkout_url` (or return URL to client for `window.location`)
10. On PayMongo API failure: keep booking unpaid, return error + “retry pay” path

**UI**

- Primary CTA: **Pay with PayMongo** (not “Request booking”)
- Disable submit while creating session (`Spinner`)
- Show amount in ₱ clearly before redirect

**Done when**

- [ ] Guest redirected to login with return URL
- [ ] Overlapping booking rejected
- [ ] Total matches server math (centavos)
- [ ] Browser lands on PayMongo hosted checkout in test mode
- [ ] Booking row exists with `paymongo_checkout_session_id` and `unpaid`

---

### Phase 10 — PayMongo webhooks + payment success/cancel

**Goal:** Payment confirmation is **authoritative via webhook**; success page is UX only (+ optional reconcile).

**Webhook route:** `POST /api/webhooks/paymongo`

**Tasks**

1. `lib/paymongo/webhooks.ts`
   - Read raw body as text
   - Verify PayMongo signature header using `PAYMONGO_WEBHOOK_SECRET` (follow current PayMongo webhook security docs)
   - Parse event type + resource IDs
2. Handle at minimum:
   - `checkout_session.payment.paid` → resolve booking by `paymongo_checkout_session_id` (or metadata)
   - Optionally `payment.paid` / `payment.failed` as backup
3. `lib/bookings/mark-paid.ts` (idempotent):
   - If already `payment_status = paid`, return ok (no double side effects)
   - Set `payment_status = paid`, `status = confirmed`, `paid_at = now()`, `amount_paid_cents`, store `paymongo_payment_id` / intent id if present
   - Use **service role** client if RLS would block webhook (no user session) — `lib/supabase/admin.ts`
4. Always respond **2xx + JSON** quickly so PayMongo does not disable the webhook
5. Pages:
   - `/bookings/payment/success` — require user owns booking; show “Processing payment…” then poll or reconcile via retrieve Checkout Session; link to booking detail
   - `/bookings/payment/cancel` — explain unpaid hold; buttons **Pay again** / browse cars
6. Server action `retryCheckout(bookingId)` — only owner, only `unpaid`+`pending`, create new session, update `paymongo_checkout_session_id`, redirect
7. Local dev: use [PayMongo test webhooks](https://developers.paymongo.com) + tunnel (ngrok / Cloudflare Tunnel) pointing to `/api/webhooks/paymongo`

**Security**

- Reject invalid signatures with 400/401
- Never trust query params alone to mark paid
- Log event id; optional `webhook_events` table later for dedupe

**Done when**

- [ ] Test-mode payment marks booking `paid` + `confirmed` without manual admin
- [ ] Replaying same webhook does not corrupt state
- [ ] Cancel URL leaves booking unpaid; retry works
- [ ] Fake success URL without paying does **not** mark paid (unless reconcile proves paid via API)

---

### Phase 11 — Account area

**Goal:** Customers manage profile & bookings (including pay state).

**Pages**

1. `/account/bookings` — cards/table: status badge, **payment badge**, dates, car thumb, total ₱
2. `/account/bookings/[id]` — full detail, PayMongo reference, **Pay now** if unpaid, cancel button
3. `/account/profile` — update name, phone, license

**Cancel action**

- Allowed if:
  - `payment_status = unpaid` and `status = pending`, **or**
  - `payment_status = paid` / `status = confirmed` AND pickup_at > now + 24h
- Sets `status = cancelled`, `cancelled_at`, reason optional
- **Refunds (v1):** do not auto-refund via API — show copy “Contact support for refund” / admin refunds in PayMongo dashboard; optional later `payment.refunded` webhook → `payment_status = refunded`

**Done when**

- [ ] Cannot view others’ bookings (test second user)
- [ ] Unpaid booking shows Pay now
- [ ] Cancel rules enforced server-side
- [ ] Profile update persists

---

### Phase 12 — Admin dashboard

**Goal:** Staff can operate the business and see payment state.

**Guard:** `admin/layout.tsx` calls `requireAdmin()`.

**Pages**

1. `/admin` — stats: published cars, unpaid pending, paid/confirmed this week, **gross paid revenue (sum amount_paid_cents)**
2. `/admin/bookings` — table: status, payment_status, PayMongo session id (truncated), filters
3. `/admin/bookings/[id]` — change operational status, admin note, display payment fields (read-only)
4. `/admin/cars` — table, published toggle, link edit
5. `/admin/cars/new` + `edit` — form fields matching schema (rates in ₱; store centavos)
6. `/admin/locations` — simple CRUD list/form

**Done when**

- [ ] Non-admin gets redirected (not 500)
- [ ] Admin sees paid vs unpaid clearly
- [ ] Admin can unpublish car; it disappears from `/cars`
- [ ] Create car with slug works; collision error handled
- [ ] Admin does **not** need to manually “confirm” after successful PayMongo pay (webhook already did)

---

### Phase 13 — Locations + content pages

**Goal:** Finish public IA (Philippines-first copy ok).

**Tasks**

1. `/locations` grid from DB
2. Optional `/locations/[slug]` with map link + cars at location
3. `/about` — brand story static
4. `/contact` — form → `contact_messages` insert + toast
5. `/faq` — include payment FAQs (PayMongo methods, refunds policy)
6. `/terms`, `/privacy` — placeholder legal + payment terms disclaimer

**Done when**

- [ ] Contact inserts row visible to admin (SQL or later admin UI)
- [ ] All footer links resolve

---

### Phase 14 — Motion polish + microinteractions

**Goal:** Cohesive premium feel without jank.

**Tasks**

1. `RevealOnScroll` on home sections
2. Fleet grid stagger with `revertOnUpdate` when searchParams change
3. Header scroll state (optional)
4. Payment success micro-animation (subtle FadeIn checkmark) — client only
5. Audit `prefers-reduced-motion`
6. Fix hydration warnings from motion

**Done when**

- [ ] Reduced motion: no large transforms
- [ ] No ScrollTrigger leaks
- [ ] 60fps on mid laptop for home

---

### Phase 15 — Image pipeline

**Goal:** Real photos, not broken URLs.

**Tasks**

1. Create Storage bucket `car-images` + policies
2. Seed with Unsplash/Pexels URLs **or** `/public/cars/*`
3. `next/image` remotePatterns for Supabase + image CDNs
4. Admin form: paste URL first
5. Blur placeholder optional

**Done when**

- [ ] All seed cars show images in grid/detail
- [ ] No next/image domain errors

---

### Phase 16 — Hardening, edge cases, copy

**Goal:** Production-shaped template with safe payments.

**Tasks**

1. Error boundaries: `app/error.tsx`, `admin/error.tsx`
2. `not-found.tsx` branded
3. Contact honeypot optional
4. Timezone: store UTC; display Asia/Manila for PH product
5. Min/max rental validation UI + server
6. Disable book when maintenance
7. SEO: sitemap, robots (disallow admin/account); **do not** index payment return URLs if possible
8. README: Supabase + **PayMongo test keys** + webhook tunnel + seed + promote admin
9. Expire stale unpaid bookings: optional cron / on-read mark `payment_status=expired` when hold elapsed
10. Ensure webhook route excluded from auth redirects in proxy matcher if needed

**Done when**

- [ ] Double-submit doesn’t create duplicate paid bookings easily
- [ ] Webhook secret required in production
- [ ] README covers PayMongo test cards / GCash test flow per PayMongo docs
- [ ] Build passes with all env documented

---

### Phase 17 — QA pass (manual)

Run the [Testing matrix](#16-testing-matrix) end-to-end including **PayMongo test payments**. Fix bugs before calling v1 done.

---

## 13. Seed data

### Locations (example — PH)

| slug | name | city |
|------|------|------|
| mnl-naia-t3 | NAIA Terminal 3 | Pasay |
| bgc-hub | BGC Pickup Hub | Taguig |
| ceb-airport | Mactan-Cebu Airport | Lapu-Lapu |

### Cars (example set — 10)

Aim for class variety; rates in **centavos** (e.g. `250000` = ₱2,500/day):

1. economy — Toyota Vios (~₱1,800–2,500/day)  
2. compact — Honda City  
3. sedan — Toyota Camry  
4. suv — Toyota Fortuner  
5. suv — Mitsubishi Montero Sport  
6. luxury — BMW 5 Series  
7. luxury — Mercedes-Benz E-Class  
8. sports — Ford Mustang  
9. sports — Porsche 911 (high centavos)  
10. van — Toyota Hiace  

Each: unique slug, `currency = PHP`, features array, hero_image_url, `is_published=true`, `status=available`, default_location_id set.

### Seed SQL sketch

```sql
-- supabase/seed.sql
insert into public.locations (slug, name, city, country, is_published, sort_order)
values
  ('mnl-naia-t3', 'NAIA Terminal 3', 'Pasay', 'PH', true, 1),
  ('bgc-hub', 'BGC Pickup Hub', 'Taguig', 'PH', true, 2),
  ('ceb-airport', 'Mactan-Cebu Airport', 'Lapu-Lapu', 'PH', true, 3);

-- insert cars with daily_rate_cents in centavos, currency 'PHP' ...
```

Also seed 2–3 `car_images` per featured car for gallery.

---

## 14. Payments — PayMongo (v1 required)

### Why PayMongo

Philippines-native PSP: cards, e-wallets (GCash, Maya, etc.), and **hosted Checkout** so PCI burden stays with PayMongo. Fits a car rental template selling in **PHP**.

### Product choice (locked)

| Choice | Decision |
|--------|----------|
| Integration | **Checkout Session V2** (hosted page) — not custom card Elements for v1 |
| When charge | Full rental **total** at booking time (not deposit-only) |
| Currency | **PHP** only in v1 |
| Amount unit | Integer **centavos** everywhere (DB + API) |
| Confirm booking | Webhook `checkout_session.payment.paid` → `payment_status=paid`, `status=confirmed` |
| Success URL | UX + optional API reconcile; **not** source of truth alone |
| Refunds | Manual in PayMongo dashboard for v1; optional webhook later |
| Test vs live | `sk_test_` / `pk_test_` until go-live; switch env only |

Docs entry points:

- [Checkout Session V2 create](https://docs.paymongo.com/reference/create-a-checkout-v2)  
- [Webhooks](https://docs.paymongo.com/docs/webhooks)  
- [Developers guide](https://developers.paymongo.com)

> Checkout V2 defers Payment Intent creation until the customer pays on the hosted page. **Persist the Checkout Session ID** on the booking. Prefer event **`checkout_session.payment.paid`**.

### Sequence diagram (text)

```
Customer          Next.js app              PayMongo           Supabase
   |                   |                      |                  |
   | submit book form  |                      |                  |
   |------------------>|                      |                  |
   |                   | insert unpaid booking|                  |
   |                   |---------------------------------------->|
   |                   | create Checkout Session V2              |
   |                   |--------------------->|                  |
   |                   | store session id     |                  |
   |                   |---------------------------------------->|
   | redirect checkout |                      |                  |
   |<------------------|                      |                  |
   | pay on hosted UI  |                      |                  |
   |----------------------------------------->|                  |
   |                   |   webhook paid       |                  |
   |                   |<---------------------|                  |
   |                   | mark paid+confirmed  |                  |
   |                   |---------------------------------------->|
   | success_url       |                      |                  |
   |------------------>| optional retrieve    |                  |
   | booking detail    |                      |                  |
```

### `lib/paymongo/client.ts` sketch

```ts
const secret = process.env.PAYMONGO_SECRET_KEY!;
const auth = Buffer.from(`${secret}:`).toString("base64");

export async function paymongoFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`https://api.paymongo.com${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.detail ?? "PayMongo request failed");
  }
  return json as T;
}
```

### Create Checkout Session (conceptual payload)

Exact attribute names can change — **verify against current OpenAPI** when implementing. Conceptual shape:

```ts
await paymongoFetch("/v1/checkout_sessions", {
  method: "POST",
  body: JSON.stringify({
    data: {
      attributes: {
        send_email_receipt: true,
        show_description: true,
        show_line_items: true,
        description: `Booking ${referenceCode}`,
        line_items: [
          {
            amount: totalCentavos, // e.g. 750000 = ₱7,500.00
            currency: "PHP",
            name: carName,
            quantity: 1,
            description: `${rentalDays} day(s) · ${referenceCode}`,
          },
        ],
        payment_method_types: ["card", "gcash", "paymaya", "grab_pay"], // enable what account supports
        success_url: `${appUrl}/bookings/payment/success?booking_id=${bookingId}`,
        cancel_url: `${appUrl}/bookings/payment/cancel?booking_id=${bookingId}`,
        // metadata / reference_number if supported — store booking_id
      },
    },
  }),
});
// persist data.id → bookings.paymongo_checkout_session_id
// redirect data.attributes.checkout_url
```

### Webhook handler responsibilities

1. Verify signature with `PAYMONGO_WEBHOOK_SECRET`.  
2. Switch on `data.attributes.type` (or equivalent event name field).  
3. On `checkout_session.payment.paid`:
   - Find booking by checkout session id  
   - Idempotent `markBookingPaid`  
4. Return `{ received: true }` with HTTP 200–209.  
5. On failure after retries PayMongo may **disable** the webhook — monitor dashboard.

### Failure & edge cases

| Case | Handling |
|------|----------|
| User closes PayMongo tab | Booking stays unpaid; hold expires after 30m; Pay again |
| Webhook delayed | Success page retrieves session via API; if paid, mark paid |
| Webhook never arrives | Admin sees unpaid; “Reconcile” button optional (retrieve session) |
| Double webhook | Idempotent update by payment_status |
| Amount mismatch | Prefer PayMongo paid amount; flag if ≠ `total_cents` |
| Partial payment | Not supported in v1 |
| Refund | Admin dashboard PayMongo; set `refunded` manually or via webhook later |

### What not to build in v1

- Subscriptions  
- Split / Connect multi-merchant  
- Saving cards on file  
- Custom card form (Elements) unless Checkout is insufficient  
- Auto-refund on cancel  

---

## 15. SEO, a11y, performance

### SEO

- Unique `<title>` + meta description per car (`generateMetadata`)
- Semantic headings one `h1` per page
- `sitemap.ts` for static + cars slugs
- `robots.ts` allow public; disallow `/admin`, `/account`
- JSON-LD `Product` or `AutoRental` optional on car detail

### A11y

- Focus rings visible (shadcn default)
- Dialog/Sheet titles required
- Form labels on every control
- Color contrast on badges
- Motion reduced path
- Alt text on car images

### Performance

- Server Components by default; client only for forms/motion/filters that need it
- `next/image` for all photos
- Avoid shipping GSAP on admin routes if easy (dynamic import motion only on marketing)
- Catalog filters: keep server-driven for v1 (no huge client car dump)

---

## 16. Testing matrix

### Manual

| # | Case | Expected |
|---|------|----------|
| 1 | Visit `/` without env | No crash; empty/feature flags OK |
| 2 | Visit `/` with seed | Featured cars show; prices ₱ |
| 3 | Filter `/cars?class=suv` | Only SUVs |
| 4 | Open car detail | Specs + ₱ price |
| 5 | Book while logged out | Redirect login, return |
| 6 | Book available car | Unpaid pending + redirect PayMongo test checkout |
| 7 | Complete test payment | Webhook → `paid` + `confirmed` |
| 8 | Open success URL without paying | Still unpaid (unless API reconcile proves paid) |
| 9 | Cancel checkout URL | Unpaid; Pay again works |
| 10 | Book overlapping dates (held/paid) | Error, no row |
| 11 | Unpaid hold expires (31+ min) | Car bookable again |
| 12 | Customer cancel unpaid | Cancelled, inventory free |
| 13 | Customer cancel paid &lt;24h | Rejected |
| 14 | Customer cancel paid ≥24h | Cancelled; refund manual note |
| 15 | Replay webhook | Idempotent; still single paid state |
| 16 | Invalid webhook signature | 4xx; booking unchanged |
| 17 | Unpublish car | Gone from catalog |
| 18 | Non-admin `/admin` | Redirect home |
| 19 | Second user cannot open first user’s booking URL | Forbidden/not found |
| 20 | Contact form | Row in contact_messages |
| 21 | Mobile nav | All links reachable |
| 22 | Reduced motion OS setting | No large animations |

### Automated (optional Phase 17.1)

- Vitest unit: `rentalDays`, `quoteRental`, filter parser, cancel eligibility, hold window
- Playwright: login + create booking + mock PayMongo (or test mode smoke)

```bash
bun add -d vitest @types/node
# bun add -d playwright @playwright/test
```

---

## 17. Deployment checklist

1. Push to GitHub  
2. Vercel project; framework Next.js  
3. Env: Supabase URL + publishable key  
4. Env: `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL` (production URL)  
5. PayMongo Dashboard: create webhook → `https://your-domain/api/webhooks/paymongo`  
   - Events: at least `checkout_session.payment.paid` (add `payment.paid` / `payment.failed` if desired)  
6. Switch PayMongo keys from **test → live** only after end-to-end test  
7. Supabase Auth URL config: production site URL + `/auth/callback`  
8. Run migrations on prod project  
9. Seed prod  
10. Promote admin user  
11. `next.config.ts` remote image hosts  
12. Smoke test **live** booking with small amount if possible  
13. Optional: Supabase email templates branded  

---

## 18. Definition of done (whole product)

v1 is done when:

1. Visitor can discover fleet and open a car detail with good visuals and **₱** pricing.  
2. Authenticated user can create a booking and **pay via PayMongo Checkout** with server-side price & availability checks.  
3. Webhook (or verified reconcile) marks booking **paid + confirmed**.  
4. User can view bookings, retry unpaid payment, and cancel when eligible.  
5. Admin can manage fleet and see payment state / revenue; no need to manually confirm after successful pay.  
6. Auth works with SSR cookie session (proxy).  
7. Secrets never exposed client-side; webhook signatures verified.  
8. UI is shadcn-consistent; key marketing moments use GSAP responsibly.  
9. `bun run build` succeeds; README explains Supabase **and** PayMongo setup.  
10. RLS prevents cross-user data leaks.

---

## 19. Open product decisions (defaults locked)

These are **locked for implementation** so you don’t stall. Change only intentionally.

| Decision | Default |
|----------|---------|
| Brand name | **Aether Drive** (change in `lib/constants.ts`) |
| Currency | **PHP**, integer **centavos** (`*_cents` columns) |
| Payments | **PayMongo Checkout Session V2** (hosted) |
| Booking model | Create unpaid booking → pay → webhook confirms |
| Charge amount | Full rental total at checkout |
| Same car multi-booking | Blocked by overlap + 30m unpaid hold |
| Pickup ≠ dropoff | Allowed |
| Min age / license rules | Copy only (“25+”), not enforced in DB |
| Image hosting | URL strings + public bucket later |
| i18n | English only (₱ formatting en-PH) |
| Default market | Philippines (locations seed PH) |
| Map provider | External Google Maps link, no embedded SDK |
| Admin UI | Internal routes, not separate app |
| Refunds | Manual PayMongo dashboard in v1 |
| Email notifications | Out of scope v1 (PayMongo receipt email optional flag) |

---

## 20. Phase index (quick checklist)

Copy this into an issue tracker or tick here:

- [x] **P0** Foundations (folders, providers, constants, zod, PayMongo env stubs)
- [x] **P1** DB schema + RLS + seed + types (**payment_status**, PayMongo columns)
- [x] **P2** Header / footer / layouts
- [x] **P3** Tokens / empty / skeleton
- [x] **P4** Query layer (cars, locations, pricing, availability + hold)
- [x] **P5** Home page
- [x] **P6** Fleet catalog
- [x] **P7** Car detail
- [x] **P8** Auth
- [x] **P9** Booking create + PayMongo Checkout redirect
- [x] **P10** PayMongo webhooks + success/cancel + retry pay
- [x] **P11** Account bookings + profile
- [x] **P12** Admin (payment-aware)
- [x] **P13** Locations + static/content pages
- [x] **P14** Motion polish (FadeIn + reduced motion; expand later as needed)
- [x] **P15** Images / storage / next.config
- [x] **P16** Hardening + SEO + README (PayMongo)
- [x] **P17** Local Supabase verification (home/fleet/auth/booking) — PayMongo live pay still needs keys

---

## Appendix A — Server action sketch (booking + PayMongo)

```ts
// app/actions/bookings.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-user";
import { bookingCreateSchema } from "@/lib/validations/booking";
import { quoteRental } from "@/lib/cars/pricing";
import { createCheckoutSession } from "@/lib/paymongo/checkout";

export async function createBookingAndCheckout(input: unknown) {
  const user = await requireUser();
  const parsed = bookingCreateSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid booking details." };

  const supabase = await createClient();
  const { carId, pickupAt, dropoffAt, ...rest } = parsed.data;

  const { data: car } = await supabase
    .from("cars")
    .select("id, name, daily_rate_cents, currency, is_published, status")
    .eq("id", carId)
    .single();

  if (!car || !car.is_published || car.status !== "available") {
    return { error: "This car is not available to book." };
  }

  const { data: ok } = await supabase.rpc("car_is_available", {
    p_car_id: carId,
    p_pickup: pickupAt,
    p_dropoff: dropoffAt,
  });

  if (!ok) return { error: "Those dates are not available for this car." };

  // quote amounts are centavos; currency PHP
  const quote = quoteRental(
    car.daily_rate_cents,
    new Date(pickupAt),
    new Date(dropoffAt)
  );

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      customer_id: user.id,
      car_id: carId,
      pickup_at: pickupAt,
      dropoff_at: dropoffAt,
      daily_rate_cents: car.daily_rate_cents,
      rental_days: quote.rentalDays,
      subtotal_cents: quote.subtotalCents,
      fees_cents: quote.feesCents,
      total_cents: quote.totalCents,
      currency: "PHP",
      status: "pending",
      payment_status: "unpaid",
      ...rest,
    })
    .select("id, reference_code, total_cents")
    .single();

  if (error || !booking) return { error: "Could not create booking." };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const session = await createCheckoutSession({
    bookingId: booking.id,
    referenceCode: booking.reference_code,
    amountCentavos: booking.total_cents,
    carName: car.name,
    rentalDays: quote.rentalDays,
    successUrl: `${appUrl}/bookings/payment/success?booking_id=${booking.id}`,
    cancelUrl: `${appUrl}/bookings/payment/cancel?booking_id=${booking.id}`,
  });

  await supabase
    .from("bookings")
    .update({ paymongo_checkout_session_id: session.id })
    .eq("id", booking.id);

  redirect(session.checkoutUrl);
}
```

---

## Appendix B — URL state examples

```
/cars?class=suv&class=luxury&from=2026-08-01&to=2026-08-05&sort=price_asc
/cars/porsche-911-carrera?from=2026-08-01&to=2026-08-05&pickup=sfo-airport
/cars/porsche-911-carrera/book?from=2026-08-01&to=2026-08-05&pickup=sfo-airport&dropoff=sf-downtown
/login?next=%2Fcars%2Fporsche-911-carrera%2Fbook%3Ffrom%3D2026-08-01
```

---

## Appendix C — Component inventory (build order)

| Order | Component | Phase |
|------:|-----------|------:|
| 1 | AppProviders, ThemeProvider | 0 |
| 2 | SiteHeader, SiteFooter, MobileNav | 2 |
| 3 | FadeIn, RevealOnScroll, StaggerChildren | 0/13 |
| 4 | Hero, HeroSearch | 5 |
| 5 | CarCard, CarGrid, CarFilters | 6 |
| 6 | CarGallery, CarSpecs, CarPrice | 7 |
| 7 | LoginForm, SignupForm | 8 |
| 8 | BookingForm, BookingSummary (₱ + Pay CTA) | 9 |
| 9 | Payment success/cancel pages | 10 |
| 10 | BookingStatusBadge, PaymentStatusBadge, BookingList | 11 |
| 11 | AdminShell, StatsCards, tables, CarForm | 12 |
| 12 | ContactForm, FaqAccordion | 13 |

---

## Appendix D — Anti-patterns to avoid

- Client-side price as source of truth  
- Marking booking **paid** from success URL without PayMongo API/webhook verification  
- Exposing `PAYMONGO_SECRET_KEY` or webhook secret to the client  
- `getSession()` alone for authorization on server  
- GSAP in Server Components  
- `space-y-*` in new shadcn layouts (use `flex flex-col gap-*`)  
- Raw `bg-blue-500` instead of tokens  
- Admin mutations without `requireAdmin`  
- Storing money as float or mixing pesos and centavos  
- Sending pesos to PayMongo `amount` (must be **centavos**)  
- Forgetting snapshot of `daily_rate_cents` on booking  
- Holding inventory forever on abandoned checkouts (must expire unpaid holds)  
- Blocking entire site when Supabase/PayMongo env empty (graceful empty states)

---

## Appendix E — Suggested daily cadence

If implementing solo:

| Day | Phases |
|-----|--------|
| 1 | P0–P1 |
| 2 | P2–P4 |
| 3 | P5–P7 |
| 4 | P8–P9 (book + PayMongo redirect) |
| 5 | P10 webhooks + P11 account |
| 6 | P12 admin + P13 content |
| 7 | P14–P17 polish + payment QA |

---

## Appendix F — PayMongo env checklist

```bash
# .env.local / Vercel
PAYMONGO_SECRET_KEY=sk_test_xxxxxxxx
PAYMONGO_WEBHOOK_SECRET=whsk_xxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
# optional if you ever use client-side PayMongo.js:
# NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_xxxxxxxx
```

Local webhook: `cloudflared tunnel --url http://localhost:3000` → register  
`https://<tunnel>/api/webhooks/paymongo` in PayMongo test dashboard.

---

*End of full plan. Start at **Phase 0**. When a phase is complete, tick it in §20 and open a clean commit before the next phase. Payments are **PayMongo**, not Stripe.*
