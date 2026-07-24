/** Rental-ops users list (admins + renters). */

export type UserRoleLabel = "Admin" | "Customer";

export type UserRow = {
  id: string;
  name: string;
  /** Phone when known; otherwise short id fragment. */
  contact: string;
  role: UserRoleLabel;
  joinedDate: string;
  /** Sort key (ms). */
  joinedAt: number;
};

export const roleFilters = ["All", "Admin", "Customer"] as const;

/** Offline / empty fallback so the page is browsable without profiles. */
export const demoUsers: UserRow[] = [
  {
    id: "demo-1",
    name: "Alex Rivera",
    contact: "+63 917 000 0001",
    role: "Admin",
    joinedDate: "12 Jan 2025, 10:00 AM",
    joinedAt: new Date("2025-01-12T10:00:00").getTime(),
  },
  {
    id: "demo-2",
    name: "Jordan Lee",
    contact: "+63 917 000 0002",
    role: "Customer",
    joinedDate: "03 Mar 2025, 2:15 PM",
    joinedAt: new Date("2025-03-03T14:15:00").getTime(),
  },
  {
    id: "demo-3",
    name: "Sam Cruz",
    contact: "+63 917 000 0003",
    role: "Customer",
    joinedDate: "18 Apr 2025, 9:40 AM",
    joinedAt: new Date("2025-04-18T09:40:00").getTime(),
  },
  {
    id: "demo-4",
    name: "Riley Santos",
    contact: "+63 917 000 0004",
    role: "Customer",
    joinedDate: "22 May 2025, 4:05 PM",
    joinedAt: new Date("2025-05-22T16:05:00").getTime(),
  },
  {
    id: "demo-5",
    name: "Morgan Diaz",
    contact: "+63 917 000 0005",
    role: "Admin",
    joinedDate: "01 Jun 2025, 11:20 AM",
    joinedAt: new Date("2025-06-01T11:20:00").getTime(),
  },
];
