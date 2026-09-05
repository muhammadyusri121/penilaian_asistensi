import { z } from "zod";

export const moduleItemSchema = z.object({
  title: z.string().min(3, "Judul modul minimal 3 karakter"),
  description: z.string().optional(),
  isFinalReport: z.boolean().default(false),
});

export const createCourseSchema = z
  .object({
    code: z.string().min(2, "Kode mata kuliah minimal 2 karakter (cth: IF201)").toUpperCase(),
    title: z.string().min(3, "Nama mata kuliah minimal 3 karakter (cth: Struktur Data)"),
    description: z.string().optional().nullable(),
    scheduleDay: z.string().optional().nullable(),
    scheduleTime: z.string().optional().nullable(),
    modules: z.array(moduleItemSchema).min(1, "Mata kuliah harus memiliki minimal 1 modul"),
    weightAttendance: z.number().min(0).max(100).optional().default(10),
    weightAssignment: z.number().min(0).max(100).optional().default(20),
    weightPretest: z.number().min(0).max(100).optional().default(10),
    weightUts: z.number().min(0).max(100).optional().default(25),
    weightUas: z.number().min(0).max(100).optional().default(35),
  })
  .refine(
    (d) => {
      const sum =
        (d.weightAttendance ?? 10) +
        (d.weightAssignment ?? 20) +
        (d.weightPretest ?? 10) +
        (d.weightUts ?? 25) +
        (d.weightUas ?? 35);
      return Math.abs(sum - 100) < 0.01;
    },
    {
      message: "Total persentase bobot penilaian semester harus tepat 100%",
      path: ["weightAttendance"],
    }
  );

export const updateModuleItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Judul modul minimal 3 karakter"),
  description: z.string().optional(),
  isFinalReport: z.boolean().default(false),
});

export const updateCourseSchema = z
  .object({
    code: z.string().min(2, "Kode mata kuliah minimal 2 karakter (cth: IF201)").toUpperCase(),
    title: z.string().min(3, "Nama mata kuliah minimal 3 karakter (cth: Struktur Data)"),
    description: z.string().optional().nullable(),
    scheduleDay: z.string().optional().nullable(),
    scheduleTime: z.string().optional().nullable(),
    modules: z.array(updateModuleItemSchema).min(1, "Mata kuliah harus memiliki minimal 1 modul"),
    weightAttendance: z.number().min(0).max(100).optional().default(10),
    weightAssignment: z.number().min(0).max(100).optional().default(20),
    weightPretest: z.number().min(0).max(100).optional().default(10),
    weightUts: z.number().min(0).max(100).optional().default(25),
    weightUas: z.number().min(0).max(100).optional().default(35),
  })
  .refine(
    (d) => {
      const sum =
        (d.weightAttendance ?? 10) +
        (d.weightAssignment ?? 20) +
        (d.weightPretest ?? 10) +
        (d.weightUts ?? 25) +
        (d.weightUas ?? 35);
      return Math.abs(sum - 100) < 0.01;
    },
    {
      message: "Total persentase bobot penilaian semester harus tepat 100%",
      path: ["weightAttendance"],
    }
  );

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
