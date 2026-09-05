"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/security";
import { bulkStudentItemSchema, studentSchema, StudentInput } from "../schemas/student.schema";
import { checkWindowAccessAction } from "@/features/periods/actions/period.actions";
import { revalidatePath } from "next/cache";

export interface StudentActionResult {
  success: boolean;
  message: string;
  count?: number;
}

/**
 * Import mahasiswa ke Mata Kuliah Praktikum tertentu
 * ATURAN KETAT: 1 Mahasiswa (NIM) tidak boleh diampu oleh 2 asprak dalam 1 mata kuliah yang sama.
 */
export async function importStudentsToCourseAction(
  courseId: string,
  studentsData: Array<{ nim: string; name: string; classGroup?: string }>
): Promise<StudentActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Akses ditolak. Silakan login terlebih dahulu." };
  }

  // 1. Cek Jendela Waktu Input Mahasiswa (kecuali Admin)
  const windowCheck = await checkWindowAccessAction("student");
  if (!windowCheck.allowed) {
    return { success: false, message: windowCheck.reason || "Periode input mahasiswa telah ditutup." };
  }

  if (!Array.isArray(studentsData) || studentsData.length === 0) {
    return { success: false, message: "Tidak ada data mahasiswa yang ditemukan dalam file." };
  }

  try {
    // 2. Sanitasi & Deduplikasi data di memory
    const validItems = new Map<string, { nim: string; name: string; classGroup: string | null }>();
    let invalidCount = 0;

    for (const item of studentsData) {
      const parsed = bulkStudentItemSchema.safeParse(item);
      if (!parsed.success) {
        invalidCount++;
        continue;
      }

      const cleanNim = parsed.data.nim.trim();
      const cleanName = parsed.data.name.trim();
      const cleanClass = parsed.data.classGroup ? parsed.data.classGroup.trim() : null;

      if (cleanNim && cleanName) {
        validItems.set(cleanNim, { nim: cleanNim, name: cleanName, classGroup: cleanClass });
      } else {
        invalidCount++;
      }
    }

    if (validItems.size === 0) {
      return { success: false, message: "Tidak ada baris data valid yang dapat diimpor." };
    }

    const nims = Array.from(validItems.keys());

    // 3. Cek pendaftaran mahasiswa di Mata Kuliah ini dalam 1 query tunggal
    const existingEnrollments = await prisma.courseEnrollment.findMany({
      where: {
        courseId,
        studentNim: { in: nims },
      },
      include: {
        assistant: { select: { id: true, name: true } },
      },
    });
    const enrollmentMap = new Map(existingEnrollments.map((e) => [e.studentNim, e]));

    const conflictDetails: string[] = [];
    const studentsToUpsert: Array<{ nim: string; name: string }> = [];
    const enrollmentsToCreate: Array<{
      courseId: string;
      studentNim: string;
      assistantId: string;
      classGroup: string | null;
    }> = [];
    const enrollmentsToUpdate: Array<{
      id: string;
      classGroup: string | null;
    }> = [];

    for (const [nim, item] of validItems) {
      const existing = enrollmentMap.get(nim);

      if (existing) {
        // JIKA SUDAH DIAMPU OLEH ASPRAK LAIN: TOLAK (Aturan Ketat)
        if (session.role !== "ADMIN" && existing.assistantId !== session.userId) {
          conflictDetails.push(`${nim} (${existing.assistant.name})`);
          continue;
        }

        // Jika binaan sendiri atau user adalah admin: izinkan update nama kelas/shift
        studentsToUpsert.push({ nim: item.nim, name: item.name });
        enrollmentsToUpdate.push({ id: existing.id, classGroup: item.classGroup });
      } else {
        // Belum terdaftar di MK ini: daftarkan di bawah asprak saat ini
        studentsToUpsert.push({ nim: item.nim, name: item.name });
        enrollmentsToCreate.push({
          courseId,
          studentNim: item.nim,
          assistantId: session.userId,
          classGroup: item.classGroup,
        });
      }
    }

    // 4. Eksekusi Batch Transaksi
    await prisma.$transaction(async (tx) => {
      // Upsert master Student global
      for (const st of studentsToUpsert) {
        await tx.student.upsert({
          where: { nim: st.nim },
          update: { name: st.name },
          create: { nim: st.nim, name: st.name },
        });
      }

      // Create new enrollments
      if (enrollmentsToCreate.length > 0) {
        await tx.courseEnrollment.createMany({
          data: enrollmentsToCreate,
          skipDuplicates: true,
        });
      }

      // Update existing enrollments
      for (const en of enrollmentsToUpdate) {
        await tx.courseEnrollment.update({
          where: { id: en.id },
          data: { classGroup: en.classGroup },
        });
      }
    });

    const totalProcessed = enrollmentsToCreate.length + enrollmentsToUpdate.length;
    const otherAssistantCount = conflictDetails.length;

    revalidatePath(`/${courseId}/praktikan`);
    revalidatePath(`/${courseId}/modul`);
    revalidatePath(`/${courseId}/rekap-nilai`);

    let resultMsg = `Berhasil mendaftarkan/memperbarui ${totalProcessed} praktikan.`;
    if (otherAssistantCount > 0) {
      resultMsg += ` ${otherAssistantCount} mahasiswa DITOLAK karena sudah diampu asisten lain di MK ini (${conflictDetails.slice(0, 3).join(", ")}${
        otherAssistantCount > 3 ? "..." : ""
      }).`;
    }
    if (invalidCount > 0) {
      resultMsg += ` ${invalidCount} baris format salah dilewati.`;
    }

    return {
      success: true,
      message: resultMsg,
      count: totalProcessed,
    };
  } catch (error) {
    console.error("importStudentsToCourseAction failed", error);
    return { success: false, message: "Gagal mengimpor data praktikan." };
  }
}

/**
 * Tambah praktikan secara manual (1 per 1) ke mata kuliah
 */
export async function createStudentInCourseAction(
  courseId: string,
  input: StudentInput
): Promise<StudentActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Akses ditolak. Silakan login terlebih dahulu." };
  }

  const windowCheck = await checkWindowAccessAction("student");
  if (!windowCheck.allowed) {
    return { success: false, message: windowCheck.reason || "Periode input praktikan telah ditutup." };
  }

  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Data tidak valid: " + parsed.error.issues[0]?.message };
  }

  const { nim, name, classGroup, assistantId } = parsed.data;
  const cleanNim = nim.trim();
  const cleanName = name.trim();
  const cleanClass = classGroup?.trim() || null;

  // Tentukan assistantId: jika Admin dan menyediakan assistantId, gunakan pilihan Admin; selain itu userId pembuat
  const targetAssistantId =
    session.role === "ADMIN" && assistantId ? assistantId : session.userId;

  try {
    // 1. Cek apakah NIM sudah terdaftar di mata kuliah ini
    const existing = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentNim: { courseId, studentNim: cleanNim },
      },
      include: { assistant: { select: { id: true, name: true } } },
    });

    if (existing) {
      if (session.role !== "ADMIN" && existing.assistantId !== session.userId) {
        return {
          success: false,
          message: `Praktikan dengan NIM ${cleanNim} sudah diampu oleh asisten ${existing.assistant.name} di mata kuliah ini. Tidak boleh diampu oleh 2 asisten berbeda.`,
        };
      }

      await prisma.courseEnrollment.update({
        where: { id: existing.id },
        data: {
          classGroup: cleanClass,
          ...(session.role === "ADMIN" && assistantId ? { assistantId } : {}),
        },
      });
      await prisma.student.update({
        where: { nim: cleanNim },
        data: { name: cleanName },
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.student.upsert({
          where: { nim: cleanNim },
          update: { name: cleanName },
          create: { nim: cleanNim, name: cleanName },
        });

        await tx.courseEnrollment.create({
          data: {
            courseId,
            studentNim: cleanNim,
            assistantId: targetAssistantId,
            classGroup: cleanClass,
          },
        });
      });
    }

    revalidatePath(`/${courseId}/praktikan`);
    return { success: true, message: "Praktikan berhasil didaftarkan ke mata kuliah ini." };
  } catch (error) {
    console.error("createStudentInCourseAction failed", error);
    return { success: false, message: "Gagal menyimpan data praktikan." };
  }
}

/**
 * Dapatkan daftar praktikan di mata kuliah tertentu
 * Jika Asprak: hanya mengambil mahasiswa binaannya
 * Jika Admin: mengambil seluruh mahasiswa di mata kuliah tersebut
 */
export async function getCourseStudentsAction(courseId: string) {
  const session = await getSession();
  if (!session) return [];

  const whereClause: { courseId: string; assistantId?: string } = { courseId };
  if (session.role !== "ADMIN") {
    whereClause.assistantId = session.userId;
  }

  const enrollments = await prisma.courseEnrollment.findMany({
    where: whereClause,
    orderBy: { studentNim: "asc" },
    include: {
      student: {
        include: {
          submissions: {
            where: { module: { courseId } },
            select: {
              id: true,
              moduleId: true,
              status: true,
              grade: { select: { totalScore: true } },
            },
          },
          finalGrades: {
            where: { courseId },
          },
        },
      },
      assistant: {
        select: { id: true, name: true, username: true },
      },
    },
  });

  return enrollments.map((en) => ({
    nim: en.studentNim,
    name: en.student.name,
    classGroup: en.classGroup,
    assistantName: en.assistant.name,
    assistantId: en.assistantId,
    submissions: en.student.submissions,
    finalGrade: en.student.finalGrades[0] || null,
  }));
}

/**
 * Keluarkan praktikan dari mata kuliah
 */
export async function removeStudentFromCourseAction(
  courseId: string,
  nim: string
): Promise<StudentActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Akses ditolak" };

  try {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentNim: { courseId, studentNim: nim },
      },
    });

    if (!enrollment) {
      return { success: false, message: "Data praktikan di mata kuliah ini tidak ditemukan." };
    }

    if (session.role !== "ADMIN" && enrollment.assistantId !== session.userId) {
      return { success: false, message: "Anda tidak memiliki izin untuk mengeluarkan mahasiswa ini." };
    }

    await prisma.courseEnrollment.delete({
      where: { id: enrollment.id },
    });

    revalidatePath(`/${courseId}/praktikan`);
    return { success: true, message: "Praktikan berhasil dikeluarkan dari mata kuliah ini." };
  } catch (error) {
    console.error("removeStudentFromCourseAction failed", error);
    return { success: false, message: "Gagal memproses penghapusan praktikan." };
  }
}

/**
 * Dapatkan seluruh daftar praktikan (untuk halaman /praktikan dan /modul)
 */
export async function getStudentsAction(courseId?: string) {
  const session = await getSession();
  if (!session) return [];

  let targetCourseId = courseId;
  if (!targetCourseId) {
    const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });
    const firstCourse = await prisma.course.findFirst({
      where: activePeriod ? { academicPeriodId: activePeriod.id } : {},
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (firstCourse) {
      targetCourseId = firstCourse.id;
    }
  }

  if (!targetCourseId) return [];

  const whereClause: any = { courseId: targetCourseId };
  if (session.role !== "ADMIN") {
    whereClause.assistantId = session.userId;
  }

  const enrollments = await prisma.courseEnrollment.findMany({
    where: whereClause,
    orderBy: { studentNim: "asc" },
    include: {
      student: {
        include: {
          submissions: {
            where: { module: { courseId: targetCourseId } },
            select: {
              id: true,
              moduleId: true,
              status: true,
              grade: {
                select: { totalScore: true },
              },
            },
          },
        },
      },
      assistant: {
        select: { name: true, username: true },
      },
    },
  });

  return enrollments.map((en) => ({
    nim: en.studentNim,
    name: en.student.name,
    classGroup: en.classGroup,
    assistant: en.assistant,
    submissions: en.student.submissions,
  }));
}

/**
 * Tambah praktikan tunggal (kompatibilitas form modal global)
 */
export async function createStudentAction(input: StudentInput, courseId?: string): Promise<StudentActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Akses ditolak" };

  if (!courseId) {
    return { success: false, message: "Parameter courseId wajib disertakan." };
  }

  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Data tidak valid: " + parsed.error.issues[0]?.message };
  }

  return createStudentInCourseAction(courseId, parsed.data);
}

/**
 * Import praktikan dari file Excel (kompatibilitas modal global)
 */
export async function importStudentsAction(
  studentsData: Array<{ nim: string; name: string; classGroup?: string }>,
  courseId?: string
): Promise<StudentActionResult> {
  if (!courseId) {
    return { success: false, message: "Parameter courseId wajib disertakan." };
  }

  return importStudentsToCourseAction(courseId, studentsData);
}

/**
 * Hapus praktikan dari bimbingan
 */
export async function deleteStudentAction(nim: string, courseId?: string): Promise<StudentActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Akses ditolak" };

  if (!courseId) {
    return { success: false, message: "Parameter courseId wajib disertakan." };
  }

  try {
    const where: any = { studentNim: nim, courseId };
    if (session.role !== "ADMIN") {
      where.assistantId = session.userId;
    }

    const enrollment = await prisma.courseEnrollment.findFirst({
      where,
    });

    if (!enrollment) {
      return { success: false, message: "Data praktikan tidak ditemukan di mata kuliah ini." };
    }

    await prisma.courseEnrollment.delete({
      where: { id: enrollment.id },
    });

    revalidatePath("/praktikan");
    revalidatePath("/modul");
    revalidatePath(`/${courseId}/praktikan`);
    return { success: true, message: "Praktikan berhasil dihapus" };
  } catch (error) {
    console.error("deleteStudentAction failed", error);
    return { success: false, message: "Gagal menghapus praktikan." };
  }
}

