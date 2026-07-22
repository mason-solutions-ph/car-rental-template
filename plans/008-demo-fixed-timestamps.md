# 008 — Replace impure module-scope Date in demo data

- **Status**: DONE
- **Commit**: `7ec67b5`
- **Severity**: LOW
- **Category**: Maintainability
- **Rule**: `react-doctor/no-impure-call-at-module-scope`
- **Estimated scope**: `lib/data/demo.ts`

## Problem

`new Date().toISOString()` at module load changes demo timestamps every restart.

## Target

Fixed ISO seed string e.g. `"2024-01-15T08:00:00.000Z"`.

## Verification

Demo fleet still loads; order stable.
