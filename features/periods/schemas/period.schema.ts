import { z } from "zod";

export const periodSchema = z.object({
  name: z.string().min(3, "Nama periode minimal 3 karakter (contoh: Semester Gasal 2026/2027)"),
  isActive: z.boolean().default(false),
  studentInputStart: z.string().refine((d) => !isNaN(Date.parse(d)), "Format tanggal buka input praktikan tidak valid"),
  studentInputEnd: z.string().refine((d) => !isNaN(Date.parse(d)), "Format tanggal tutup input praktikan tidak valid"),
}).refine(
  (data) => new Date(data.studentInputEnd) >= new Date(data.studentInputStart),
  { message: "Tanggal tutup input praktikan harus sama atau setelah tanggal buka", path: ["studentInputEnd"] }
);

export type PeriodInput = z.infer<typeof periodSchema>;
