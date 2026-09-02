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

  try {
    // 1. Sanitasi dan deduplikasi data di memory berdasarkan NIM
    const validItems = new Map<string, { nim: string; name: string; classGroup: string | null }>();
    let invalidOrSkippedCount = 0;

    for (const item of studentsData) {
      const parsed = bulkStudentItemSchema.safeParse(item);
      if (!parsed.success) {
        invalidOrSkippedCount++;
        continue;
      }

      const cleanNim = parsed.data.nim.trim();
      const cleanName = parsed.data.name.trim();
      const cleanClass = parsed.data.classGroup ? parsed.data.classGroup.trim() : null;

      if (cleanNim && cleanName) {
        validItems.set(cleanNim, { nim: cleanNim, name: cleanName, classGroup: cleanClass });
      } else {
        invalidOrSkippedCount++;
      }
    }

    if (validItems.size === 0) {
      return {
        success: false,
        message: "Tidak ada baris data valid yang dapat diimpor (seluruh baris dilewati/invalid).",
      };
    }

    const nims = Array.from(validItems.keys());

    // 2. Ambil seluruh data yang sudah ada di database dalam 1 query tunggal
    const existingStudents = await prisma.student.findMany({
      where: { nim: { in: nims } },
      select: { nim: true, assistantId: true },
    });
    const existingMap = new Map<string, { nim: string; assistantId: string | null }>(
      existingStudents.map((s: { nim: string; assistantId: string | null }) => [s.nim, s])
    );

    const toCreate: Array<{ nim: string; name: string; classGroup: string | null; assistantId: string }> = [];
    const updateOperations = [];
    let foreignOwnerSkipped = 0;

    for (const [nim, item] of validItems) {
      const existing = existingMap.get(nim);
      if (!existing) {
        toCreate.push({
          nim: item.nim,
          name: item.name,
          classGroup: item.classGroup,
          assistantId: session.userId,
        });
      } else {
        // Jangan timpa mahasiswa binaan asisten lain jika bukan ADMIN
        if (session.role !== "ADMIN" && existing.assistantId && existing.assistantId !== session.userId) {
          foreignOwnerSkipped++;
          continue;
        }

        updateOperations.push(
          prisma.student.update({
            where: { nim },
            data: {
              name: item.name,
              classGroup: item.classGroup,
              assistantId: existing.assistantId ?? session.userId,
            },
          })
        );
      }
    }

    // 3. Eksekusi batch: createMany dalam 1 query
    let createdCount = 0;
    if (toCreate.length > 0) {
      const createRes = await prisma.student.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
      createdCount = createRes.count;
    }

    // 4. Eksekusi update dalam chunked transaction untuk efisiensi maksimal
    if (updateOperations.length > 0) {
      const CHUNK_SIZE = 50;
      for (let i = 0; i < updateOperations.length; i += CHUNK_SIZE) {
        const chunk = updateOperations.slice(i, i + CHUNK_SIZE);
        await prisma.$transaction(chunk);
      }
    }

    const totalProcessed = createdCount + updateOperations.length;
    const totalSkipped = invalidOrSkippedCount + foreignOwnerSkipped;

    revalidatePath("/praktikan");
    revalidatePath("/modul");
    revalidatePath("/rekap-nilai");

    const message =
      totalSkipped > 0
        ? `Berhasil mengimpor/memperbarui ${totalProcessed} data praktikan (${totalSkipped} data dilewati: ${
            foreignOwnerSkipped > 0 ? `${foreignOwnerSkipped} milik asisten lain, ` : ""
          }${invalidOrSkippedCount} invalid/kosong).`
        : `Berhasil mengimpor/memperbarui ${totalProcessed} data praktikan.`;

    return {
      success: true,
      message,
      count: totalProcessed,
    };
  } catch (error) {
    console.error("importStudentsAction failed", error);
    return { success: false, message: "Gagal mengimpor data praktikan." };
  }
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
  const cleanNim = nim.trim();
  const cleanName = name.trim();
  const cleanClass = classGroup?.trim() || null;

  try {
    const existing = await prisma.student.findUnique({
      where: { nim: cleanNim },
      select: { assistantId: true },
    });

    if (existing) {
      if (session.role !== "ADMIN" && existing.assistantId && existing.assistantId !== session.userId) {
        return {
          success: false,
          message: "Praktikan dengan NIM ini sudah terdaftar di bawah binaan asisten lain.",
        };
      }

      await prisma.student.update({
        where: { nim: cleanNim },
        data: {
          name: cleanName,
          classGroup: cleanClass,
          assistantId: existing.assistantId ?? session.userId,
        },
      });
    } else {
      await prisma.student.create({
        data: {
          nim: cleanNim,
          name: cleanName,
          classGroup: cleanClass,
          assistantId: session.userId,
        },
      });
    }

    revalidatePath("/praktikan");
    return { success: true, message: "Data praktikan berhasil disimpan." };
  } catch (error) {
    console.error("createStudentAction failed", error);
    return { success: false, message: "Gagal menyimpan data praktikan." };
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
    const student = await prisma.student.findUnique({
      where: { nim },
      select: { assistantId: true },
    });

    if (!student) {
      return { success: false, message: "Data praktikan tidak ditemukan." };
    }

    if (session.role !== "ADMIN" && student.assistantId !== session.userId) {
      return {
        success: false,
        message: "Akses ditolak. Anda tidak memiliki izin untuk menghapus praktikan ini.",
      };
    }

    await prisma.student.delete({
      where: { nim },
    });
    revalidatePath("/praktikan");
    return { success: true, message: "Praktikan berhasil dihapus" };
  } catch (error) {
    console.error("deleteStudentAction failed", error);
    return { success: false, message: "Gagal menghapus praktikan." };
  }
}
