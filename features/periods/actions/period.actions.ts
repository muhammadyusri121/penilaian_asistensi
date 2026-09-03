"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/security";
import { periodSchema, PeriodInput } from "../schemas/period.schema";
import { revalidatePath } from "next/cache";

/**
 * Otomatis inisialisasi default periode akademik aktif jika belum ada
 */
export async function ensureDefaultPeriod(): Promise<string> {
  const active = await prisma.academicPeriod.findFirst({
    where: { isActive: true },
  });
  if (active) return active.id;

  const now = new Date();
  const nextThreeMonths = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const created = await prisma.academicPeriod.create({
    data: {
      name: "Semester Gasal 2026/2027",
      isActive: true,
      studentInputStart: now,
      studentInputEnd: nextThreeMonths,
    },
  });

  return created.id;
}

/**
 * Ambil periode akademik yang sedang aktif
 */
export async function getActivePeriodAction() {
  await ensureDefaultPeriod();
  return prisma.academicPeriod.findFirst({
    where: { isActive: true },
  });
}

/**
 * Ambil seluruh riwayat periode akademik
 */
export async function getAllPeriodsAction() {
  await ensureDefaultPeriod();
  return prisma.academicPeriod.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { courses: true } },
    },
  });
}

/**
 * Buat periode akademik baru (Khusus ADMIN)
 */
export async function createPeriodAction(input: PeriodInput) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, message: "Hanya Koordinator Lab yang dapat membuat periode akademik." };
  }

  const parsed = periodSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Validasi gagal" };
  }

  try {
    const data = parsed.data;

    await prisma.$transaction(async (tx) => {
      // Jika diset aktif, nonaktifkan periode lain
      if (data.isActive) {
        await tx.academicPeriod.updateMany({
          data: { isActive: false },
        });
      }

      await tx.academicPeriod.create({
        data: {
          name: data.name,
          isActive: data.isActive,
          studentInputStart: new Date(data.studentInputStart),
          studentInputEnd: new Date(data.studentInputEnd),
        },
      });
    });

    revalidatePath("/admin/periode");
    return { success: true, message: "Periode akademik berhasil dibuat." };
  } catch (error) {
    console.error("createPeriodAction failed", error);
    return { success: false, message: "Gagal menyimpan periode akademik." };
  }
}

/**
 * Setel periode tertentu menjadi periode aktif (Khusus ADMIN)
 */
export async function setActivePeriodAction(periodId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.academicPeriod.updateMany({
        data: { isActive: false },
      });

      await tx.academicPeriod.update({
        where: { id: periodId },
        data: { isActive: true },
      });
    });

    revalidatePath("/admin/periode");
    revalidatePath("/modul");
    return { success: true, message: "Periode aktif berhasil diperbarui." };
  } catch (error) {
    console.error("setActivePeriodAction failed", error);
    return { success: false, message: "Gagal memperbarui periode aktif." };
  }
}

/**
 * Validasi apakah jendela waktu penginputan praktikan saat ini sedang terbuka
 */
export async function checkWindowAccessAction(windowType: "student" = "student"): Promise<{
  allowed: boolean;
  reason?: string;
  periodName?: string;
}> {
  const session = await getSession();
  if (!session) return { allowed: false, reason: "Silakan login terlebih dahulu." };

  // Admin selalu memiliki hak akses penuh (Bypass jadwal)
  if (session.role === "ADMIN") {
    return { allowed: true };
  }

  const active = await getActivePeriodAction();
  if (!active) {
    return { allowed: false, reason: "Tidak ada periode semester yang aktif saat ini." };
  }

  const now = new Date();
  if (now < new Date(active.studentInputStart)) {
    return {
      allowed: false,
      reason: `Periode input mahasiswa belum dibuka (Buka: ${active.studentInputStart.toLocaleDateString("id-ID")}).`,
      periodName: active.name,
    };
  }
  if (now > new Date(active.studentInputEnd)) {
    return {
      allowed: false,
      reason: `Periode input mahasiswa telah ditutup sejak ${active.studentInputEnd.toLocaleDateString("id-ID")}. Hubungi Koordinator Lab untuk pembukaan susulan.`,
      periodName: active.name,
    };
  }

  return { allowed: true, periodName: active.name };
}
