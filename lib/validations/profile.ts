import { z } from "zod";

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(7).optional().or(z.literal("")),
  licenseNumber: z.string().min(3).optional().or(z.literal("")),
});
