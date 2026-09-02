"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/security";
import { calculateSemesterFinalGrade } from "@/features/grading/utils/calculate";
import { revalidatePath } from "next/cache";

/**
 * Ambil data rekapitulasi semester seluruh praktikan beserta kalkulasi nilai akhir
 */
export async function getSemesterSummaryAction() {
  const session = await getSession();
  if (!session) return null;

  const whereClause = session.role === "ADMIN" ? {} : { assistantId: session.userId };

  const [students, modules, pretests] = await Promise.all([
    prisma.student.findMany({
      where: whereClause,
      orderBy: { nim: "asc" },
      include: {
        attendances: true,
        submissions: {
          include: {
            grade: true,
          },
        },
        pretestScores: true,
        finalGrade: true,
        assistant: { select: { name: true, username: true } },
      },
    }),
    prisma.module.findMany({
      orderBy: { orderIndex: "asc" },
    }),
    prisma.pretest.findMany({
      orderBy: { orderIndex: "asc" },
    }),
  ]);

  // Kalkulasi data untuk setiap mahasiswa
  const processedStudents = students.map((student) => {
    // 1. Kehadiran 12x
    const attendanceMap = new Map<number, number>();
    for (const att of student.attendances) {
      attendanceMap.set(att.meetingNo, att.score);
    }
    const attendanceScores: number[] = [];
    for (let i = 1; i <= 12; i++) {
      attendanceScores.push(attendanceMap.get(i) ?? 100); // default 100 jika hadir
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

    // UTS & UAS
    const uts = student.finalGrade?.utsScore ?? 0;
    const uas = student.finalGrade?.uasScore ?? 0;

    const summary = calculateSemesterFinalGrade({
      attendances: attendanceScores,
      moduleScores,
      pretestScores: pretestScoresArray.length > 0 ? pretestScoresArray : [0],
      utsScore: uts,
      uasScore: uas,
    });

    return {
      student,
      attendanceScores,
      moduleScores,
      pretestScoresArray,
      rawUtsScore: uts,
      rawUasScore: uas,
      summary,
    };
  });

  return {
    modules,
    pretests,
    students: processedStudents,
  };
}

import { z } from "zod";

const examScoreSchema = z.object({
  studentNim: z.string().min(1, "NIM tidak boleh kosong"),
  utsScore: z.number().min(0, "Nilai UTS minimal 0").max(100, "Nilai UTS maksimal 100"),
  uasScore: z.number().min(0, "Nilai UAS minimal 0").max(100, "Nilai UAS maksimal 100"),
});

const attendanceMeetingSchema = z.object({
  studentNim: z.string().min(1, "NIM tidak boleh kosong"),
  meetingNo: z.number().int().min(1, "Pertemuan minimal 1").max(12, "Pertemuan maksimal 12"),
  score: z.number().min(0, "Nilai presensi minimal 0").max(100, "Nilai presensi maksimal 100"),
});

/**
 * Simpan / perbarui Nilai Ujian (UTS / UAS) mahasiswa
 */
export async function updateExamScoreAction(
  studentNim: string,
  utsScore: number,
  uasScore: number
) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Akses ditolak. Silakan login." };
  }

  const parsed = examScoreSchema.safeParse({ studentNim, utsScore, uasScore });
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Validasi gagal",
    };
  }

  try {
    const student = await prisma.student.findUnique({
      where: { nim: parsed.data.studentNim },
      select: { assistantId: true },
    });

    if (!student) {
      return { success: false, message: "Praktikan tidak ditemukan." };
    }

    if (session.role !== "ADMIN" && student.assistantId !== session.userId) {
      return {
        success: false,
        message: "Akses ditolak. Anda tidak memiliki hak akses untuk praktikan ini.",
      };
    }

    await prisma.finalGrade.upsert({
      where: { studentNim: parsed.data.studentNim },
      update: {
        utsScore: parsed.data.utsScore,
        uasScore: parsed.data.uasScore,
      },
      create: {
        studentNim: parsed.data.studentNim,
        utsScore: parsed.data.utsScore,
        uasScore: parsed.data.uasScore,
      },
    });

    revalidatePath("/rekap-nilai");
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
  score: number
) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Akses ditolak. Silakan login." };
  }

  const parsed = attendanceMeetingSchema.safeParse({ studentNim, meetingNo, score });
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Validasi gagal",
    };
  }

  try {
    const student = await prisma.student.findUnique({
      where: { nim: parsed.data.studentNim },
      select: { assistantId: true },
    });

    if (!student) {
      return { success: false, message: "Praktikan tidak ditemukan." };
    }

    if (session.role !== "ADMIN" && student.assistantId !== session.userId) {
      return {
        success: false,
        message: "Akses ditolak. Anda tidak memiliki hak akses untuk praktikan ini.",
      };
    }

    await prisma.attendance.upsert({
      where: {
        studentNim_meetingNo: {
          studentNim: parsed.data.studentNim,
          meetingNo: parsed.data.meetingNo,
        },
      },
      update: { score: parsed.data.score },
      create: {
        studentNim: parsed.data.studentNim,
        meetingNo: parsed.data.meetingNo,
        score: parsed.data.score,
      },
    });

    revalidatePath("/rekap-nilai");
    return { success: true, message: "Presensi berhasil disimpan." };
  } catch (error) {
    console.error("updateAttendanceMeetingAction failed", error);
    return { success: false, message: "Gagal menyimpan presensi." };
  }
}
