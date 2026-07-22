# 006 — Parallelize independent awaits on car detail and book pages

- **Status**: DONE
- **Commit**: `7ec67b5`
- **Severity**: MEDIUM
- **Category**: Performance
- **Rule**: `react-doctor/server-sequential-independent-await`
- **Estimated scope**: car detail + book pages

## Problem

`searchParams` and `getCarBySlug` await sequentially though independent.

## Target

`Promise.all([searchParams, getCarBySlug(slug)])`; optionally session + locations on book page.

## Verification

Pages render; auth gate and 404 unchanged.
