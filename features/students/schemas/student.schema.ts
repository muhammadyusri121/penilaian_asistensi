import { z } from "zod";

export const studentSchema = z.object({
  nim: z.string().min(3, "NIM wajib diisi dan minimal 3 karakter"),
  name: z.string().min(2, "Nama lengkap wajib diisi"),
  classGroup: z.string().optional().nullable(),
});

export const bulkStudentItemSchema = z.object({
  nim: z.string().min(1, "NIM tidak boleh kosong"),
  name: z.string().min(1, "Nama tidak boleh kosong"),
  classGroup: z.string().optional().nullable(),
});

export type StudentInput = z.infer<typeof studentSchema>;
