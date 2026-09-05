import { z } from "zod";

export const moduleItemSchema = z.object({
  title: z.string().min(3, "Judul modul minimal 3 karakter"),
  description: z.string().optional(),
  isFinalReport: z.boolean().default(false),
});

export const createCourseSchema = z.object({
  code: z.string().min(2, "Kode mata kuliah minimal 2 karakter (cth: IF201)").toUpperCase(),
  title: z.string().min(3, "Nama mata kuliah minimal 3 karakter (cth: Struktur Data)"),
  description: z.string().optional().nullable(),
  scheduleDay: z.string().optional().nullable(),
  scheduleTime: z.string().optional().nullable(),
  modules: z.array(moduleItemSchema).min(1, "Mata kuliah harus memiliki minimal 1 modul"),
});

export const updateModuleItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Judul modul minimal 3 karakter"),
  description: z.string().optional(),
  isFinalReport: z.boolean().default(false),
});

export const updateCourseSchema = z.object({
  code: z.string().min(2, "Kode mata kuliah minimal 2 karakter (cth: IF201)").toUpperCase(),
  title: z.string().min(3, "Nama mata kuliah minimal 3 karakter (cth: Struktur Data)"),
  description: z.string().optional().nullable(),
  scheduleDay: z.string().optional().nullable(),
  scheduleTime: z.string().optional().nullable(),
  modules: z.array(updateModuleItemSchema).min(1, "Mata kuliah harus memiliki minimal 1 modul"),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
