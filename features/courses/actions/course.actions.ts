"use server";

import { prisma, withDbRetry } from "@/lib/prisma";
import { getSession } from "@/lib/security";
import { verifyAndConsumeCaptcha } from "@/lib/captcha";
import {
  createCourseSchema,
  CreateCourseInput,
  updateCourseSchema,
  UpdateCourseInput,
} from "../schemas/course.schema";
import {
  getActivePeriodAction,
  checkWindowAccessAction,
} from "@/features/periods/actions/period.actions";
import { revalidatePath } from "next/cache";

/**
 * Seeding awal dilakukan melalui script khusus (npm run seed:admin).
 * Runtime auto-seeding dimatikan agar tidak menimbulkan race condition,
 * kehabisan koneksi database pool, atau mengembalikan data yang sengaja dihapus admin.
 */
export async function seedInitialCourseIfEmptyAction(): Promise<void> {
  return;
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

  const {
    code,
    title,
    description,
    scheduleDay,
    scheduleTime,
    modules,
    weightAttendance,
    weightAssignment,
    weightPretest,
    weightUts,
    weightUas,
  } = parsed.data;

  try {
    const course = await prisma.$transaction(async (tx) => {
      const createdCourse = await tx.course.create({
        data: {
          academicPeriodId: activePeriod.id,
          code: code.trim(),
          title: title.trim(),
          description: description?.trim() || null,
          scheduleDay: scheduleDay?.trim() || null,
          scheduleTime: scheduleTime?.trim() || null,
          weightAttendance: weightAttendance ?? 10,
          weightAssignment: weightAssignment ?? 20,
          weightPretest: weightPretest ?? 10,
          weightUts: weightUts ?? 25,
          weightUas: weightUas ?? 35,
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
  } catch (error: any) {
    console.error("createCourseByAdminAction failed", error);
    return { success: false, message: error?.message || "Gagal menyimpan mata kuliah praktikum." };
  }
}

/**
 * Edit Nama Mata Kuliah dan Judul Modul (Khusus ADMIN)
 */
export async function updateCourseByAdminAction(courseId: string, input: UpdateCourseInput) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, message: "Hanya Koordinator Lab (Admin) yang berhak mengedit mata kuliah." };
  }

  const parsed = updateCourseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Validasi data gagal" };
  }

  const {
    code,
    title,
    description,
    scheduleDay,
    scheduleTime,
    modules,
    weightAttendance,
    weightAssignment,
    weightPretest,
    weightUts,
    weightUas,
  } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update detail Course & bobot persentase secara typed
      await tx.course.update({
        where: { id: courseId },
        data: {
          code: code.trim(),
          title: title.trim(),
          description: description?.trim() || null,
          scheduleDay: scheduleDay?.trim() || null,
          scheduleTime: scheduleTime?.trim() || null,
          weightAttendance: weightAttendance ?? 10,
          weightAssignment: weightAssignment ?? 20,
          weightPretest: weightPretest ?? 10,
          weightUts: weightUts ?? 25,
          weightUas: weightUas ?? 35,
        },
      });

      // 3. Ambil modul-modul yang saat ini ada di DB
      const existingModules = await tx.module.findMany({
        where: { courseId },
      });

      const incomingModuleIds = new Set(modules.filter((m) => m.id).map((m) => m.id as string));

      // Hapus modul yang tidak ada lagi di daftar baru (jika tidak memiliki nilai)
      for (const exMod of existingModules) {
        if (!incomingModuleIds.has(exMod.id)) {
          const submissionCount = await tx.submission.count({
            where: { moduleId: exMod.id },
          });
          if (submissionCount === 0) {
            await tx.module.delete({ where: { id: exMod.id } });
          }
        }
      }

      // Upsert/Update tiap modul dengan orderIndex baru
      for (let i = 0; i < modules.length; i++) {
        const mod = modules[i];
        if (mod.id) {
          await tx.module.update({
            where: { id: mod.id },
            data: {
              orderIndex: i + 1,
              title: mod.title.trim(),
              description: mod.description?.trim() || null,
              isFinalReport: mod.isFinalReport,
            },
          });
        } else {
          await tx.module.create({
            data: {
              courseId,
              orderIndex: i + 1,
              title: mod.title.trim(),
              description: mod.description?.trim() || null,
              isFinalReport: mod.isFinalReport,
            },
          });
        }
      }
    });

    revalidatePath("/admin/matakuliah");
    revalidatePath(`/admin/matakuliah/${courseId}/edit`);
    revalidatePath("/praktikum");
    revalidatePath(`/${courseId}/modul`);

    return {
      success: true,
      message: `Mata kuliah ${title} dan daftar modul berhasil diperbarui.`,
    };
  } catch (error: any) {
    console.error("updateCourseByAdminAction failed", error);
    return { success: false, message: error?.message || "Gagal memperbarui data mata kuliah." };
  }
}

/**
 * Hapus Mata Kuliah Praktikum beserta seluruh modul, tugas, nilai, dan relasinya (Khusus ADMIN)
 * Dilindungi verifikasi Captcha 6 Karakter
 */
export async function deleteCourseByAdminAction(
  courseId: string,
  captchaToken: string,
  captchaInput: string
): Promise<{ success: boolean; message: string }> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return {
      success: false,
      message: "Akses ditolak. Hanya Koordinator Lab (Admin) yang berhak menghapus mata kuliah.",
    };
  }

  const captchaCheck = await verifyAndConsumeCaptcha(
    captchaToken,
    captchaInput,
    "DELETE_COURSE",
    courseId,
    session.userId
  );

  if (!captchaCheck.valid) {
    return {
      success: false,
      message: captchaCheck.message || "Kode captcha verifikasi tidak cocok. Silakan coba lagi.",
    };
  }

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, code: true },
    });

    if (!course) {
      return { success: false, message: "Mata kuliah tidak ditemukan." };
    }

    // Hapus mata kuliah - seluruh Module, Submission, Grade, Attendance, Pretest,
    // FinalGrade, CourseEnrollment, CourseAssistant otomatis terhapus via ON DELETE CASCADE
    await prisma.course.delete({
      where: { id: courseId },
    });

    revalidatePath("/admin/matakuliah");
    revalidatePath(`/admin/matakuliah/${courseId}/edit`);
    revalidatePath("/praktikum");
    revalidatePath("/admin/rekap-nilai");
    revalidatePath("/rekap-nilai");

    return {
      success: true,
      message: `Mata kuliah "${course.code} - ${course.title}" beserta seluruh data di dalamnya berhasil dihapus.`,
    };
  } catch (error) {
    console.error("deleteCourseByAdminAction failed", error);
    return { success: false, message: "Gagal menghapus mata kuliah praktikum." };
  }
}

/**
 * Dapatkan katalog seluruh mata kuliah praktikum di periode aktif
 * Menandai status pengajuan/pengampuan pengguna saat ini
 */
export async function getCatalogCoursesAction() {
  const session = await getSession();
  if (!session) return [];

  const activePeriod = await getActivePeriodAction();
  if (!activePeriod) return [];

  const courses = await withDbRetry(() =>
    prisma.course.findMany({
      where: { academicPeriodId: activePeriod.id },
      orderBy: { code: "asc" },
      include: {
        creator: { select: { name: true, username: true } },
        assistants: {
          include: {
            assistant: { select: { id: true, name: true, username: true } },
          },
        },
        modules: {
          orderBy: { orderIndex: "asc" },
          select: { id: true, title: true, isFinalReport: true, orderIndex: true },
        },
        _count: {
          select: {
            modules: true,
            enrollments: true,
            assistants: true,
          },
        },
      },
    })
  );

  const now = new Date();
  const courseStart = activePeriod.courseInputStart
    ? new Date(activePeriod.courseInputStart)
    : new Date(activePeriod.studentInputStart);
  const courseEnd = activePeriod.courseInputEnd
    ? new Date(activePeriod.courseInputEnd)
    : new Date(activePeriod.studentInputEnd);
  const isCourseClaimOpen = now >= courseStart && now <= courseEnd;

  let mappedCourses = courses.map((c) => {
    const myAssignment = c.assistants.find((a) => a.assistantId === session.userId);
    const isClaimedByMe = !!myAssignment;
    const myProposalStatus = myAssignment?.status || null;
    return {
      ...c,
      academicPeriod: {
        name: activePeriod.name,
        courseInputStart: activePeriod.courseInputStart,
        courseInputEnd: activePeriod.courseInputEnd,
        studentInputStart: activePeriod.studentInputStart,
        studentInputEnd: activePeriod.studentInputEnd,
      },
      scheduleDay: c.scheduleDay,
      scheduleTime: c.scheduleTime,
      weightAttendance: c.weightAttendance ?? 10,
      weightAssignment: c.weightAssignment ?? 20,
      weightPretest: c.weightPretest ?? 10,
      weightUts: c.weightUts ?? 25,
      weightUas: c.weightUas ?? 35,
      isClaimedByMe,
      myProposalStatus,
    };
  });

  // Jika user adalah Asprak dan periode pengambilan sudah ditutup,
  // sembunyikan mata kuliah yang belum diambil oleh asprak ini
  if (session.role !== "ADMIN" && !isCourseClaimOpen) {
    mappedCourses = mappedCourses.filter((c) => c.isClaimedByMe);
  }

  return mappedCourses;
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

/**
 * Duplikat Mata Kuliah beserta seluruh modul dan komponennya (Khusus ADMIN)
 * Dikecualikan: praktikan (enrollments), nilai (grades/scores), presensi (attendance), asisten (assistants), dan jadwal (scheduleDay, scheduleTime).
 */
export async function duplicateCourseByAdminAction(
  sourceCourseId: string,
  customCode?: string,
  customTitle?: string
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, message: "Hanya Koordinator Lab (Admin) yang berhak menduplikasi mata kuliah." };
  }

  try {
    // 1. Ambil data mata kuliah sumber beserta modules & pretests
    const source = await prisma.course.findUnique({
      where: { id: sourceCourseId },
      include: {
        modules: {
          orderBy: { orderIndex: "asc" },
        },
        pretests: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!source) {
      return { success: false, message: "Mata kuliah sumber tidak ditemukan." };
    }

    // 2. Tentukan Judul dan Kode baru
    const newTitle = customTitle?.trim() || `${source.title} (Copy)`;
    let targetCode = customCode?.trim();

    if (!targetCode) {
      // Cari kode unik dengan suffix -COPY, -COPY-2, dll.
      let candidateCode = `${source.code}-COPY`;
      let counter = 1;
      while (true) {
        const existing = await prisma.course.findFirst({
          where: {
            academicPeriodId: source.academicPeriodId,
            code: candidateCode,
          },
        });
        if (!existing) {
          targetCode = candidateCode;
          break;
        }
        counter++;
        candidateCode = `${source.code}-COPY-${counter}`;
      }
    } else {
      // Cek apakah customCode bentrok di periode yang sama
      const existing = await prisma.course.findFirst({
        where: {
          academicPeriodId: source.academicPeriodId,
          code: targetCode,
        },
      });
      if (existing) {
        return { success: false, message: `Kode mata kuliah "${targetCode}" sudah digunakan pada periode ini.` };
      }
    }

    // 3. Buat mata kuliah baru dan komponen di dalamnya secara atomik (transaction)
    // Asisten dan Jadwal dikecualikan (scheduleDay: null, scheduleTime: null, assistants tidak di-copy).
    // Praktikan, Nilai, Submissions, Attendances juga dikecualikan.
    const newCourse = await prisma.$transaction(async (tx) => {
      const created = await tx.course.create({
        data: {
          academicPeriodId: source.academicPeriodId,
          code: targetCode!,
          title: newTitle,
          description: source.description,
          scheduleDay: null,
          scheduleTime: null,
          weightAttendance: source.weightAttendance,
          weightAssignment: source.weightAssignment,
          weightPretest: source.weightPretest,
          weightUts: source.weightUts,
          weightUas: source.weightUas,
          creatorId: session.userId,
        },
      });

      // Duplikat modul-modul
      for (const mod of source.modules) {
        await tx.module.create({
          data: {
            courseId: created.id,
            orderIndex: mod.orderIndex,
            title: mod.title,
            description: mod.description,
            isFinalReport: mod.isFinalReport,
            deadline: null,
          },
        });
      }

      // Duplikat komponen pretest (tanpa skor)
      for (const pt of source.pretests) {
        await tx.pretest.create({
          data: {
            courseId: created.id,
            orderIndex: pt.orderIndex,
            title: pt.title,
          },
        });
      }

      return created;
    });

    revalidatePath("/admin/matakuliah");
    revalidatePath("/praktikum");

    return {
      success: true,
      message: `Mata kuliah "${newTitle}" (${targetCode}) berhasil diduplikat.`,
      courseId: newCourse.id,
    };
  } catch (error) {
    console.error("duplicateCourseByAdminAction failed", error);
    return { success: false, message: "Gagal menduplikasi mata kuliah." };
  }
}

