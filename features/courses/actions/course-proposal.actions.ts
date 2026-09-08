"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/security";
import {
  getActivePeriodAction,
  checkWindowAccessAction,
} from "@/features/periods/actions/period.actions";
import { revalidatePath } from "next/cache";

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
    await prisma.$transaction(async (tx) => {
      await (tx.courseAssistant.update as any)({
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

      // Otomatis setujui seluruh mahasiswa binaan asprak ini yang berstatus PENDING_APPROVAL
      await (tx.courseEnrollment.updateMany as any)({
        where: {
          courseId,
          assistantId,
          status: "PENDING_APPROVAL",
        },
        data: {
          status: "APPROVED",
        },
      });
    });

    revalidatePath("/admin/pengajuan-matakuliah");
    revalidatePath("/admin/matakuliah");
    revalidatePath("/praktikum");
    revalidatePath(`/${courseId}/praktikan`);
    revalidatePath(`/${courseId}/modul`);
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
      const [studentCount, pendingStudentCount] = await Promise.all([
        prisma.courseEnrollment.count({
          where: {
            courseId: p.courseId,
            assistantId: p.assistantId,
          },
        }),
        prisma.courseEnrollment.count({
          where: {
            courseId: p.courseId,
            assistantId: p.assistantId,
            status: "PENDING_APPROVAL",
          },
        }),
      ]);

      return {
        ...p,
        studentCount,
        pendingStudentCount,
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
