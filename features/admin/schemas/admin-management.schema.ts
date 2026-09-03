import { z } from "zod";

export const adminUserSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  name: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export type AdminUserInput = z.infer<typeof adminUserSchema>;
