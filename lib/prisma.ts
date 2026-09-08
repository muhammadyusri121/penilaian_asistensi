import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const isProduction = process.env.NODE_ENV === "production";

    const pool =
      globalForPrisma.pool ??
      new Pool({
        connectionString: process.env.DATABASE_URL,
        // Di Vercel / Serverless production, batasi 2 koneksi per instance
        // agar instance-instance lambda tidak membanjiri connection slot PostgreSQL
        max: isProduction ? 2 : 10,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 5000, // Cepat bersihkan koneksi idle agar router/firewall tidak memutusnya sepihak
        keepAlive: true,
        keepAliveInitialDelayMillis: 2000, // Kirim keepalive tiap 2 detik
        maxUses: 50, // Rotasi koneksi setelah 50 kali pakai
      });

    pool.on("error", (err) => {
      // Driver pg otomatis membuang socket mati dari pool
      console.warn("PostgreSQL idle socket closed:", err.message);
    });

    globalForPrisma.pool = pool;

    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();

/**
 * Helper auto-retry 1x untuk mentoleransi fluktuasi koneksi internet ke server remote PostgreSQL
 */
export async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const msg = error?.message || "";
    if (
      msg.includes("Connection terminated") ||
      msg.includes("closed") ||
      msg.includes("timeout")
    ) {
      console.warn("Koneksi WAN PostgreSQL sempat putus, melakukan retry otomatis...");
      return await fn();
    }
    throw error;
  }
}




