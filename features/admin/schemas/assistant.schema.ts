import { z } from "zod";

export const createAssistantSchema = z.object({
  name: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  username: z
    .string()
    .min(3, "Username / Kode Asprak minimal 3 karakter")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username hanya boleh huruf, angka, titik, underscore, atau tanda hubung"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  password: z.string().min(6, "Password minimal 6 karakter"),
  status: z.enum(["ACTIVE", "PENDING_APPROVAL", "SUSPENDED", "REJECTED"]).default("ACTIVE"),
});

export type CreateAssistantInput = z.infer<typeof createAssistantSchema>;

export const updateAssistantSchema = z.object({
  name: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  username: z
    .string()
    .min(3, "Username / Kode Asprak minimal 3 karakter")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username hanya boleh huruf, angka, titik, underscore, atau tanda hubung"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  password: z.string().min(6, "Password baru minimal 6 karakter").optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "PENDING_APPROVAL", "SUSPENDED", "REJECTED"]),
});

export type UpdateAssistantInput = z.infer<typeof updateAssistantSchema>;
