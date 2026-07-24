import { describe, expect, it } from "vitest";
import { buildAdminBreadcrumbs } from "@/lib/admin/breadcrumbs";

describe("buildAdminBreadcrumbs", () => {
  it("names the admin root Dashboard with no ancestors", () => {
    expect(buildAdminBreadcrumbs("/admin")).toEqual({
      ancestors: [],
      title: "Dashboard",
    });
  });

  it("tolerates a trailing slash", () => {
    expect(buildAdminBreadcrumbs("/admin/")).toEqual({
      ancestors: [],
      title: "Dashboard",
    });
  });

  it("puts Admin above a top-level section", () => {
    expect(buildAdminBreadcrumbs("/admin/bookings")).toEqual({
      ancestors: [{ href: "/admin", label: "Admin" }],
      title: "Bookings",
    });
  });

  it("builds cumulative hrefs for nested routes", () => {
    expect(buildAdminBreadcrumbs("/admin/cars/abc123/edit")).toEqual({
      ancestors: [
        { href: "/admin", label: "Admin" },
        { href: "/admin/cars", label: "Cars" },
        { href: "/admin/cars/abc123", label: "Abc123" },
      ],
      title: "Edit",
    });
  });

  it("labels every known section", () => {
    for (const [segment, label] of [
      ["bookings", "Bookings"],
      ["cars", "Cars"],
      ["users", "Users"],
    ] as const) {
      expect(buildAdminBreadcrumbs(`/admin/${segment}`).title).toBe(label);
    }
  });

  it("falls back to a readable label for unknown segments", () => {
    expect(buildAdminBreadcrumbs("/admin/audit-log").title).toBe("Audit log");
  });

  it("returns a safe default outside the admin tree", () => {
    expect(buildAdminBreadcrumbs("/cars")).toEqual({
      ancestors: [],
      title: "Admin",
    });
  });
});
