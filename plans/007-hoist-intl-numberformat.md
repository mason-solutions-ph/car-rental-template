# 007 — Hoist Intl.NumberFormat used by formatMoney

- **Status**: DONE
- **Commit**: `7ec67b5`
- **Severity**: LOW
- **Category**: Performance
- **Rule**: `react-doctor/js-hoist-intl`
- **Estimated scope**: `lib/format/currency.ts`

## Problem

New `Intl.NumberFormat` per `formatMoney` call.

## Target

Cache formatters by currency at module scope.

## Verification

PHP money strings unchanged; diagnostic clears.
