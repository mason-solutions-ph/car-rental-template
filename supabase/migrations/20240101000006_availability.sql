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
