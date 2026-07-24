/**
 * Console placeholder for "no value". Matches the existing `--:--:--` and
 * `--m left` idiom in OpsClock and HoldTimer.
 *
 * Never an em-dash: an em-dash is prose punctuation, it reads as a sentence
 * break inside a data cell, and some screen readers announce it as a word.
 */
export const EMPTY_VALUE = "--";

export function orEmpty(value: string | null | undefined): string;
export function orEmpty<T>(
  value: T | null | undefined,
  format: (value: T) => string
): string;
/**
 * Renders a value, or EMPTY_VALUE when it is absent or blank.
 * Use where a plain string is required (title attributes, clipboard fallbacks,
 * composed sentences). In table cells prefer <OpsEmptyValue>, which also
 * carries a screen-reader label.
 */
export function orEmpty<T>(
  value: T | null | undefined,
  format?: (value: T) => string
): string {
  if (value == null) return EMPTY_VALUE;
  if (typeof value === "string" && value.trim() === "") return EMPTY_VALUE;
  return format ? format(value) : String(value);
}
