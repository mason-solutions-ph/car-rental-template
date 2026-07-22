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
