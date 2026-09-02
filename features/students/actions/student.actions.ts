"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/security";
import { bulkStudentItemSchema, studentSchema, StudentInput } from "../schemas/student.schema";
import { revalidatePath } from "next/cache";

export interface StudentActionResult {
  success: boolean;
  message: string;
  count?: number;
}

/**
 * Import mahasiswa secara masal dari data Excel/CSV yang sudah diparsing
 */
export async function importStudentsAction(
  studentsData: Array<{ nim: string; name: string; classGroup?: string }>
): Promise<StudentActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Akses ditolak. Silakan login terlebih dahulu." };
  }

  if (!Array.isArray(studentsData) || studentsData.length === 0) {
    return { success: false, message: "Tidak ada data mahasiswa yang ditemukan dalam file." };
  }

  let successCount = 0;

  for (const item of studentsData) {
    const parsed = bulkStudentItemSchema.safeParse(item);
    if (!parsed.success) continue;

    const { nim, name, classGroup } = parsed.data;
    const cleanNim = nim.trim();
    const cleanName = name.trim();
    const cleanClass = classGroup ? classGroup.trim() : null;

    await prisma.student.upsert({
      where: { nim: cleanNim },
      update: {
        name: cleanName,
        classGroup: cleanClass,
        // Jika belum ada asisten, kaitkan ke asisten yang mengimpor
        assistantId: session.userId,
      },
      create: {
        nim: cleanNim,
        name: cleanName,
        classGroup: cleanClass,
        assistantId: session.userId,
      },
    });

    successCount++;
  }

  revalidatePath("/praktikan");
  revalidatePath("/modul");
  revalidatePath("/rekap-nilai");

  return {
    success: true,
    message: `Berhasil mengimpor/memperbarui ${successCount} data praktikan.`,
    count: successCount,
  };
}

/**
 * Tambah praktikan secara manual (1 per 1)
 */
export async function createStudentAction(input: StudentInput): Promise<StudentActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Akses ditolak. Silakan login terlebih dahulu." };
  }

  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Data tidak valid: " + parsed.error.issues[0]?.message };
  }

  const { nim, name, classGroup } = parsed.data;

  try {
    await prisma.student.upsert({
      where: { nim: nim.trim() },
      update: {
        name: name.trim(),
        classGroup: classGroup?.trim() || null,
      },
      create: {
        nim: nim.trim(),
        name: name.trim(),
        classGroup: classGroup?.trim() || null,
        assistantId: session.userId,
      },
    });

    revalidatePath("/praktikan");
    return { success: true, message: "Data praktikan berhasil disimpan." };
  } catch (error) {
    return { success: false, message: "Gagal menyimpan data: " + String(error) };
  }
}

/**
 * Dapatkan daftar seluruh praktikan binaan asprak saat ini (atau semua jika Admin)
 */
export async function getStudentsAction() {
  const session = await getSession();
  if (!session) return [];

  const whereClause = session.role === "ADMIN" ? {} : { assistantId: session.userId };

  return prisma.student.findMany({
    where: whereClause,
    orderBy: { nim: "asc" },
    include: {
      assistant: {
        select: { name: true, username: true },
      },
      submissions: {
        select: {
          id: true,
          moduleId: true,
          status: true,
          grade: {
            select: { totalScore: true },
          },
        },
      },
      finalGrade: true,
    },
  });
}

/**
 * Hapus praktikan
 */
export async function deleteStudentAction(nim: string): Promise<StudentActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Akses ditolak" };

  try {
    await prisma.student.delete({
      where: { nim },
    });
    revalidatePath("/praktikan");
    return { success: true, message: "Praktikan berhasil dihapus" };
  } catch (error) {
    return { success: false, message: "Gagal menghapus praktikan: " + String(error) };
  }
}
