"use server";

import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/security";
import { adminUserSchema, AdminUserInput } from "../schemas/admin-management.schema";
import { ensureDefaultPeriod } from "@/features/periods/actions/period.actions";
import { revalidatePath } from "next/cache";

/**
 * Cek apakah sudah ada akun Admin di database
 */
export async function checkHasAdminAction(): Promise<boolean> {
  const count = await prisma.user.count({
    where: { role: "ADMIN" },
  });
  return count > 0;
}

/**
 * Form Inisialisasi Akun Admin Pertama (/setup)
 * HANYA BISA DIJALANKAN JIKA BELUM ADA AKUN ADMIN SAMA SEKALI
 */
export async function setupInitialAdminAction(input: AdminUserInput) {
  const parsed = adminUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Validasi data gagal",
    };
  }

  const { username, name, email, password } = parsed.data;

  try {
    const passwordHash = await hashPassword(password);

    const result = await prisma.$transaction(
      async (tx) => {
        const adminCount = await tx.user.count({
          where: { role: "ADMIN" },
        });

        if (adminCount > 0) {
          return {
            success: false,
            message: "Akun Admin sudah terdaftar di sistem. Form setup awal ini telah dikunci.",
          };
        }

        await tx.user.create({
          data: {
            username: username.trim().toLowerCase(),
            name: name.trim(),
            email: email ? email.trim().toLowerCase() : null,
            passwordHash,
            role: "ADMIN",
            status: "ACTIVE",
          },
        });

        return { success: true };
      },
      { isolationLevel: "Serializable" }
    );

    if (!result.success) {
      return result;
    }

    // Buat default periode aktif jika belum ada
    await ensureDefaultPeriod();

    revalidatePath("/login");
    revalidatePath("/setup");

    return {
      success: true,
      message: "Akun Koordinator Laboratorium pertama berhasil dibuat! Silakan login.",
    };
  } catch (error) {
    console.error("setupInitialAdminAction failed", error);
    return { success: false, message: "Gagal membuat akun Admin awal." };
  }
}

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
 * Dapatkan seluruh daftar akun Admin
 */
export async function getAllAdminUsersAction() {
  await ensureAdmin();

  return prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
    },
  });
}

/**
 * Buat Akun Admin Baru oleh Admin yang sedang login
 */
export async function createAdminUserAction(input: AdminUserInput) {
  const session = await ensureAdmin();

  const parsed = adminUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Validasi data gagal",
    };
  }

  const { username, name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.trim().toLowerCase() },
          ...(email ? [{ email: email.trim().toLowerCase() }] : []),
        ],
      },
    });

    if (existing) {
      return {
        success: false,
        message: "Username atau Email sudah terdaftar di sistem.",
      };
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: {
        username: username.trim().toLowerCase(),
        name: name.trim(),
        email: email ? email.trim().toLowerCase() : null,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        approvedAt: new Date(),
        approvedById: session.userId,
      },
    });

    revalidatePath("/admin/kelola-admin");
    return { success: true, message: "Akun Admin baru berhasil didaftarkan." };
  } catch (error) {
    console.error("createAdminUserAction failed", error);
    return { success: false, message: "Gagal membuat akun Admin baru." };
  }
}

/**
 * Hapus Akun Admin
 */
export async function deleteAdminUserAction(adminId: string) {
  const session = await ensureAdmin();

  try {
    // 1. Tidak boleh menghapus akun sendiri
    if (adminId === session.userId) {
      return { success: false, message: "Anda tidak dapat menghapus akun Anda sendiri." };
    }

    // 2. Pastikan minimal masih ada 1 akun admin
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });

    if (adminCount <= 1) {
      return { success: false, message: "Tidak dapat menghapus akun admin terakhir." };
    }

    // 3. Cek dependensi: Course (dibuat oleh admin ini) dan Grade (dinilai oleh admin ini)
    const hasCreatedCourse = await prisma.course.findFirst({
      where: { creatorId: adminId },
      select: { id: true },
    });
    if (hasCreatedCourse) {
      return {
        success: false,
        message: "Tidak dapat menghapus admin karena terdapat mata kuliah yang dibuat oleh akun ini. Alihkan kepemilikan mata kuliah terlebih dahulu.",
      };
    }

    const hasGradedItems = await prisma.grade.findFirst({
      where: { assistantId: adminId },
      select: { id: true },
    });
    if (hasGradedItems) {
      return {
        success: false,
        message: "Tidak dapat menghapus admin karena terdapat riwayat nilai asistensi yang diinput oleh akun ini.",
      };
    }

    await prisma.user.delete({
      where: { id: adminId },
    });

    revalidatePath("/admin/kelola-admin");
    return { success: true, message: "Akun Admin berhasil dihapus." };
  } catch (error) {
    console.error("deleteAdminUserAction failed", error);
    return { success: false, message: "Gagal menghapus akun admin." };
  }
}
