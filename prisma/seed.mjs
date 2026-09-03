import readline from "readline";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("\n❌ ERROR: Variabel DATABASE_URL belum disetel di file .env");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function askQuestion(rl, query, hidden = false) {
  return new Promise((resolve) => {
    if (!hidden) {
      rl.question(query, (ans) => resolve(ans.trim()));
      return;
    }

    // Input tersembunyi untuk password di terminal
    process.stdout.write(query);
    const stdin = process.stdin;
    const oldRaw = stdin.isRaw;
    if (stdin.setRawMode) stdin.setRawMode(true);
    stdin.resume();

    let input = "";
    const onData = (char) => {
      const c = char.toString("utf8");

      if (c === "\n" || c === "\r" || c === "\u0004") {
        stdin.removeListener("data", onData);
        if (stdin.setRawMode) stdin.setRawMode(oldRaw || false);
        stdin.pause();
        process.stdout.write("\n");
        resolve(input.trim());
      } else if (c === "\u0003") {
        // Ctrl+C
        process.stdout.write("\n");
        process.exit(1);
      } else if (c === "\u0008" || c.charCodeAt(0) === 127) {
        // Backspace
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stdout.write("\b \b");
        }
      } else {
        input += c;
        process.stdout.write("*");
      }
    };

    stdin.on("data", onData);
  });
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n=======================================================");
  console.log("   🛡️  FORM INTERAKTIF SEED AKUN ADMIN LABORATORIUM  🛡️");
  console.log("=======================================================");
  console.log("Silakan masukkan data akun Administrator langsung di terminal:");
  console.log("(Tidak ada password yang disimpan di kode maupun di .env)\n");

  try {
    // 1. Nama Lengkap
    let name = "";
    while (!name) {
      name = await askQuestion(rl, "1. Masukkan Nama Lengkap Admin: ");
      if (!name) console.log("   ⚠️ Nama lengkap tidak boleh kosong!");
    }

    // 2. Username
    let username = "";
    while (!username) {
      username = await askQuestion(rl, "2. Masukkan Username Admin: ");
      if (!username || username.length < 3) {
        console.log("   ⚠️ Username minimal 3 karakter!");
        username = "";
      }
    }

    // 3. Email (Opsional)
    const email = await askQuestion(rl, "3. Masukkan Email Resmi (Opsional, Enter untuk melewati): ");

    // 4. Password
    let password = "";
    while (!password) {
      password = await askQuestion(rl, "4. Masukkan Password Admin (Min 6 karakter): ", true);
      if (!password || password.length < 6) {
        console.log("   ⚠️ Password minimal 6 karakter!");
        password = "";
      }
    }

    // 5. Konfirmasi Password
    let confirmPass = "";
    while (confirmPass !== password) {
      confirmPass = await askQuestion(rl, "5. Ulangi Password Admin: ", true);
      if (confirmPass !== password) {
        console.log("   ⚠️ Konfirmasi password tidak cocok! Silakan ulangi.");
      }
    }

    rl.close();

    console.log("\n⏳ Sedang memproses dan menyimpan ke database...");

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const admin = await prisma.user.upsert({
      where: { username: username.toLowerCase() },
      update: {
        name,
        email: email ? email.toLowerCase() : null,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
      },
      create: {
        username: username.toLowerCase(),
        name,
        email: email ? email.toLowerCase() : null,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    console.log("\n=======================================================");
    console.log("   ✅ AKUN ADMIN BERHASIL DIBUAT DENGAN SUKSES!");
    console.log("=======================================================");
    console.log(`   - Nama Lengkap : ${admin.name}`);
    console.log(`   - Username     : ${admin.username}`);
    console.log(`   - Role         : ${admin.role}`);
    console.log(`   - Status Akun  : ${admin.status}`);
    console.log("=======================================================");
    console.log("Silakan login di browser dengan username & password di atas.\n");

    // Inisialisasi default periode semester jika belum ada
    const activePeriod = await prisma.academicPeriod.findFirst({
      where: { isActive: true },
    });

    if (!activePeriod) {
      const now = new Date();
      const nextThreeMonths = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      await prisma.academicPeriod.create({
        data: {
          name: "Semester Gasal 2026/2027",
          isActive: true,
          studentInputStart: now,
          studentInputEnd: nextThreeMonths,
        },
      });
      console.log("📅 Periode aktif default 'Semester Gasal 2026/2027' telah disiapkan.\n");
    }
  } catch (err) {
    rl.close();
    throw err;
  }
}

main()
  .catch((e) => {
    console.error("\n❌ Gagal membuat akun admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
