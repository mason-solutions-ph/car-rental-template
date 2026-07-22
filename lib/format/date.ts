const MANILA = "Asia/Manila";

/**
 * Display a date/time in Asia/Manila (product default market: PH).
 */
export function formatDateTime(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  }
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: MANILA,
    ...options,
  }).format(date);
}

export function formatDate(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }
): string {
  return formatDateTime(value, options);
}

/** ISO date-only (yyyy-mm-dd) for URL search params / form defaults. */
export function toDateInputValue(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
