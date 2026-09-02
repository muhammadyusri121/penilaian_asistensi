"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/security";
import { gradeSchema, GradeInput } from "../schemas/grade.schema";
import { calculateModuleScore } from "../utils/calculate";
import { revalidatePath } from "next/cache";

export interface GradeActionResult {
  success: boolean;
  message: string;
  totalScore?: number;
}

/**
 * Simpan atau perbarui nilai asistensi mahasiswa untuk modul tertentu
 */
export async function saveGradeAction(input: GradeInput): Promise<GradeActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Akses ditolak. Silakan login terlebih dahulu." };
  }

  const parsed = gradeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validasi gagal: " + parsed.error.issues[0]?.message,
    };
  }

  const data = parsed.data;

  // Verifikasi hak akses: asisten hanya boleh menilai praktikan binaannya (ADMIN memiliki akses penuh)
  const student = await prisma.student.findUnique({
    where: { nim: data.studentNim },
    select: { assistantId: true },
  });

  if (!student) {
    return { success: false, message: "Data praktikan tidak ditemukan." };
  }

  if (session.role !== "ADMIN" && student.assistantId !== session.userId) {
    return {
      success: false,
      message: "Akses ditolak. Anda tidak berwenang untuk menilai praktikan ini.",
    };
  }

  // Hitung subtotal dan total menggunakan pure function
  const calc = calculateModuleScore({
    taskConformity: data.taskConformity,
    programExplanation: data.programExplanation,
    attendance: data.attendance,
    attitude: data.attitude,
    reportDiscussion: data.reportDiscussion,
    reportFormat: data.reportFormat,
    plagiarism: data.plagiarism,
    neatness: data.neatness,
    submissionPunctuality: data.submissionPunctuality,
  });

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Pastikan record Submission ada
      const submission = await tx.submission.upsert({
        where: {
          studentNim_moduleId: {
            studentNim: data.studentNim,
            moduleId: data.moduleId,
          },
        },
        update: {
          githubUrl: data.githubUrl || null,
          demoUrl: data.demoUrl || null,
          status: "GRADED",
        },
        create: {
          studentNim: data.studentNim,
          moduleId: data.moduleId,
          githubUrl: data.githubUrl || null,
          demoUrl: data.demoUrl || null,
          status: "GRADED",
        },
      });

      // 2. Simpan / perbarui Grade
      await tx.grade.upsert({
        where: {
          submissionId: submission.id,
        },
        update: {
          assistantId: session.userId,
          asistensiDate: data.asistensiDate ? new Date(data.asistensiDate) : new Date(),
          taskConformity: data.taskConformity,
          programExplanation: data.programExplanation,
          attendance: data.attendance,
          attitude: data.attitude,
          reportDiscussion: data.reportDiscussion,
          reportFormat: data.reportFormat,
          plagiarism: data.plagiarism,
          neatness: data.neatness,
          submissionPunctuality: data.submissionPunctuality,
          totalScore: calc.totalScore,
          notes: data.notes || null,
        },
        create: {
          submissionId: submission.id,
          assistantId: session.userId,
          asistensiDate: data.asistensiDate ? new Date(data.asistensiDate) : new Date(),
          taskConformity: data.taskConformity,
          programExplanation: data.programExplanation,
          attendance: data.attendance,
          attitude: data.attitude,
          reportDiscussion: data.reportDiscussion,
          reportFormat: data.reportFormat,
          plagiarism: data.plagiarism,
          neatness: data.neatness,
          submissionPunctuality: data.submissionPunctuality,
          totalScore: calc.totalScore,
          notes: data.notes || null,
        },
      });
    });

    revalidatePath(`/penilaian/${data.moduleId}`);
    revalidatePath("/rekap-nilai");

    return {
      success: true,
      message: `Nilai berhasil disimpan. Total Skor: ${calc.totalScore}`,
      totalScore: calc.totalScore,
    };
  } catch (error) {
    console.error("saveGradeAction failed", error);
    return {
      success: false,
      message: "Gagal menyimpan nilai asistensi.",
    };
  }
}

/**
 * Ambil seluruh praktikan dengan data nilai modul tertentu
 */
export async function getModuleGradingDataAction(moduleId: string) {
  const session = await getSession();
  if (!session) return null;

  const moduleInfo = await prisma.module.findUnique({
    where: { id: moduleId },
  });

  if (!moduleInfo) return null;

  const whereClause = session.role === "ADMIN" ? {} : { assistantId: session.userId };

  const students = await prisma.student.findMany({
    where: whereClause,
    orderBy: { nim: "asc" },
    include: {
      submissions: {
        where: { moduleId },
        include: {
          grade: {
            include: {
              assistant: {
                select: { name: true, username: true },
              },
            },
          },
          files: true,
        },
      },
    },
  });

  return {
    module: moduleInfo,
    students,
  };
}
