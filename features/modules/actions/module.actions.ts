"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/security";
import { revalidatePath } from "next/cache";
import { seedInitialCourseIfEmptyAction } from "@/features/courses/actions/course.actions";
import { verifyAndConsumeCaptcha } from "@/lib/captcha";

/**
 * Dapatkan seluruh modul praktikum yang aktif
 */
export async function getModulesAction(courseId?: string) {
  const session = await getSession();
  if (!session) return [];

  // Pastikan contoh mata kuliah & modul ter-seed jika masih kosong
  await seedInitialCourseIfEmptyAction();

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
    return [];
  }

  const submissionsWhere =
    session.role === "ADMIN"
      ? {}
      : { student: { enrollments: { some: { assistantId: session.userId, courseId: targetCourseId } } } };

  return prisma.module.findMany({
    where: { courseId: targetCourseId },
    orderBy: { orderIndex: "asc" },
    include: {
      course: {
        select: { id: true, code: true, title: true },
      },
      _count: {
        select: {
          submissions: {
            where: submissionsWhere,
          },
        },
      },
    },
  });
}

/**
 * Tambah modul baru secara dinamis
 */
export async function createModuleAction(data: {
  courseId?: string;
  title: string;
  orderIndex: number;
  description?: string;
  isFinalReport?: boolean;
}) {
  const session = await getSession();
  if (!session) throw new Error("Akses ditolak");

  let targetCourseId = data.courseId;
  if (!targetCourseId) {
    const firstCourse = await prisma.course.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!firstCourse) {
      throw new Error("Belum ada mata kuliah yang dibuat. Buat mata kuliah terlebih dahulu.");
    }
    targetCourseId = firstCourse.id;
  }

  const newMod = await prisma.module.create({
    data: {
      courseId: targetCourseId,
      title: data.title,
      orderIndex: data.orderIndex,
      description: data.description,
      isFinalReport: data.isFinalReport ?? false,
    },
  });

  revalidatePath("/modul");
  revalidatePath("/rekap-nilai");
  revalidatePath(`/${targetCourseId}/modul`);
  return newMod;
}

/**
 * Hapus modul praktikum tertentu beserta seluruh data nilai/tugas di dalamnya (Khusus ADMIN)
 * Dilindungi verifikasi Captcha 6 Karakter
 */
export async function deleteModuleAction(
  moduleId: string,
  captchaToken: string,
  captchaInput: string
): Promise<{ success: boolean; message: string }> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return {
      success: false,
      message: "Akses ditolak. Hanya Koordinator Lab (Admin) yang berhak menghapus modul.",
    };
  }

  const captchaCheck = await verifyAndConsumeCaptcha(
    captchaToken,
    captchaInput,
    "DELETE_MODULE",
    moduleId,
    session.userId
  );

  if (!captchaCheck.valid) {
    return {
      success: false,
      message: captchaCheck.message || "Kode captcha verifikasi tidak cocok. Silakan coba lagi.",
    };
  }

  try {
    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      select: {
        id: true,
        title: true,
        courseId: true,
      },
    });

    if (!mod) {
      return { success: false, message: "Modul praktikum tidak ditemukan." };
    }

    const totalModules = await prisma.module.count({
      where: { courseId: mod.courseId },
    });

    if (totalModules <= 1) {
      return {
        success: false,
        message: "Gagal menghapus. Mata kuliah harus memiliki minimal 1 modul praktikum.",
      };
    }

    // Hapus modul - Submission, File, dan Grade otomatis terhapus via ON DELETE CASCADE
    await prisma.module.delete({
      where: { id: moduleId },
    });

    // Re-index orderIndex modul yang tersisa secara berurutan
    const remainingModules = await prisma.module.findMany({
      where: { courseId: mod.courseId },
      orderBy: { orderIndex: "asc" },
      select: { id: true, orderIndex: true },
    });

    for (let i = 0; i < remainingModules.length; i++) {
      const newOrder = i + 1;
      if (remainingModules[i].orderIndex !== newOrder) {
        await prisma.module.update({
          where: { id: remainingModules[i].id },
          data: { orderIndex: newOrder },
        });
      }
    }

    revalidatePath(`/${mod.courseId}/modul`);
    revalidatePath(`/admin/matakuliah/${mod.courseId}/edit`);
    revalidatePath("/admin/matakuliah");
    revalidatePath("/admin/rekap-nilai");
    revalidatePath("/modul");

    return {
      success: true,
      message: `Modul "${mod.title}" beserta seluruh data di dalamnya berhasil dihapus.`,
    };
  } catch (error) {
    console.error("deleteModuleAction failed", error);
    return {
      success: false,
      message: "Gagal menghapus modul praktikum.",
    };
  }
}

