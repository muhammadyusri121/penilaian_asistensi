"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/security";
import { createCourseSchema, CreateCourseInput } from "../schemas/course.schema";
import { getActivePeriodAction } from "@/features/periods/actions/period.actions";
import { revalidatePath } from "next/cache";

/**
 * Otomatis seed contoh Mata Kuliah Praktikum & Modul jika database masih kosong
 */
export async function seedInitialCourseIfEmptyAction(): Promise<void> {
  const activePeriod = await getActivePeriodAction();
  if (!activePeriod) return;

  const count = await prisma.course.count({
    where: { academicPeriodId: activePeriod.id },
  });

  if (count === 0) {
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });
    if (!adminUser) return;

    await prisma.$transaction(async (tx) => {
      // 1. Course 1: Struktur Data
      const c1 = await tx.course.create({
        data: {
          academicPeriodId: activePeriod.id,
          code: "IF201",
          title: "Struktur Data & Algoritma",
          description: "Praktikum implementasi struktur data dinamis, pointer, linked list, tree, dan graph.",
          creatorId: adminUser.id,
        },
      });

      const c1Modules = [
        { title: "Modul 1: Pengenalan Sintaks & Tipe Data", isFinalReport: false },
        { title: "Modul 2: Struktur Kontrol & Perulangan", isFinalReport: false },
        { title: "Modul 3: Fungsi & Rekursi", isFinalReport: false },
        { title: "Modul 4: Array & Pointer Memory", isFinalReport: false },
        { title: "Modul 5: Struct & Linked List", isFinalReport: false },
        { title: "Modul 6: Stack & Queue", isFinalReport: false },
        { title: "Modul 7: Algoritma Searching & Sorting", isFinalReport: false },
        { title: "Laporan Akhir Praktikum", isFinalReport: true },
      ];

      for (let i = 0; i < c1Modules.length; i++) {
        await tx.module.create({
          data: {
            courseId: c1.id,
            orderIndex: i + 1,
            title: c1Modules[i].title,
            isFinalReport: c1Modules[i].isFinalReport,
          },
        });
      }

      // 2. Course 2: Basis Data
      const c2 = await tx.course.create({
        data: {
          academicPeriodId: activePeriod.id,
          code: "IF202",
          title: "Sistem Basis Data",
          description: "Praktikum DDL, DML, perancangan relasi, normalisasi, dan query kompleks PostgreSQL.",
          creatorId: adminUser.id,
        },
      });

      const c2Modules = [
        { title: "Modul 1: Perancangan ERD & Relasi", isFinalReport: false },
        { title: "Modul 2: Data Definition Language (DDL)", isFinalReport: false },
        { title: "Modul 3: Data Manipulation Language (DML)", isFinalReport: false },
        { title: "Modul 4: Join Tables & Subquery", isFinalReport: false },
        { title: "Modul 5: Agregasi & Group By", isFinalReport: false },
        { title: "Modul 6: Trigger & Stored Procedure", isFinalReport: false },
        { title: "Laporan Akhir & Proyek Basis Data", isFinalReport: true },
      ];

      for (let i = 0; i < c2Modules.length; i++) {
        await tx.module.create({
          data: {
            courseId: c2.id,
            orderIndex: i + 1,
            title: c2Modules[i].title,
            isFinalReport: c2Modules[i].isFinalReport,
          },
        });
      }
    });
  }
}

/**
 * Buat mata kuliah praktikum baru beserta modul-modul dinamisnya (Khusus ADMIN)
 */
export async function createCourseByAdminAction(input: CreateCourseInput) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, message: "Hanya Koordinator Lab (Admin) yang berhak membuat mata kuliah praktikum." };
  }

  const activePeriod = await getActivePeriodAction();
  if (!activePeriod) {
    return { success: false, message: "Tidak ada periode semester yang aktif." };
  }

  const parsed = createCourseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Validasi data gagal" };
  }

  const { code, title, description, modules } = parsed.data;

  try {
    const course = await prisma.$transaction(async (tx) => {
      const createdCourse = await tx.course.create({
        data: {
          academicPeriodId: activePeriod.id,
          code: code.trim(),
          title: title.trim(),
          description: description?.trim() || null,
          creatorId: session.userId,
        },
      });

      for (let i = 0; i < modules.length; i++) {
        const mod = modules[i];
        await tx.module.create({
          data: {
            courseId: createdCourse.id,
            orderIndex: i + 1,
            title: mod.title.trim(),
            description: mod.description?.trim() || null,
            isFinalReport: mod.isFinalReport,
          },
        });
      }

      return createdCourse;
    });

    revalidatePath("/admin/matakuliah");
    revalidatePath("/praktikum");

    return {
      success: true,
      message: `Mata kuliah ${title} dengan ${modules.length} modul berhasil dibuat.`,
      courseId: course.id,
    };
  } catch (error) {
    console.error("createCourseByAdminAction failed", error);
    return { success: false, message: "Gagal menyimpan mata kuliah praktikum." };
  }
}

/**
 * Dapatkan katalog seluruh mata kuliah praktikum di periode aktif
 * Menandai apakah pengguna saat ini sudah mengampu mata kuliah tersebut
 */
export async function getCatalogCoursesAction() {
  const session = await getSession();
  if (!session) return [];

  await seedInitialCourseIfEmptyAction();

  const activePeriod = await getActivePeriodAction();
  if (!activePeriod) return [];

  const courses = await prisma.course.findMany({
    where: { academicPeriodId: activePeriod.id },
    orderBy: { code: "asc" },
    include: {
      academicPeriod: { select: { name: true } },
      creator: { select: { name: true, username: true } },
      assistants: {
        include: {
          assistant: { select: { id: true, name: true, username: true } },
        },
      },
      modules: {
        orderBy: { orderIndex: "asc" },
      },
      _count: {
        select: {
          modules: true,
          enrollments: true,
          assistants: true,
        },
      },
    },
  });

  return courses.map((c) => {
    const isClaimedByMe = c.assistants.some((a) => a.assistantId === session.userId);
    return {
      ...c,
      isClaimedByMe,
    };
  });
}

/**
 * Asprak Mengambil / Memilih Mata Kuliah untuk Diampu
 */
export async function claimCourseAction(courseId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Silakan login terlebih dahulu." };
  }

  try {
    const existing = await prisma.courseAssistant.findUnique({
      where: {
        courseId_assistantId: {
          courseId,
          assistantId: session.userId,
        },
      },
    });

    if (existing) {
      return { success: true, message: "Anda sudah mengampu mata kuliah ini." };
    }

    await prisma.courseAssistant.create({
      data: {
        courseId,
        assistantId: session.userId,
      },
    });

    revalidatePath("/praktikum");
    revalidatePath(`/admin/matakuliah`);

    return {
      success: true,
      message: "Berhasil mengambil mata kuliah praktikum. Ruang kerja telah dibuka untuk Anda.",
    };
  } catch (error) {
    console.error("claimCourseAction failed", error);
    return { success: false, message: "Gagal mengambil mata kuliah." };
  }
}

/**
 * Asprak Berhenti Mengampu Mata Kuliah
 */
export async function unclaimCourseAction(courseId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Akses ditolak." };
  }

  try {
    // Cek apakah asprak sudah memiliki mahasiswa binaan di MK ini
    const enrolledStudentsCount = await prisma.courseEnrollment.count({
      where: {
        courseId,
        assistantId: session.userId,
      },
    });

    if (enrolledStudentsCount > 0) {
      return {
        success: false,
        message: `Tidak dapat membatalkan mata kuliah karena Anda masih memiliki ${enrolledStudentsCount} mahasiswa binaan. Pindahkan mahasiswa terlebih dahulu.`,
      };
    }

    await prisma.courseAssistant.deleteMany({
      where: {
        courseId,
        assistantId: session.userId,
      },
    });

    revalidatePath("/praktikum");
    return { success: true, message: "Berhasil melepaskan mata kuliah praktikum." };
  } catch (error) {
    console.error("unclaimCourseAction failed", error);
    return { success: false, message: "Gagal memproses pembatalan pengampuan." };
  }
}

/**
 * Dapatkan rincian satu mata kuliah beserta modul-modulnya
 */
export async function getCourseByIdAction(courseId: string) {
  const session = await getSession();
  if (!session) return null;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      creator: { select: { id: true, name: true, username: true } },
      assistants: {
        include: {
          assistant: { select: { id: true, name: true, username: true } },
        },
      },
      modules: {
        orderBy: { orderIndex: "asc" },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });

  if (!course) return null;

  if (session.role !== "ADMIN") {
    const isCreator = course.creatorId === session.userId;
    const isAssigned = course.assistants.some((a) => a.assistantId === session.userId);
    if (!isCreator && !isAssigned) {
      return null;
    }
  }

  return course;
}
