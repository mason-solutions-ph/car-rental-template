/** Default destination after sign-in when `next` is absent or unsafe. */
export function defaultPostLoginPath(role?: string | null): string {
  return role === "admin" ? "/admin" : "/account/bookings";
}
