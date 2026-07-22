# 005 — Reset admin car form pending flag in finally

- **Status**: DONE
- **Commit**: `7ec67b5`
- **Severity**: MEDIUM
- **Category**: Bugs & correctness
- **Rule**: `react-doctor/no-loading-flag-reset-outside-finally`
- **Estimated scope**: `components/admin/car-form.tsx`

## Problem

`setPending(false)` only after successful await; throw leaves button stuck.

## Target

try/catch/finally with `setPending(false)` in `finally`.

## Verification

Stuck spinner fixed; success still navigates to `/admin/cars`.
