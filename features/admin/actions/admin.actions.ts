"use server";

import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/security";
import { revalidatePath } from "next/cache";
import {
  createAssistantSchema,
  CreateAssistantInput,
  updateAssistantSchema,
  UpdateAssistantInput,
} from "../schemas/assistant.schema";

/**
 * Guard khusus Admin
 */
async function ensureAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Akses ditolak. Fitur ini hanya untuk Koordinator Lab.");
  }
  return session;
}

/**
 * Ambil seluruh akun pengguna yang menunggu persetujuan (PENDING_APPROVAL)
 */
export async function getPendingUsersAction() {
  await ensureAdmin();
  return prisma.user.findMany({
    where: { status: "PENDING_APPROVAL" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

/**
 * Ambil daftar seluruh akun asisten aktif
 */
export async function getActiveAssistantsAction() {
  await ensureAdmin();
  return prisma.user.findMany({
    where: { role: "ASISTEN", status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
      _count: {
        select: {
          assignedCourses: true,
          studentEnrollments: true,
        },
      },
    },
  });
}

/**
 * Ambil seluruh akun asisten praktikum (Semua Status) untuk CRUD
 */
export async function getAllAssistantsAction() {
  await ensureAdmin();
  return prisma.user.findMany({
    where: { role: "ASISTEN" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
      approvedAt: true,
      _count: {
        select: {
          assignedCourses: true,
          studentEnrollments: true,
        },
      },
    },
  });
}

/**
 * Admin Membuat Akun Asisten Praktikum Baru
 */
export async function createAssistantByAdminAction(input: CreateAssistantInput) {
  const admin = await ensureAdmin();

  const parsed = createAssistantSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Validasi data gagal" };
  }

  const { name, username, email, password, status } = parsed.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username: username.trim() },
    });

    if (existingUser) {
      return { success: false, message: `Username "${username}" sudah digunakan.` };
    }

    if (email && email.trim() !== "") {
      const existingEmail = await prisma.user.findUnique({
        where: { email: email.trim() },
      });
      if (existingEmail) {
        return { success: false, message: `Email "${email}" sudah terdaftar pada akun lain.` };
      }
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        email: email && email.trim() !== "" ? email.trim() : null,
        passwordHash,
        role: "ASISTEN",
        status: status || "ACTIVE",
        approvedAt: status === "ACTIVE" ? new Date() : null,
        approvedById: status === "ACTIVE" ? admin.userId : null,
      },
    });

    revalidatePath("/admin/persetujuan-akun");
    return { success: true, message: `Akun asisten ${name} (${username}) berhasil dibuat.` };
  } catch (error) {
    console.error("createAssistantByAdminAction failed", error);
    return { success: false, message: "Gagal membuat akun asisten." };
  }
}

/**
 * Admin Mengupdate Akun Asisten Praktikum
 */
export async function updateAssistantByAdminAction(userId: string, input: UpdateAssistantInput) {
  const admin = await ensureAdmin();

  const parsed = updateAssistantSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Validasi data gagal" };
  }

  const { name, username, email, password, status } = parsed.data;

  try {
    const current = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!current) {
      return { success: false, message: "Akun asisten tidak ditemukan." };
    }

    // Cek duplikasi username
    if (username.trim() !== current.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: username.trim() },
      });
      if (existingUser && existingUser.id !== userId) {
        return { success: false, message: `Username "${username}" sudah digunakan akun lain.` };
      }
    }

    // Cek duplikasi email
    if (email && email.trim() !== "" && email.trim() !== current.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: email.trim() },
      });
      if (existingEmail && existingEmail.id !== userId) {
        return { success: false, message: `Email "${email}" sudah terdaftar pada akun lain.` };
      }
    }

    const updateData: any = {
      name: name.trim(),
      username: username.trim(),
      email: email && email.trim() !== "" ? email.trim() : null,
      status,
    };

    if (password && password.trim().length >= 6) {
      updateData.passwordHash = await hashPassword(password.trim());
    }

    if (status === "ACTIVE" && current.status !== "ACTIVE") {
      updateData.approvedAt = new Date();
      updateData.approvedById = admin.userId;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/admin/persetujuan-akun");
    return { success: true, message: `Data akun asisten ${name} berhasil diperbarui.` };
  } catch (error) {
    console.error("updateAssistantByAdminAction failed", error);
    return { success: false, message: "Gagal memperbarui data akun asisten." };
  }
}

/**
 * Admin Menghapus Akun Asisten Praktikum
 */
export async function deleteAssistantByAdminAction(userId: string) {
  await ensureAdmin();

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            assignedCourses: true,
            studentEnrollments: true,
            gradedItems: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, message: "Akun asisten tidak ditemukan." };
    }

    if (user.role === "ADMIN") {
      return { success: false, message: "Akun Admin tidak dapat dihapus dari panel ini." };
    }

    if (user._count.studentEnrollments > 0) {
      return {
        success: false,
        message: `Akun tidak dapat dihapus karena masih membimbing ${user._count.studentEnrollments} praktikan. Anda dapat mengubah statusnya menjadi SUSPENDED (Nonaktif).`,
      };
    }

    if (user._count.gradedItems > 0) {
      return {
        success: false,
        message: `Akun tidak dapat dihapus karena memiliki ${user._count.gradedItems} data penilaian praktikan. Ubah status menjadi SUSPENDED untuk memblokir akun.`,
      };
    }

    // Hapus penugasan course jika ada
    if (user._count.assignedCourses > 0) {
      await prisma.courseAssistant.deleteMany({
        where: { assistantId: userId },
      });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/admin/persetujuan-akun");
    return { success: true, message: `Akun asisten ${user.name} (${user.username}) berhasil dihapus.` };
  } catch (error) {
    console.error("deleteAssistantByAdminAction failed", error);
    return { success: false, message: "Gagal menghapus akun asisten." };
  }
}

/**
 * ACC (Setujui) Akun Asprak
 */
export async function approveUserAction(userId: string) {
  const admin = await ensureAdmin();

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: "ACTIVE",
        approvedAt: new Date(),
        approvedById: admin.userId,
      },
    });

    revalidatePath("/admin/persetujuan-akun");
    return { success: true, message: "Akun asisten berhasil di-ACC dan diaktifkan." };
  } catch (error) {
    console.error("approveUserAction failed", error);
    return { success: false, message: "Gagal menyetujui akun." };
  }
}

/**
 * Tolak Akun Pendaftar
 */
export async function rejectUserAction(userId: string) {
  await ensureAdmin();

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: "REJECTED",
      },
    });

    revalidatePath("/admin/persetujuan-akun");
    return { success: true, message: "Pendaftaran akun telah ditolak." };
  } catch (error) {
    console.error("rejectUserAction failed", error);
    return { success: false, message: "Gagal menolak akun." };
  }
}
