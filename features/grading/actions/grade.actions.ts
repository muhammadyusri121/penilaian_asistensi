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

  // Verifikasi hak akses: asisten hanya boleh menilai praktikan binaannya di course ini (ADMIN memiliki akses penuh)
  const enrollment = await (prisma.courseEnrollment.findFirst as any)({
    where: {
      studentNim: data.studentNim,
      course: { modules: { some: { id: data.moduleId } } },
    },
    select: { assistantId: true, courseId: true, status: true },
  });

  if (!enrollment) {
    return { success: false, message: "Data praktikan tidak terdaftar di mata kuliah modul ini." };
  }

  if (session.role !== "ADMIN") {
    if (enrollment.assistantId !== session.userId) {
      return {
        success: false,
        message: "Akses ditolak. Anda tidak berwenang untuk menilai praktikan ini.",
      };
    }

    // Verifikasi apakah pengajuan mata kuliah ini sudah di-ACC oleh Admin
    const assignment = await (prisma.courseAssistant.findUnique as any)({
      where: {
        courseId_assistantId: {
          courseId: enrollment.courseId,
          assistantId: session.userId,
        },
      },
    });

    const currentStatus = (assignment as any)?.status;
    if (currentStatus && currentStatus !== "APPROVED") {
      return {
        success: false,
        message: "Akses ditolak. Pengajuan mata kuliah ini belum disetujui (di-ACC) oleh Koordinator Lab. Anda baru dapat menilai setelah pengajuan disetujui.",
      };
    }

    const enrollmentStatus = (enrollment as any)?.status;
    if (enrollmentStatus && enrollmentStatus !== "APPROVED") {
      return {
        success: false,
        message: "Akses ditolak. Praktikan ini berstatus Menunggu ACC / belum disetujui oleh Koordinator Lab.",
      };
    }
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
    // Jalankan Prisma Interactive Transaction untuk menjamin atomic write
    await prisma.$transaction(async (tx) => {
      // 1. Upsert Submission
      const submission = await tx.submission.upsert({
        where: {
          studentNim_moduleId: {
            studentNim: data.studentNim,
            moduleId: data.moduleId,
          },
        },
        update: {
          status: "GRADED",
        },
        create: {
          studentNim: data.studentNim,
          moduleId: data.moduleId,
          status: "GRADED",
        },
      });

      // 2. Upsert Grade
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
    revalidatePath(`/${enrollment.courseId}/penilaian/${data.moduleId}`);
    revalidatePath("/modul");
    revalidatePath("/rekap-nilai");

    return {
      success: true,
      message: "Nilai asistensi berhasil disimpan",
      totalScore: calc.totalScore,
    };
  } catch (error) {
    console.error("Gagal menyimpan nilai asistensi", error);
    return {
      success: false,
      message: "Terjadi kesalahan pada database saat menyimpan nilai.",
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

  if (session.role !== "ADMIN") {
    const assignment = await (prisma.courseAssistant.findUnique as any)({
      where: {
        courseId_assistantId: {
          courseId: moduleInfo.courseId,
          assistantId: session.userId,
        },
      },
    });
    const currentStatus = (assignment as any)?.status;
    if (currentStatus && currentStatus !== "APPROVED") {
      return null;
    }
  }

  const studentWhere =
    session.role === "ADMIN"
      ? { enrollments: { some: { courseId: moduleInfo.courseId } } }
      : { enrollments: { some: { courseId: moduleInfo.courseId, assistantId: session.userId } } };

  const students = await (prisma.student.findMany as any)({
    where: studentWhere,
    orderBy: { nim: "asc" },
    include: {
      enrollments: {
        where: { courseId: moduleInfo.courseId },
        select: { classGroup: true, status: true },
      },
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
    students: (students as any[]).map((s) => ({
      nim: s.nim,
      name: s.name,
      classGroup: s.enrollments[0]?.classGroup || null,
      enrollmentStatus: s.enrollments[0]?.status || "APPROVED",
      submissions: s.submissions,
    })),
  };
}
