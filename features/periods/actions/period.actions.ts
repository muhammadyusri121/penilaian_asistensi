"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/security";
import { verifyAndConsumeCaptcha } from "@/lib/captcha";
import { periodSchema, PeriodInput } from "../schemas/period.schema";
import { revalidatePath } from "next/cache";

/**
 * Otomatis inisialisasi default periode akademik aktif jika belum ada
 */
export async function ensureDefaultPeriod(allowActivateExisting = false): Promise<string | null> {
  const active = await prisma.academicPeriod.findFirst({
    where: { isActive: true },
  });

  if (active) {
    return active.id;
  }

  // Jika ada periode lain di DB, periksa apakah boleh mengaktifkan secara eksplisit
  const existing = await prisma.academicPeriod.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    if (allowActivateExisting) {
      await prisma.academicPeriod.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
      return existing.id;
    }
    // Jika tidak diizinkan aktivasi otomatis (misal admin sengaja menonaktifkan seluruh periode), jangan ubah status
    return null;
  }

  const now = new Date();
  const nextThreeMonths = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const created = await (prisma.academicPeriod.create as any)({
    data: {
      name: "Semester Gasal 2026/2027",
      isActive: true,
      courseInputStart: now,
      courseInputEnd: nextThreeMonths,
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
  const active = await prisma.academicPeriod.findFirst({
    where: { isActive: true },
  });

  if (active) return active;

  // Hanya jika benar-benar database kosong (first-time setup)
  const count = await prisma.academicPeriod.count();
  if (count === 0) {
    await ensureDefaultPeriod(true);
    return prisma.academicPeriod.findFirst({
      where: { isActive: true },
    });
  }

  // Jika periode ada tetapi seluruhnya dinonaktifkan admin, biarkan null
  return null;
}

/**
 * Ambil seluruh riwayat periode akademik
 */
export async function getAllPeriodsAction() {
  const periods = await prisma.academicPeriod.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { courses: true } },
    },
  });

  if (periods.length > 0) return periods;

  // Hanya jalankan inisialisasi default jika database kosong melompong
  await ensureDefaultPeriod(true);
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

      await (tx.academicPeriod.create as any)({
        data: {
          name: data.name,
          isActive: data.isActive,
          courseInputStart: data.courseInputStart
            ? new Date(data.courseInputStart)
            : new Date(data.studentInputStart),
          courseInputEnd: data.courseInputEnd
            ? new Date(data.courseInputEnd)
            : new Date(data.studentInputEnd),
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
 * Update jadwal periode (buka/tutup klaim MK & input praktikan) - Khusus ADMIN
 */
export async function updatePeriodDatesAction(
  periodId: string,
  input: {
    courseInputStart?: string;
    courseInputEnd?: string;
    studentInputStart?: string;
    studentInputEnd?: string;
  }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak." };
  }

  try {
    const updateData: any = {};
    if (input.courseInputStart) updateData.courseInputStart = new Date(input.courseInputStart);
    if (input.courseInputEnd) updateData.courseInputEnd = new Date(input.courseInputEnd);
    if (input.studentInputStart) updateData.studentInputStart = new Date(input.studentInputStart);
    if (input.studentInputEnd) updateData.studentInputEnd = new Date(input.studentInputEnd);

    await (prisma.academicPeriod.update as any)({
      where: { id: periodId },
      data: updateData,
    });

    revalidatePath("/admin/periode");
    revalidatePath("/praktikum");
    return { success: true, message: "Jadwal periode berhasil diperbarui." };
  } catch (error) {
    console.error("updatePeriodDatesAction failed", error);
    return { success: false, message: "Gagal memperbarui jadwal periode." };
  }
}

/**
 * Validasi apakah jendela waktu penginputan praktikan saat ini sedang terbuka
 */
export async function checkWindowAccessAction(windowType: "student" | "course" = "student"): Promise<{
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

  if (windowType === "course") {
    const courseStart = active.courseInputStart ? new Date(active.courseInputStart) : new Date(active.studentInputStart);
    const courseEnd = active.courseInputEnd ? new Date(active.courseInputEnd) : new Date(active.studentInputEnd);

    if (now < courseStart) {
      return {
        allowed: false,
        reason: "Periode pengambilan mata kuliah belum dibuka.",
        periodName: active.name,
      };
    }
    if (now > courseEnd) {
      return {
        allowed: false,
        reason: "Periode pengambilan mata kuliah sudah ditutup.",
        periodName: active.name,
      };
    }
    return { allowed: true, periodName: active.name };
  }

  if (now < new Date(active.studentInputStart)) {
    return {
      allowed: false,
      reason: "Periode input mahasiswa belum dibuka.",
      periodName: active.name,
    };
  }
  if (now > new Date(active.studentInputEnd)) {
    return {
      allowed: false,
      reason: "Periode input mahasiswa telah ditutup. Hubungi Koordinator Lab untuk pembukaan susulan.",
      periodName: active.name,
    };
  }

  return { allowed: true, periodName: active.name };
}

/**
 * Buka atau Tutup Jendela (Klaim MK atau Input Praktikan) secara instan
 * Admin dapat menentukan tanggal & jam tutup otomatis (default: 7 hari dari sekarang)
 */
export async function togglePeriodWindowAction(
  periodId: string,
  windowType: "course" | "student",
  action: "open" | "close",
  autoCloseDate?: string
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak." };
  }

  try {
    const period = await prisma.academicPeriod.findUnique({
      where: { id: periodId },
    });
    if (!period) return { success: false, message: "Periode tidak ditemukan." };

    const now = new Date();
    const updateData: any = {};

    if (action === "open") {
      // Set start waktu ke 1 menit yang lalu agar langsung aktif seketika
      const startDate = new Date(now.getTime() - 60 * 1000);
      // Jika autoCloseDate disediakan, pakai itu, kalau tidak default 7 hari
      const endDate = autoCloseDate
        ? new Date(autoCloseDate)
        : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      if (windowType === "course") {
        updateData.courseInputStart = startDate;
        updateData.courseInputEnd = endDate;
      } else {
        updateData.studentInputStart = startDate;
        updateData.studentInputEnd = endDate;
      }
    } else {
      // Tutup langsung: set end waktu ke 1 detik yang lalu
      const closedDate = new Date(now.getTime() - 1000);
      if (windowType === "course") {
        updateData.courseInputEnd = closedDate;
      } else {
        updateData.studentInputEnd = closedDate;
      }
    }

    await (prisma.academicPeriod.update as any)({
      where: { id: periodId },
      data: updateData,
    });

    revalidatePath("/admin/periode");
    revalidatePath("/praktikum");
    return {
      success: true,
      message: `Jendela ${windowType === "course" ? "Klaim MK (Asprak)" : "Input Praktikan"} berhasil ${action === "open" ? "dibuka" : "ditutup"}.`,
    };
  } catch (error) {
    console.error("togglePeriodWindowAction failed", error);
    return { success: false, message: "Gagal mengubah status jendela." };
  }
}

/**
 * Sesuaikan waktu penutupan otomatis jendela periode
 */
export async function updateWindowAutoCloseAction(
  periodId: string,
  windowType: "course" | "student",
  autoCloseDate: string
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak." };
  }

  try {
    const updateData: any = {};
    const endDate = new Date(autoCloseDate);

    if (windowType === "course") {
      updateData.courseInputEnd = endDate;
    } else {
      updateData.studentInputEnd = endDate;
    }

    await (prisma.academicPeriod.update as any)({
      where: { id: periodId },
      data: updateData,
    });

    revalidatePath("/admin/periode");
    revalidatePath("/praktikum");
    return {
      success: true,
      message: `Waktu tutup otomatis jendela ${windowType === "course" ? "Klaim MK (Asprak)" : "Input Praktikan"} berhasil diperbarui.`,
    };
  } catch (error) {
    console.error("updateWindowAutoCloseAction failed", error);
    return { success: false, message: "Gagal memperbarui waktu tutup otomatis." };
  }
}

/**
 * Hapus Periode Akademik beserta seluruh data terkait di dalamnya (Khusus ADMIN)
 * Memerlukan token challenge CAPTCHA bertanda tangan server
 */
export async function deletePeriodAction(
  periodId: string,
  captchaToken: string,
  captchaInput: string
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak. Hanya Administrator yang berhak menghapus periode." };
  }

  const captchaCheck = await verifyAndConsumeCaptcha(
    captchaToken,
    captchaInput,
    "DELETE_PERIOD",
    periodId,
    session.userId
  );

  if (!captchaCheck.valid) {
    return {
      success: false,
      message: captchaCheck.message || "Kode verifikasi tidak valid atau kedaluwarsa.",
    };
  }

  try {
    const period = await prisma.academicPeriod.findUnique({
      where: { id: periodId },
      select: { id: true, name: true, isActive: true },
    });

    if (!period) {
      return { success: false, message: "Periode akademik tidak ditemukan." };
    }

    // Hapus periode akademik langsung - relasi Course, Module, Submission, Grade, dll.
    // akan dihapus secara otomatis dan instan oleh foreign key constraint ON DELETE CASCADE PostgreSQL
    await prisma.academicPeriod.delete({
      where: { id: periodId },
    });

    // Jika periode yang dihapus adalah periode aktif, aktifkan periode lain yang tersisa (jika ada)
    if (period.isActive) {
      const nextPeriod = await prisma.academicPeriod.findFirst({
        orderBy: { createdAt: "desc" },
      });
      if (nextPeriod) {
        await prisma.academicPeriod.update({
          where: { id: nextPeriod.id },
          data: { isActive: true },
        });
      }
    }


    revalidatePath("/admin/periode");
    revalidatePath("/admin/matakuliah");
    revalidatePath("/praktikum");
    revalidatePath("/rekap-nilai");
    if (period.isActive) {
      revalidatePath("/modul");
    }

    return {
      success: true,
      message: `Periode "${period.name}" beserta seluruh mata kuliah dan data di dalamnya berhasil dihapus permanen.`,
    };
  } catch (error) {
    console.error("deletePeriodAction failed", error);
    return { success: false, message: "Gagal menghapus periode akademik." };
  }
}

