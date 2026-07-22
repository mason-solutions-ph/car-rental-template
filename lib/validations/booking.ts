import { z } from "zod";

export const bookingCreateSchema = z
  .object({
    carId: z.string().uuid(),
    pickupLocationId: z.string().uuid(),
    dropoffLocationId: z.string().uuid(),
    pickupAt: z.string().min(1),
    dropoffAt: z.string().min(1),
    driverFullName: z.string().min(2),
    driverPhone: z.string().min(7),
    driverLicenseNumber: z.string().min(3),
    customerNote: z.string().max(500).optional(),
  })
  .refine((d) => new Date(d.dropoffAt) > new Date(d.pickupAt), {
    message: "Drop-off must be after pickup",
    path: ["dropoffAt"],
  });

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
