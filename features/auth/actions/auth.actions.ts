"use server";

import { prisma } from "@/lib/prisma";
import { loginSchema, LoginInput } from "../schemas/auth.schema";
import { createSession, destroySession, getSession, hashPassword, verifyPassword } from "@/lib/security";
import { redirect } from "next/navigation";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

/**
 * Otomatis seeding akun default jika database masih kosong:
 * 1. Admin: username 'admin', password 'admin123'
 * 2. Asprak: username 'asprak1', password 'asprak123'
 */
export async function seedInitialAdminAction(): Promise<void> {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const adminPass = await hashPassword("admin123");
    const asprakPass = await hashPassword("asprak123");

    await prisma.user.createMany({
      data: [
        {
          username: "admin",
          name: "Koordinator Laboratorium",
          email: "admin.lab@kampus.ac.id",
          passwordHash: adminPass,
          role: "ADMIN",
        },
        {
          username: "asprak1",
          name: "Asisten Praktikum 1",
          email: "asprak1@kampus.ac.id",
          passwordHash: asprakPass,
          role: "ASISTEN",
        },
      ],
    });
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

  // Cek apakah database masih kosong, jika ya buat akun demo
  await seedInitialAdminAction();

  const user = await prisma.user.findUnique({
    where: { username },
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
    },
  });
}
