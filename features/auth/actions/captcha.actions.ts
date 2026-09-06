"use server";

import { getSession } from "@/lib/security";
import { createCaptchaChallenge } from "@/lib/captcha";

/**
 * Server Action untuk membuat challenge kode CAPTCHA bertanda tangan kriptografis
 * Khusus pengguna yang memiliki hak akses ADMIN
 */
export async function getCaptchaChallengeAction(action: string, targetId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return {
      success: false,
      message: "Akses ditolak. Hanya Administrator yang berhak meminta verifikasi.",
    };
  }

  if (!action || !targetId) {
    return {
      success: false,
      message: "Parameter action dan targetId wajib disertakan.",
    };
  }

  try {
    const challenge = await createCaptchaChallenge(action, targetId, session.userId);
    return {
      success: true,
      code: challenge.code,
      token: challenge.token,
    };
  } catch (error) {
    console.error("getCaptchaChallengeAction error:", error);
    return {
      success: false,
      message: "Gagal membuat kode verifikasi server.",
    };
  }
}
