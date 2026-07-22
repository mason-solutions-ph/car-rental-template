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
