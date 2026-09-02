import { z } from "zod";

export const gradeSchema = z.object({
  studentNim: z.string().min(1, "NIM praktikan tidak boleh kosong"),
  moduleId: z.string().min(1, "Modul ID tidak boleh kosong"),
  asistensiDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Format tanggal asistensi tidak valid",
    })
    .optional(),

  // Asistensi Code (55%)
  taskConformity: z.number().min(0).max(22, "Kesesuaian tugas maksimal 22"),
  programExplanation: z.number().min(0).max(19, "Penjelasan program maksimal 19"),
  attendance: z.number().min(0).max(8, "Kehadiran maksimal 8"),
  attitude: z.number().min(0).max(6, "Sikap maksimal 6"),

  // Laporan Resmi (35%)
  reportDiscussion: z.number().min(0).max(12, "Pembahasan & hasil maksimal 12"),
  reportFormat: z.number().min(0).max(10.5, "Format laporan maksimal 10.5"),
  plagiarism: z.number().min(0).max(9, "Plagiarisme maksimal 9"),
  neatness: z.number().min(0).max(3.5, "Kerapian maksimal 3.5"),

  // Pengumpulan (10%)
  submissionPunctuality: z.number().min(0).max(10, "Pengumpulan maksimal 10"),

  notes: z.string().optional().nullable(),
  githubUrl: z.string().optional().nullable(),
  demoUrl: z.string().optional().nullable(),
});

export type GradeInput = z.infer<typeof gradeSchema>;
