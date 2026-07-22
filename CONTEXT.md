# Aether Drive

Premium single-fleet car rental: browse, book, pay (PayMongo), and light admin ops.

## Language

**Booking**:
A rental reservation for one car over a pickup–dropoff range. Tracked on two axes: operational status and payment status.
_Avoid_: Order, reservation (except UI copy), trip

**Operational status**:
Where the rental sits operationally: pending, confirmed, active, completed, or cancelled.
_Avoid_: Booking state (ambiguous with payment), phase

**Payment status**:
Whether money settled: unpaid, paid, failed, refunded, or expired.
_Avoid_: Payment state, checkout status

**Checkout hold**:
The short window in which a pending unpaid Booking blocks the car from other renters.
_Avoid_: Lock, soft lock, inventory reservation (alone)

**Expire unpaid**:
Ending a checkout hold by marking payment status expired when the hold window has elapsed.
_Avoid_: Timeout booking, auto-cancel (cancel is a different transition)

**Mark paid**:
Recording verified payment so payment status becomes paid and operational status becomes confirmed.
_Avoid_: Confirm payment, capture

**Checkout**:
Hosted payment session for a Booking (PayMongo Checkout). Started after create or retry; success is applied only via verified paid outcome (webhook or reconcile), not the return URL alone.
_Avoid_: Payment page, invoice

**Cancel eligibility**:
Whether a customer may cancel: unpaid pending always; paid confirmed only when pickup is far enough away.
_Avoid_: Refund eligibility (refunds are separate and manual in v1)

**Fleet**:
The operator’s published cars available to browse and book.
_Avoid_: Inventory (except hold/overlap talk), catalog alone
