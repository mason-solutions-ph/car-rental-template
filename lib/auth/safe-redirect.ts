const DEFAULT_NEXT = "/account/bookings";

/**
 * Returns a same-app relative path only.
 * Rejects protocol-relative URLs, backslashes, and absolute URLs.
 */
export function safeRedirectPath(
  candidate: unknown,
  fallback: string = DEFAULT_NEXT
): string {
  if (typeof candidate !== "string") return fallback;
  const path = candidate.trim();
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//")) return fallback;
  if (path.includes("://")) return fallback;
  if (path.includes("\\")) return fallback;
  if (/[\u0000-\u001F\u007F]/.test(path)) return fallback;
  return path;
}
