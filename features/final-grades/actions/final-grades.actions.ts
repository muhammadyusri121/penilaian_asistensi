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
 * Simpan / perbarui Nilai Ujian (UTS / UAS) mahasiswa
 */
export async function updateExamScoreAction(
  studentNim: string,
  utsScore: number,
  uasScore: number
) {
  const session = await getSession();
  if (!session) throw new Error("Akses ditolak");

  await prisma.finalGrade.upsert({
    where: { studentNim },
    update: {
      utsScore,
      uasScore,
    },
    create: {
      studentNim,
      utsScore,
      uasScore,
    },
  });

  revalidatePath("/rekap-nilai");
  return { success: true };
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
  if (!session) throw new Error("Akses ditolak");

  await prisma.attendance.upsert({
    where: {
      studentNim_meetingNo: {
        studentNim,
        meetingNo,
      },
    },
    update: { score },
    create: {
      studentNim,
      meetingNo,
      score,
    },
  });

  revalidatePath("/rekap-nilai");
  return { success: true };
}
