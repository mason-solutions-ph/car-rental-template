# 004 — Harden bookings UPDATE RLS so customers cannot self-confirm payment

- **Status**: DONE
- **Commit**: `7ec67b5`
- **Severity**: HIGH
- **Category**: Security
- **Rule**: Beyond the scan
- **Estimated scope**: new migration + `app/actions/bookings.ts`

## Problem

`bookings_update_own_or_admin` allows customers to update any column including `payment_status`.

## Target

1. Migration drops broad policy; adds customer cancel-only update policy.
2. Write `paymongo_checkout_session_id` via `createAdminClient()` after auth.

## Verification

Customer cannot set paid via user JWT; cancel + checkout still work.
