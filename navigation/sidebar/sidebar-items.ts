import {
  CalendarCheckIcon,
  CarIcon,
  LayoutDashboardIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

export type NavBadge = "new" | "soon" | number;

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
  url?: never;
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

/** Admin console nav — fleet ops routes only. */
export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Overview",
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        url: "/admin",
        icon: LayoutDashboardIcon,
      },
    ],
  },
  {
    id: 2,
    label: "Manage",
    items: [
      {
        id: "bookings",
        title: "Bookings",
        url: "/admin/bookings",
        icon: CalendarCheckIcon,
      },
      {
        id: "cars",
        title: "Cars",
        url: "/admin/cars",
        icon: CarIcon,
      },
      {
        id: "users",
        title: "Users",
        url: "/admin/users",
        icon: UsersIcon,
      },
    ],
  },
];
