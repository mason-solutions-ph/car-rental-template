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
