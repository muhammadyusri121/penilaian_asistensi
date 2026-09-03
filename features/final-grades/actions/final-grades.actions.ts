"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/security";
import { calculateSemesterFinalGrade } from "@/features/grading/utils/calculate";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const examScoreSchema = z.object({
  studentNim: z.string().min(1, "NIM wajib diisi"),
  utsScore: z.number().min(0).max(100),
  uasScore: z.number().min(0).max(100),
  courseId: z.string().optional(),
});

const attendanceMeetingSchema = z.object({
  studentNim: z.string().min(1, "NIM wajib diisi"),
  meetingNo: z.number().int().min(1).max(12),
  score: z.number().min(0).max(100),
  courseId: z.string().optional(),
});

export type ExamScoreInput = z.infer<typeof examScoreSchema>;

/**
 * Ambil data rekapitulasi semester seluruh praktikan beserta kalkulasi nilai akhir
 */
export async function getSemesterSummaryAction(courseId?: string) {
  const session = await getSession();
  if (!session) return null;

  let targetCourseId = courseId;
  if (!targetCourseId) {
    const firstCourse = await prisma.course.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (firstCourse) {
      targetCourseId = firstCourse.id;
    }
  }

  if (!targetCourseId) {
    return {
      modules: [],
      pretests: [],
      students: [],
    };
  }

  const enrollmentWhere =
    session.role === "ADMIN"
      ? { courseId: targetCourseId }
      : { courseId: targetCourseId, assistantId: session.userId };

  const [enrollments, modules, pretests] = await Promise.all([
    prisma.courseEnrollment.findMany({
      where: enrollmentWhere,
      orderBy: { studentNim: "asc" },
      include: {
        assistant: { select: { name: true, username: true } },
        student: {
          include: {
            attendances: { where: { courseId: targetCourseId } },
            submissions: {
              where: { module: { courseId: targetCourseId } },
              include: { grade: true },
            },
            pretestScores: {
              where: { pretest: { courseId: targetCourseId } },
            },
            finalGrades: {
              where: { courseId: targetCourseId },
            },
          },
        },
      },
    }),
    prisma.module.findMany({
      where: { courseId: targetCourseId },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.pretest.findMany({
      where: { courseId: targetCourseId },
      orderBy: { orderIndex: "asc" },
    }),
  ]);

  // Kalkulasi data untuk setiap mahasiswa
  const processedStudents = enrollments.map((en) => {
    const student = en.student;

    // 1. Kehadiran 12x
    const attendanceMap = new Map<number, number>();
    for (const att of student.attendances) {
      attendanceMap.set(att.meetingNo, att.score);
    }
    const attendanceScores: number[] = [];
    for (let i = 1; i <= 12; i++) {
      attendanceScores.push(attendanceMap.get(i) ?? 100);
    }

    // 2. Modul scores
    const moduleMap = new Map<string, number>();
    for (const sub of student.submissions) {
      if (sub.grade) {
        moduleMap.set(sub.moduleId, sub.grade.totalScore);
      }
    }
    const moduleScores = modules.map((m) => moduleMap.get(m.id) ?? 0);

    // 3. Pretest scores
    const pretestMap = new Map<string, number>();
    for (const ps of student.pretestScores) {
      pretestMap.set(ps.pretestId, ps.score);
    }
    const pretestScoresArray = pretests.map((p) => pretestMap.get(p.id) ?? 0);

    // 4. UTS & UAS
    const finalGradeRecord = student.finalGrades[0];
    const rawUtsScore = finalGradeRecord?.utsScore ?? 0;
    const rawUasScore = finalGradeRecord?.uasScore ?? 0;

    // Hitung seluruh komponen semester (0..100%)
    const summary = calculateSemesterFinalGrade({
      attendances: attendanceScores,
      moduleScores,
      pretestScores: pretestScoresArray,
      utsScore: rawUtsScore,
      uasScore: rawUasScore,
    });

    return {
      student: {
        nim: student.nim,
        name: student.name,
        classGroup: en.classGroup,
        assistant: en.assistant,
      },
      attendanceScores,
      moduleScores,
      pretestScoresArray,
      rawUtsScore,
      rawUasScore,
      summary,
    };
  });

  return {
    modules,
    pretests,
    students: processedStudents,
  };
}

/**
 * Simpan atau perbarui nilai UTS & UAS praktikan
 */
export async function updateExamScoreAction(input: ExamScoreInput) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Akses ditolak. Silakan login." };
  }

  const parsed = examScoreSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Validasi gagal",
    };
  }

  const { studentNim, utsScore, uasScore, courseId } = parsed.data;

  try {
    let targetCourseId = courseId;
    if (!targetCourseId) {
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: { studentNim },
        select: { courseId: true, assistantId: true },
      });
      if (!enrollment) {
        return { success: false, message: "Praktikan belum terdaftar di mata kuliah manapun." };
      }
      targetCourseId = enrollment.courseId;
    }

    // Verifikasi hak akses
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentNim: {
          courseId: targetCourseId,
          studentNim,
        },
      },
      select: { assistantId: true },
    });

    if (!enrollment) {
      return { success: false, message: "Praktikan tidak ditemukan di mata kuliah ini." };
    }

    if (session.role !== "ADMIN" && enrollment.assistantId !== session.userId) {
      return {
        success: false,
        message: "Akses ditolak. Anda tidak berwenang untuk menilai praktikan ini.",
      };
    }

    await prisma.finalGrade.upsert({
      where: {
        courseId_studentNim: {
          courseId: targetCourseId,
          studentNim,
        },
      },
      update: {
        utsScore,
        uasScore,
      },
      create: {
        courseId: targetCourseId,
        studentNim,
        utsScore,
        uasScore,
      },
    });

    revalidatePath("/rekap-nilai");
    revalidatePath(`/${targetCourseId}/rekap-nilai`);
    return { success: true, message: "Nilai ujian berhasil disimpan." };
  } catch (error) {
    console.error("updateExamScoreAction failed", error);
    return { success: false, message: "Gagal menyimpan nilai ujian." };
  }
}

/**
 * Simpan / perbarui nilai kehadiran pertemuan mahasiswa (1..12)
 */
export async function updateAttendanceMeetingAction(
  studentNim: string,
  meetingNo: number,
  score: number,
  courseId?: string
) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Akses ditolak. Silakan login." };
  }

  const parsed = attendanceMeetingSchema.safeParse({ studentNim, meetingNo, score, courseId });
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Validasi gagal",
    };
  }

  try {
    let targetCourseId = courseId;
    if (!targetCourseId) {
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: { studentNim },
        select: { courseId: true },
      });
      if (!enrollment) {
        return { success: false, message: "Praktikan belum terdaftar di mata kuliah manapun." };
      }
      targetCourseId = enrollment.courseId;
    }

    // Verifikasi hak akses
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentNim: {
          courseId: targetCourseId,
          studentNim,
        },
      },
      select: { assistantId: true },
    });

    if (!enrollment) {
      return { success: false, message: "Praktikan tidak ditemukan di mata kuliah ini." };
    }

    if (session.role !== "ADMIN" && enrollment.assistantId !== session.userId) {
      return {
        success: false,
        message: "Akses ditolak. Anda tidak berwenang untuk menilai praktikan ini.",
      };
    }

    await prisma.attendance.upsert({
      where: {
        courseId_studentNim_meetingNo: {
          courseId: targetCourseId,
          studentNim,
          meetingNo,
        },
      },
      update: { score },
      create: {
        courseId: targetCourseId,
        studentNim,
        meetingNo,
        score,
      },
    });

    revalidatePath("/rekap-nilai");
    revalidatePath(`/${targetCourseId}/rekap-nilai`);
    return { success: true, message: "Presensi berhasil disimpan." };
  } catch (error) {
    console.error("updateAttendanceMeetingAction failed", error);
    return { success: false, message: "Gagal menyimpan presensi." };
  }
}
