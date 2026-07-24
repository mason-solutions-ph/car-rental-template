import type React from "react";

import type { OrderFilter } from "./schema";

export function formatOrderCount(filter: OrderFilter, count: number) {
  const label = count === 1 ? "booking" : "bookings";

  if (filter === "All") {
    return `${count.toLocaleString()} ${label}`;
  }

  if (filter === "Needs action") {
    return `${count.toLocaleString()} ${label} need action`;
  }

  return `${count.toLocaleString()} ${filter.toLowerCase()} ${label}`;
}

export function formatSelectedOrderCount(count: number) {
  const label = count === 1 ? "booking" : "bookings";
  return `${count.toLocaleString()} ${label} selected`;
}

export function preventPaginationNavigation(
  event: React.MouseEvent<HTMLAnchorElement>
) {
  event.preventDefault();
}
