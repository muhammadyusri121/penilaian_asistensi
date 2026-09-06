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
 * Dapatkan daftar mata kuliah yang diambil/diamapu oleh asisten saat ini
 */
export async function getMyAssignedCoursesAction() {
  const session = await getSession();
  if (!session) return [];

  const activePeriod = await getActivePeriodAction();

  let courses = await prisma.course.findMany({
    where: {
      ...(activePeriod ? { academicPeriodId: activePeriod.id } : {}),
      assistants: {
        some: {
          assistantId: session.userId,
        },
      },
    },
    orderBy: { code: "asc" },
    include: {
      academicPeriod: { select: { name: true } },
      modules: { orderBy: { orderIndex: "asc" } },
      _count: {
        select: {
          modules: true,
          enrollments: true,
          assistants: true,
        },
      },
    },
  });

  // Fallback jika tidak ada di periode aktif tapi ada di periode lain
  if (courses.length === 0 && activePeriod) {
    courses = await prisma.course.findMany({
      where: {
        assistants: {
          some: {
            assistantId: session.userId,
          },
        },
      },
      orderBy: { code: "asc" },
      include: {
        academicPeriod: { select: { name: true } },
        modules: { orderBy: { orderIndex: "asc" } },
        _count: {
          select: {
            modules: true,
            enrollments: true,
            assistants: true,
          },
        },
      },
    });
  }

  return courses;
}

/**
 * Asprak Mengambil / Memilih Mata Kuliah untuk Diampu (Status Awal: DRAFT)
 */
export async function claimCourseAction(courseId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Silakan login terlebih dahulu." };
  }

  // Cek jendela waktu pengambilan mata kuliah
  if (session.role !== "ADMIN") {
    const windowCheck = await checkWindowAccessAction("course");
    if (!windowCheck.allowed) {
      return {
        success: false,
        message: windowCheck.reason || "Periode pengambilan mata kuliah sudah ditutup.",
      };
    }
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
      return { success: true, message: "Anda sudah memilih mata kuliah ini." };
    }

    await (prisma.courseAssistant.create as any)({
      data: {
        courseId,
        assistantId: session.userId,
        status: "DRAFT",
      },
    });

    revalidatePath("/praktikum");
    revalidatePath("/admin/matakuliah");

    return {
      success: true,
      message: "Berhasil mengambil mata kuliah praktikum. Silakan input mahasiswa binaan Anda.",
    };
  } catch (error) {
    console.error("claimCourseAction failed", error);
    return { success: false, message: "Gagal mengambil mata kuliah." };
  }
}

/**
 * Asprak Mengajukan (Submit Proposal) Mata Kuliah & Daftar Praktikan ke Admin
 */
export async function submitCourseProposalAction(courseId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Silakan login terlebih dahulu." };
  }

  try {
    const assignment = await prisma.courseAssistant.findUnique({
      where: {
        courseId_assistantId: {
          courseId,
          assistantId: session.userId,
        },
      },
    });

    if (!assignment) {
      return { success: false, message: "Anda belum mengambil mata kuliah ini." };
    }

    // Pastikan asprak sudah memasukkan minimal 1 praktikan binaan
    const studentCount = await prisma.courseEnrollment.count({
      where: {
        courseId,
        assistantId: session.userId,
      },
    });

    if (studentCount === 0) {
      return {
        success: false,
        message: "Anda belum memasukkan data mahasiswa praktikan binaan. Harap tambahkan praktikan terlebih dahulu sebelum mengajukan.",
      };
    }

    await (prisma.courseAssistant.update as any)({
      where: {
        courseId_assistantId: {
          courseId,
          assistantId: session.userId,
        },
      },
      data: {
        status: "PENDING_APPROVAL",
        submittedAt: new Date(),
      },
    });

    revalidatePath("/praktikum");
    revalidatePath(`/${courseId}/praktikan`);
    revalidatePath("/admin/pengajuan-matakuliah");

    return {
      success: true,
      message: "Mata kuliah dan daftar mahasiswa binaan berhasil diajukan ke Koordinator Lab (Menunggu ACC).",
    };
  } catch (error) {
    console.error("submitCourseProposalAction failed", error);
    return { success: false, message: "Gagal mengajukan mata kuliah." };
  }
}

/**
 * Dapatkan status pengajuan mata kuliah asisten saat ini
 */
export async function getMyCourseProposalAction(courseId: string) {
  const session = await getSession();
  if (!session) return null;

  try {
    const ca = await (prisma.courseAssistant.findUnique as any)({
      where: {
        courseId_assistantId: {
          courseId,
          assistantId: session.userId,
        },
      },
    });

    if (!ca) return null;

    return {
      status: (ca as any).status || "DRAFT",
      submittedAt: (ca as any).submittedAt || null,
      approvedAt: (ca as any).approvedAt || null,
      notes: (ca as any).notes || null,
      assignedAt: ca.assignedAt || new Date(),
    };
  } catch (error) {
    console.warn("getMyCourseProposalAction error:", error);
    return null;
  }
}


/**
 * Admin Meng-ACC (Menyetujui) Pengajuan Mata Kuliah & Praktikan dari Asprak
 */
export async function approveCourseProposalAction(courseId: string, assistantId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, message: "Hanya Koordinator Lab (Admin) yang berhak menyetujui pengajuan." };
  }

  try {
    await (prisma.courseAssistant.update as any)({
      where: {
        courseId_assistantId: {
          courseId,
          assistantId,
        },
      },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });

    revalidatePath("/admin/pengajuan-matakuliah");
    revalidatePath("/admin/matakuliah");
    revalidatePath("/praktikum");
    return { success: true, message: "Pengajuan mata kuliah dan praktikan berhasil di-ACC (Disetujui)." };
  } catch (error) {
    console.error("approveCourseProposalAction failed", error);
    return { success: false, message: "Gagal menyetujui pengajuan." };
  }
}

/**
 * Admin Menolak / Meminta Revisi Pengajuan Mata Kuliah & Praktikan
 */
export async function rejectCourseProposalAction(courseId: string, assistantId: string, notes?: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, message: "Hanya Koordinator Lab (Admin) yang berhak menolak pengajuan." };
  }

  try {
    await (prisma.courseAssistant.update as any)({
      where: {
        courseId_assistantId: {
          courseId,
          assistantId,
        },
      },
      data: {
        status: "REJECTED",
        notes: notes || null,
      },
    });

    revalidatePath("/admin/pengajuan-matakuliah");
    revalidatePath("/praktikum");
    return { success: true, message: "Pengajuan mata kuliah dikembalikan untuk revisi." };
  } catch (error) {
    console.error("rejectCourseProposalAction failed", error);
    return { success: false, message: "Gagal memproses penolakan pengajuan." };
  }
}

/**
 * Dapatkan seluruh daftar pengajuan mata kuliah & praktikan untuk Admin
 */
export async function getAllCourseProposalsAction() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return [];

  const proposals = await prisma.courseAssistant.findMany({
    orderBy: { assignedAt: "desc" },
    include: {
      course: {
        select: { id: true, code: true, title: true },
      },
      assistant: {
        select: { id: true, name: true, username: true, email: true },
      },
    },
  });

  // Hitung jumlah praktikan yang dibina oleh asprak ini di course terkait
  const enriched = await Promise.all(
    proposals.map(async (p) => {
      const studentCount = await prisma.courseEnrollment.count({
        where: {
          courseId: p.courseId,
          assistantId: p.assistantId,
        },
      });

      return {
        ...p,
        studentCount,
      };
    })
  );

  return enriched;
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
    // 1. Cek status pengajuan mata kuliah
    const assignment = await prisma.courseAssistant.findUnique({
      where: {
        courseId_assistantId: {
          courseId,
          assistantId: session.userId,
        },
      },
    });

    if (!assignment) {
      return { success: false, message: "Anda tidak terdaftar mengampu mata kuliah ini." };
    }

    // Jika sudah di-ACC (APPROVED), asprak tidak dapat membatalkan mata kuliah
    if (session.role !== "ADMIN" && (assignment as any).status === "APPROVED") {
      return {
        success: false,
        message: "Mata kuliah praktikum ini telah disetujui (di-ACC) oleh Koordinator Lab dan tidak dapat dibatalkan.",
      };
    }

    // 2. Cek apakah asprak masih memiliki mahasiswa binaan di MK ini
    const enrolledStudentsCount = await prisma.courseEnrollment.count({
      where: {
        courseId,
        assistantId: session.userId,
      },
    });

    if (enrolledStudentsCount > 0) {
      return {
        success: false,
        message: `Tidak dapat membatalkan mata kuliah karena Anda masih memiliki ${enrolledStudentsCount} mahasiswa binaan. Pindahkan atau hapus praktikan terlebih dahulu.`,
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
