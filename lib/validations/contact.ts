import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  subject: z.string().max(120).optional(),
  message: z.string().min(10).max(2000),
});
