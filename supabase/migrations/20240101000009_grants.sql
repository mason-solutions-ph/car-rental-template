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
