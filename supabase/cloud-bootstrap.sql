-- Aether Drive cloud bootstrap (migrations + seed)
-- Run once in Supabase Dashboard → SQL Editor → New query → Run

-- ========== 20240101000001_extensions.sql ==========
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ========== 20240101000002_profiles.sql ==========
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


-- ========== 20240101000003_locations.sql ==========
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
  hours_note text,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger locations_set_updated_at
before update on public.locations
for each row execute function public.set_updated_at();


-- ========== 20240101000004_cars.sql ==========
create type public.car_status as enum ('available', 'maintenance', 'retired');
create type public.car_class as enum (
  'economy', 'compact', 'sedan', 'suv', 'luxury', 'sports', 'van'
);
create type public.transmission as enum ('automatic', 'manual');
create type public.fuel_type as enum ('gasoline', 'diesel', 'hybrid', 'electric');

create table public.cars (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  make text not null,
  model text not null,
  trim text,
  year int not null check (year >= 1990 and year <= 2100),
  class public.car_class not null,
  transmission public.transmission not null default 'automatic',
  fuel_type public.fuel_type not null default 'gasoline',
  seats int not null default 5 check (seats > 0 and seats <= 15),
  doors int not null default 4 check (doors > 0 and doors <= 6),
  luggage_capacity int,
  daily_rate_cents int not null check (daily_rate_cents > 0),
  currency text not null default 'PHP',
  description text,
  features text[] not null default '{}',
  hero_image_url text,
  status public.car_status not null default 'available',
  is_published boolean not null default false,
  default_location_id uuid references public.locations (id) on delete set null,
  mileage_limit_per_day int,
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


-- ========== 20240101000005_bookings.sql ==========
create type public.booking_status as enum (
  'pending', 'confirmed', 'active', 'completed', 'cancelled'
);

create type public.payment_status as enum (
  'unpaid', 'paid', 'failed', 'refunded', 'expired'
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  customer_id uuid not null references public.profiles (id) on delete restrict,
  car_id uuid not null references public.cars (id) on delete restrict,
  pickup_location_id uuid not null references public.locations (id),
  dropoff_location_id uuid not null references public.locations (id),
  pickup_at timestamptz not null,
  dropoff_at timestamptz not null,
  status public.booking_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  daily_rate_cents int not null,
  rental_days int not null check (rental_days >= 1),
  subtotal_cents int not null,
  fees_cents int not null default 0,
  total_cents int not null,
  currency text not null default 'PHP',
  paymongo_checkout_session_id text unique,
  paymongo_payment_intent_id text,
  paymongo_payment_id text,
  paid_at timestamptz,
  amount_paid_cents int,
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


-- ========== 20240101000006_availability.sql ==========
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


-- ========== 20240101000007_contact.sql ==========
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);


-- ========== 20240101000008_rls.sql ==========
alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.cars enable row level security;
alter table public.car_images enable row level security;
alter table public.bookings enable row level security;
alter table public.contact_messages enable row level security;

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
  and role = (select p.role from public.profiles p where p.id = auth.uid())
);

create policy "profiles_admin_all"
on public.profiles for all
using (public.is_admin());

-- LOCATIONS
create policy "locations_public_read"
on public.locations for select
using (is_published = true or public.is_admin());

create policy "locations_admin_write"
on public.locations for all
using (public.is_admin())
with check (public.is_admin());

-- CARS
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

-- CAR IMAGES
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

create policy "bookings_update_own_or_admin"
on public.bookings for update
using (customer_id = auth.uid() or public.is_admin())
with check (customer_id = auth.uid() or public.is_admin());

create policy "bookings_admin_all"
on public.bookings for all
using (public.is_admin())
with check (public.is_admin());

-- CONTACT
create policy "contact_insert_anon"
on public.contact_messages for insert
with check (true);

create policy "contact_admin_read"
on public.contact_messages for select
using (public.is_admin());


-- ========== 20240101000009_grants.sql ==========
-- Expose tables to API roles (required when auto_expose_new_tables is off)
grant usage on schema public to postgres, anon, authenticated, service_role;

grant select on table public.locations to anon, authenticated;
grant select on table public.cars to anon, authenticated;
grant select on table public.car_images to anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select, insert, update on table public.bookings to authenticated;
grant insert on table public.contact_messages to anon, authenticated;
grant select on table public.contact_messages to authenticated;

-- Admin / service role full access (RLS still applies unless bypassed)
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- Future tables
alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant all on tables to service_role;


-- ========== 20240101000010_bookings_update_rls.sql ==========
-- Tighten customer booking updates: no self-confirm of payment.
-- Checkout session id is written via service-role admin client in app code.
-- Admin retains full access via bookings_admin_all.

drop policy if exists "bookings_update_own_or_admin" on public.bookings;

create policy "bookings_customer_cancel_update"
on public.bookings for update
to authenticated
using (
  customer_id = auth.uid()
  and status in ('pending', 'confirmed')
)
with check (
  customer_id = auth.uid()
  and status = 'cancelled'
  and payment_status = (
    select b.payment_status from public.bookings b where b.id = bookings.id
  )
);


-- ========== seed.sql ==========
-- Run after migrations. Fixed UUIDs for easy reference.
-- Locations
insert into public.locations (id, slug, name, city, region, country, address_line1, hours_note, is_published, sort_order) values
  ('11111111-1111-4111-8111-111111111111', 'mnl-naia-t3', 'NAIA Terminal 3', 'Pasay', 'Metro Manila', 'PH', 'Andrews Ave', 'Daily 6am–10pm', true, 1),
  ('22222222-2222-4222-8222-222222222222', 'bgc-hub', 'BGC Pickup Hub', 'Taguig', 'Metro Manila', 'PH', '26th St cor 7th Ave', 'Daily 8am–8pm', true, 2),
  ('33333333-3333-4333-8333-333333333333', 'ceb-airport', 'Mactan-Cebu Airport', 'Lapu-Lapu', 'Cebu', 'PH', 'Airport Rd', 'Daily 7am–9pm', true, 3);

-- Cars (daily_rate_cents = centavos)
insert into public.cars (
  id, slug, name, make, model, year, class, transmission, fuel_type, seats, doors,
  luggage_capacity, daily_rate_cents, currency, description, features, hero_image_url,
  status, is_published, default_location_id
) values
  (
    'a0000000-0000-4000-8000-000000000001', 'toyota-vios', 'Toyota Vios 1.3 E', 'Toyota', 'Vios', 2024, 'economy', 'automatic', 'gasoline', 5, 4, 2,
    180000, 'PHP', 'Reliable city hatch-sedan for daily drives and airport runs.',
    array['Bluetooth','USB','Rear camera'],
    'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1200&q=80',
    'available', true, '11111111-1111-4111-8111-111111111111'
  ),
  (
    'a0000000-0000-4000-8000-000000000002', 'honda-city', 'Honda City RS', 'Honda', 'City', 2024, 'compact', 'automatic', 'gasoline', 5, 4, 2,
    220000, 'PHP', 'Sporty compact sedan with strong fuel economy.',
    array['Apple CarPlay','Android Auto','Cruise control'],
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80',
    'available', true, '22222222-2222-4222-8222-222222222222'
  ),
  (
    'a0000000-0000-4000-8000-000000000003', 'toyota-camry', 'Toyota Camry 2.5V', 'Toyota', 'Camry', 2023, 'sedan', 'automatic', 'hybrid', 5, 4, 3,
    350000, 'PHP', 'Comfortable executive sedan for longer trips.',
    array['Hybrid','Leather seats','Sunroof'],
    'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=1200&q=80',
    'available', true, '11111111-1111-4111-8111-111111111111'
  ),
  (
    'a0000000-0000-4000-8000-000000000004', 'toyota-fortuner', 'Toyota Fortuner G', 'Toyota', 'Fortuner', 2024, 'suv', 'automatic', 'diesel', 7, 5, 4,
    450000, 'PHP', '7-seater SUV ready for family road trips.',
    array['4x4','Third row','Push start'],
    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&q=80',
    'available', true, '22222222-2222-4222-8222-222222222222'
  ),
  (
    'a0000000-0000-4000-8000-000000000005', 'mitsubishi-montero', 'Mitsubishi Montero Sport', 'Mitsubishi', 'Montero Sport', 2023, 'suv', 'automatic', 'diesel', 7, 5, 4,
    420000, 'PHP', 'Rugged midsize SUV with confident road presence.',
    array['Diesel','Roof rails','Parking sensors'],
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80',
    'available', true, '33333333-3333-4333-8333-333333333333'
  ),
  (
    'a0000000-0000-4000-8000-000000000006', 'bmw-5-series', 'BMW 520i', 'BMW', '5 Series', 2023, 'luxury', 'automatic', 'gasoline', 5, 4, 3,
    850000, 'PHP', 'Executive luxury sedan with refined dynamics.',
    array['Leather','Nav','Premium audio'],
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80',
    'available', true, '22222222-2222-4222-8222-222222222222'
  ),
  (
    'a0000000-0000-4000-8000-000000000007', 'mercedes-e-class', 'Mercedes-Benz E 200', 'Mercedes-Benz', 'E-Class', 2023, 'luxury', 'automatic', 'gasoline', 5, 4, 3,
    900000, 'PHP', 'Iconic luxury sedan for airport transfers and events.',
    array['Ambient lighting','MBUX','Driver assist'],
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=80',
    'available', true, '11111111-1111-4111-8111-111111111111'
  ),
  (
    'a0000000-0000-4000-8000-000000000008', 'ford-mustang', 'Ford Mustang EcoBoost', 'Ford', 'Mustang', 2022, 'sports', 'automatic', 'gasoline', 4, 2, 2,
    750000, 'PHP', 'American muscle coupe for weekend thrills.',
    array['Sport mode','Leather','Sync 3'],
    'https://images.unsplash.com/photo-1584345604476-8ec5f82d4963?w=1200&q=80',
    'available', true, '22222222-2222-4222-8222-222222222222'
  ),
  (
    'a0000000-0000-4000-8000-000000000009', 'porsche-911', 'Porsche 911 Carrera', 'Porsche', '911', 2022, 'sports', 'automatic', 'gasoline', 4, 2, 1,
    1500000, 'PHP', 'Timeless sports icon. Limited availability.',
    array['PDK','Sport Chrono','Premium sound'],
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80',
    'available', true, '22222222-2222-4222-8222-222222222222'
  ),
  (
    'a0000000-0000-0000-0000-000000000010', 'toyota-hiace', 'Toyota Hiace Commuter', 'Toyota', 'Hiace', 2023, 'van', 'manual', 'diesel', 15, 4, 6,
    500000, 'PHP', 'Group transport for tours and corporate shuttles.',
    array['High roof','Dual AC','Diesel'],
    'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=1200&q=80',
    'available', true, '11111111-1111-4111-8111-111111111111'
  );

insert into public.car_images (car_id, url, alt, sort_order)
select id, hero_image_url, name, 0 from public.cars where is_published = true;

-- Extra gallery angles for a few featured cars (demo marketing)
insert into public.car_images (car_id, url, alt, sort_order) values
  ('a0000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=80', 'Toyota Vios detail', 1),
  ('a0000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80', 'Toyota Vios rear', 2),
  ('a0000000-0000-4000-8000-000000000004', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80', 'Fortuner angle', 1),
  ('a0000000-0000-4000-8000-000000000006', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=80', 'BMW cabin / exterior', 1),
  ('a0000000-0000-4000-8000-000000000009', 'https://images.unsplash.com/photo-1584345604476-8ec5f82d4963?w=1200&q=80', '911 side profile', 1);


