# 001 — Fix redirect() swallowed inside try/catch in booking payment actions

- **Status**: DONE
- **Commit**: `7ec67b5`
- **Severity**: HIGH
- **Category**: Bugs & correctness
- **Rule**: `react-doctor/nextjs-no-redirect-in-try-catch`
- **Estimated scope**: 1 file (`app/actions/bookings.ts`)

## Problem

`redirect(checkout.checkoutUrl)` in `createBookingAndCheckout` and `retryCheckout` sits inside `try/catch`. Next.js `redirect()` throws; catch swallows it and returns a form error after checkout was created.

## Target

Keep PayMongo work in `try`; assign `checkoutUrl`; call `redirect(checkoutUrl)` **after** try/catch. Same for both functions.

## Steps

1. `createBookingAndCheckout`: move redirect outside try.
2. `retryCheckout`: same.
3. Do not change auth, insert, or pricing.

## Verification

- `npx react-doctor@latest --scope changed` clears the rule.
- Success path redirects to PayMongo; failure still returns `{ error }`.
