export type AdminCrumb = { href: string; label: string };

export type AdminBreadcrumbTrail = {
  /** Everything above the current page, nearest-last. Empty on /admin. */
  ancestors: AdminCrumb[];
  /** Label for the current page. Rendered as the h1. */
  title: string;
};

const ROOT: AdminCrumb = { href: "/admin", label: "Admin" };

const SEGMENT_LABELS: Record<string, string> = {
  bookings: "Bookings",
  cars: "Cars",
  users: "Users",
  new: "New",
  edit: "Edit",
};

function labelFor(segment: string): string {
  const known = SEGMENT_LABELS[segment];
  if (known) return known;
  // Unknown segments are usually ids; show them verbatim rather than guessing.
  return segment.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
}

/**
 * Breadcrumb trail for an admin pathname. Pure so it can be unit tested under
 * the node-env vitest config.
 *
 * /admin                 -> { ancestors: [],      title: "Dashboard" }
 * /admin/bookings        -> { ancestors: [Admin], title: "Bookings"  }
 * /admin/cars/abc/edit   -> { ancestors: [Admin, Cars, Abc], title: "Edit" }
 */
export function buildAdminBreadcrumbs(pathname: string): AdminBreadcrumbTrail {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] !== "admin") {
    return { ancestors: [], title: "Admin" };
  }

  const rest = segments.slice(1);
  if (rest.length === 0) {
    return { ancestors: [], title: "Dashboard" };
  }

  const ancestors: AdminCrumb[] = [ROOT];
  let href = "/admin";

  for (const segment of rest.slice(0, -1)) {
    href += `/${segment}`;
    ancestors.push({ href, label: labelFor(segment) });
  }

  return { ancestors, title: labelFor(rest[rest.length - 1]) };
}
