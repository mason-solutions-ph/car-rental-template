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
