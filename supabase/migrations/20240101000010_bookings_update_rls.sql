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
