"use server";

import { prisma } from "@/lib/prisma";
import { loginSchema, LoginInput, registerSchema, RegisterInput } from "../schemas/auth.schema";
import { createSession, destroySession, getSession, hashPassword, verifyPassword } from "@/lib/security";
import { redirect } from "next/navigation";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}


/**
 * Server Action Registrasi Calon Asprak (Menunggu ACC Admin)
 */
export async function registerAction(rawInput: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Validasi data gagal",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { username, name, email, password } = parsed.data;

  try {
    // Pastikan username unik
    const existing = await prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    });

    if (existing) {
      return {
        success: false,
        message: "Username sudah digunakan. Silakan pilih username lain.",
      };
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: {
        username: username.trim().toLowerCase(),
        name: name.trim(),
        email: email ? email.trim().toLowerCase() : null,
        passwordHash,
        role: "ASISTEN",
        status: "PENDING_APPROVAL", // Menunggu ACC
      },
    });

    return {
      success: true,
      message: "Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan (ACC) dari Koordinator Laboratorium.",
    };
  } catch (error: any) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(",")
        : String(error.meta?.target || "");
      if (target.includes("username")) {
        return {
          success: false,
          message: "Username sudah digunakan. Silakan pilih username lain.",
        };
      }
      if (target.includes("email")) {
        return {
          success: false,
          message: "Email sudah terdaftar. Silakan gunakan email lain.",
        };
      }
    }
    console.error("registerAction failed", error);
    return {
      success: false,
      message: "Gagal memproses pendaftaran akun.",
    };
  }
}

/**
 * Server Action Login untuk Asprak & Admin
 */
export async function loginAction(rawInput: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validasi gagal",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { username: username.trim().toLowerCase() },
  });

  if (!user) {
    return {
      success: false,
      message: "Username atau password salah",
    };
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return {
      success: false,
      message: "Username atau password salah",
    };
  }

  // Cek status persetujuan akun
  if (user.status === "PENDING_APPROVAL") {
    return {
      success: false,
      message: "Akun Anda sedang menunggu persetujuan (ACC) dari Koordinator Laboratorium.",
    };
  }

  if (user.status === "REJECTED") {
    return {
      success: false,
      message: "Pendaftaran akun Anda ditolak oleh Koordinator Laboratorium.",
    };
  }

  if (user.status === "SUSPENDED") {
    return {
      success: false,
      message: "Akun Anda dinonaktifkan sementara. Silakan hubungi Koordinator Lab.",
    };
  }

  await createSession({
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  });

  return {
    success: true,
    message: "Login berhasil",
  };
}

/**
 * Server Action Logout
 */
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

/**
 * Dapatkan data profil user saat ini
 */
export async function getCurrentUserAction() {
  const session = await getSession();
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });
}
