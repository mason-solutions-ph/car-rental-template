# 002 — Allowlist safe relative paths for post-login redirect

- **Status**: DONE
- **Commit**: `7ec67b5`
- **Severity**: HIGH
- **Category**: Security
- **Rule**: `react-doctor/clickjacking-redirect-risk`
- **Estimated scope**: `lib/auth/safe-redirect.ts` (new), `app/actions/auth.ts`

## Problem

`next.startsWith("/")` allows open redirects like `//evil.com`.

## Target

Shared `safeRedirectPath(candidate, fallback)` rejecting non-relative, `//`, `://`, `\`, control chars. Use in `loginAction`.

## Verification

Safe `next=/account/profile` works; `//evil.com` falls back to `/account/bookings`.
