import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { SECRET_KEY } from "./security";

const CAPTCHA_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CHALLENGE_EXPIRY = "5m"; // 5 menit

// Menyimpan nonce yang telah dikonsumsi (consumed/used) untuk mencegah replay attack
const consumedNonces = new Map<string, number>();

function cleanupExpiredNonces() {
  const now = Date.now();
  for (const [nonce, expiresAt] of consumedNonces.entries()) {
    if (now > expiresAt) {
      consumedNonces.delete(nonce);
    }
  }
}

export interface CaptchaPayload {
  code: string;
  action: string;
  targetId: string;
  userId: string;
  nonce: string;
}

/**
 * Buat kode CAPTCHA 6-karakter server-side dan sign token JWT
 * yang terikat (bound) pada session userId, action, dan targetId
 */
export async function createCaptchaChallenge(
  action: string,
  targetId: string,
  userId: string
): Promise<{ code: string; token: string }> {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CAPTCHA_CHARS.charAt(Math.floor(Math.random() * CAPTCHA_CHARS.length));
  }

  const nonce = crypto.randomUUID();

  const token = await new SignJWT({
    code,
    action,
    targetId,
    userId,
    nonce,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(CHALLENGE_EXPIRY)
    .sign(SECRET_KEY);

  return { code, token };
}

/**
 * Verifikasi kecocokan kode CAPTCHA dari token bertanda tangan kriptografis,
 * dan langsung hanguskan (consume) challenge agar tidak dapat digunakan ulang (one-time use)
 */
export async function verifyAndConsumeCaptcha(
  token: string,
  input: string,
  expectedAction: string,
  expectedTargetId: string,
  expectedUserId: string
): Promise<{ valid: boolean; message?: string }> {
  if (!token || !input) {
    return { valid: false, message: "Token atau input kode verifikasi belum diisi." };
  }

  try {
    cleanupExpiredNonces();

    const { payload } = await jwtVerify(token, SECRET_KEY);
    const data = payload as unknown as CaptchaPayload;

    if (!data.nonce || consumedNonces.has(data.nonce)) {
      return {
        valid: false,
        message: "Kode verifikasi ini sudah pernah digunakan atau kedaluwarsa. Silakan refresh kode baru.",
      };
    }

    if (data.action !== expectedAction || data.targetId !== expectedTargetId) {
      return { valid: false, message: "Tindakan verifikasi tidak sesuai target yang dituju." };
    }

    if (data.userId !== expectedUserId) {
      return { valid: false, message: "Sesi verifikasi tidak valid untuk akun ini." };
    }

    // Konsumsi nonce (one-time use), simpan selama 5 menit
    consumedNonces.set(data.nonce, Date.now() + 5 * 60 * 1000);

    if (input.trim().toUpperCase() !== data.code.toUpperCase()) {
      return { valid: false, message: "Kode captcha verifikasi tidak cocok. Silakan coba lagi." };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      message: "Kode verifikasi telah kedaluwarsa (maks 5 menit). Silakan refresh kode baru.",
    };
  }
}
