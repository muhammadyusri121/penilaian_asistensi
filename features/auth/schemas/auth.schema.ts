import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(4, "Password minimal 4 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter (cth: asprak_alpro)"),
  name: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
