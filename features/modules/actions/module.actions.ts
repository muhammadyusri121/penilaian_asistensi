"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/security";
import { revalidatePath } from "next/cache";

/**
 * Seeding default modul praktikum (Modul 1..7 + Laporan Akhir) jika belum ada modul
 */
export async function seedInitialModulesAction(): Promise<void> {
  const count = await prisma.module.count();
  if (count === 0) {
    const defaultModules = [
      { title: "Modul 1: Pengenalan Sintaks & Tipe Data", orderIndex: 1, isFinalReport: false },
      { title: "Modul 2: Struktur Kontrol & Perulangan", orderIndex: 2, isFinalReport: false },
      { title: "Modul 3: Fungsi & Rekursi", orderIndex: 3, isFinalReport: false },
      { title: "Modul 4: Array & Pointer Memory", orderIndex: 4, isFinalReport: false },
      { title: "Modul 5: Struct & Linked List", orderIndex: 5, isFinalReport: false },
      { title: "Modul 6: Stack & Queue", orderIndex: 6, isFinalReport: false },
      { title: "Modul 7: Algoritma Searching & Sorting", orderIndex: 7, isFinalReport: false },
      { title: "Laporan Akhir Praktikum", orderIndex: 8, isFinalReport: true },
    ];

    await prisma.module.createMany({
      data: defaultModules,
    });
  }
}

/**
 * Dapatkan seluruh modul praktikum yang aktif
 */
export async function getModulesAction() {
  await seedInitialModulesAction();

  return prisma.module.findMany({
    orderBy: { orderIndex: "asc" },
    include: {
      _count: {
        select: { submissions: true },
      },
    },
  });
}

/**
 * Tambah modul baru secara dinamis
 */
export async function createModuleAction(data: {
  title: string;
  orderIndex: number;
  description?: string;
  isFinalReport?: boolean;
}) {
  const session = await getSession();
  if (!session) throw new Error("Akses ditolak");

  const newMod = await prisma.module.create({
    data: {
      title: data.title,
      orderIndex: data.orderIndex,
      description: data.description,
      isFinalReport: data.isFinalReport ?? false,
    },
  });

  revalidatePath("/modul");
  revalidatePath("/rekap-nilai");
  return newMod;
}
