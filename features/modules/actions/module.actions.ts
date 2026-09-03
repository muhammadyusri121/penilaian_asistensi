"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/security";
import { revalidatePath } from "next/cache";
import { seedInitialCourseIfEmptyAction } from "@/features/courses/actions/course.actions";

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
