"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/security";
import { revalidatePath } from "next/cache";

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
