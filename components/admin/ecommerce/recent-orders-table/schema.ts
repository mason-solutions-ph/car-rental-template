import type { BookingStatus, PaymentStatus } from "@/types";

export const orderFilters = [
  "All",
  "Needs action",
  "Unpaid",
  "Active",
  "Cancelled",
] as const;

export type OrderFilter = (typeof orderFilters)[number];

export type OrderRow = {
  id: string;
  reference: string;
  date: string;
  customer: string;
  payment: PaymentStatus;
  status: BookingStatus;
  total: string;
  totalCents: number;
  car: string;
  rentalDays: number;
};
