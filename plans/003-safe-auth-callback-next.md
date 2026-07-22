# 003 — Validate OAuth callback `next` before redirect

- **Status**: DONE
- **Commit**: `7ec67b5`
- **Severity**: HIGH
- **Category**: Security
- **Rule**: `react-doctor/url-prefilled-privileged-action`
- **Estimated scope**: `app/auth/callback/route.ts` (+ helper from 002)

## Problem

Callback trusts `searchParams.get("next")` without allowlisting.

## Target

`safeRedirectPath(...)` then `NextResponse.redirect(new URL(next, origin))`.

## Verification

Malicious `next` never leaves origin; valid relative paths still work.
