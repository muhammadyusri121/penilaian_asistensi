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

/**
 * Helper input interaktif terminal dengan dukungan password masking (*)
 */
function askQuestion(rl, query, hidden = false) {
  return new Promise((resolve) => {
    if (!hidden) {
      rl.question(query, (ans) => resolve(ans.trim()));
      return;
    }

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
        process.exit(0);
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

/**
 * Pastikan terdapat default periode semester aktif
 */
async function ensureDefaultSemester() {
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
    console.log("ℹ️  Periode semester default 'Semester Gasal 2026/2027' telah disiapkan.");
  }
}

/**
 * [READ] Tampilkan daftar seluruh akun Admin
 */
async function listAdmins() {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });

  console.log("\n=======================================================================");
  console.log("                     📋 DAFTAR AKUN ADMIN LABORATORIUM                  ");
  console.log("=======================================================================");

  if (admins.length === 0) {
    console.log("   (Belum ada akun Admin terdaftar di database)");
  } else {
    console.log(
      ` ${"No".padEnd(4)} | ${"Username".padEnd(16)} | ${"Nama Lengkap".padEnd(24)} | ${"Email".padEnd(20)} | Status`
    );
    console.log("-----------------------------------------------------------------------");
    admins.forEach((admin, idx) => {
      const num = String(idx + 1).padEnd(4);
      const uname = admin.username.padEnd(16);
      const name = (admin.name.length > 22 ? admin.name.slice(0, 21) + "…" : admin.name).padEnd(24);
      const email = (admin.email || "-").padEnd(20);
      console.log(` ${num} | ${uname} | ${name} | ${email} | ${admin.status}`);
    });
  }
  console.log("=======================================================================\n");
  return admins;
}

/**
 * [CREATE] Tambah Akun Admin Baru
 */
async function createAdmin(rl) {
  console.log("\n--- [➕ TAMBAH AKUN ADMIN BARU] ---");

  let name = "";
  while (!name) {
    name = await askQuestion(rl, "1. Nama Lengkap Admin: ");
    if (!name) console.log("   ⚠️ Nama lengkap wajib diisi!");
  }

  let username = "";
  while (!username) {
    username = await askQuestion(rl, "2. Username Admin (min 3 karakter): ");
    if (!username || username.length < 3) {
      console.log("   ⚠️ Username minimal 3 karakter!");
      username = "";
      continue;
    }
    const exists = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (exists) {
      console.log(`   ⚠️ Username '${username}' sudah digunakan akun lain! Silakan pilih username lain.`);
      username = "";
    }
  }

  const email = await askQuestion(rl, "3. Email Resmi (Opsional, Enter untuk melewati): ");

  let password = "";
  while (!password) {
    password = await askQuestion(rl, "4. Password Admin (min 6 karakter): ", true);
    if (!password || password.length < 6) {
      console.log("   ⚠️ Password minimal 6 karakter!");
      password = "";
    }
  }

  let confirmPass = "";
  while (confirmPass !== password) {
    confirmPass = await askQuestion(rl, "5. Konfirmasi Password: ", true);
    if (confirmPass !== password) {
      console.log("   ⚠️ Konfirmasi password tidak cocok! Silakan ulangi.");
    }
  }

  console.log("\n⏳ Menyimpan data akun admin...");
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newAdmin = await prisma.user.create({
    data: {
      name,
      username: username.toLowerCase(),
      email: email ? email.toLowerCase() : null,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log(`✅ Berhasil membuat akun admin '${newAdmin.username}' (${newAdmin.name})!`);
}

/**
 * [UPDATE] Edit Data / Reset Password Akun Admin
 */
async function updateAdmin(rl) {
  console.log("\n--- [✏️ EDIT / RESET PASSWORD ADMIN] ---");
  const admins = await listAdmins();

  if (admins.length === 0) {
    console.log("⚠️ Tidak ada akun admin yang dapat diedit.");
    return;
  }

  const targetInput = await askQuestion(
    rl,
    `Pilih Nomor urut (1-${admins.length}) atau ketik Username yang ingin diedit: `
  );

  let targetAdmin = null;
  const targetIndex = parseInt(targetInput, 10);
  if (!isNaN(targetIndex) && targetIndex >= 1 && targetIndex <= admins.length) {
    targetAdmin = admins[targetIndex - 1];
  } else {
    targetAdmin = admins.find((a) => a.username.toLowerCase() === targetInput.toLowerCase());
  }

  if (!targetAdmin) {
    console.log("⚠️ Akun admin tidak ditemukan!");
    return;
  }

  console.log(`\nSedang mengedit akun: ${targetAdmin.username} (${targetAdmin.name})`);
  console.log("Tekan [ENTER] jika tidak ingin mengubah field tertentu.\n");

  const newName = await askQuestion(rl, `Nama Lengkap baru [${targetAdmin.name}]: `);
  const newEmail = await askQuestion(rl, `Email baru [${targetAdmin.email || "-"}]: `);

  const changePass = await askQuestion(rl, "Ingin mereset password? (y/N): ");
  let newPasswordHash = undefined;

  if (changePass.toLowerCase() === "y") {
    let password = "";
    while (!password) {
      password = await askQuestion(rl, "Password baru (min 6 karakter): ", true);
      if (!password || password.length < 6) {
        console.log("   ⚠️ Password minimal 6 karakter!");
        password = "";
      }
    }

    let confirmPass = "";
    while (confirmPass !== password) {
      confirmPass = await askQuestion(rl, "Ulangi password baru: ", true);
      if (confirmPass !== password) {
        console.log("   ⚠️ Konfirmasi password tidak cocok! Silakan ulangi.");
      }
    }

    const salt = await bcrypt.genSalt(10);
    newPasswordHash = await bcrypt.hash(password, salt);
  }

  const updateData = {};
  if (newName) updateData.name = newName;
  if (newEmail) updateData.email = newEmail.toLowerCase();
  if (newPasswordHash) updateData.passwordHash = newPasswordHash;

  if (Object.keys(updateData).length === 0) {
    console.log("ℹ️  Tidak ada perubahan yang dilakukan.");
    return;
  }

  await prisma.user.update({
    where: { id: targetAdmin.id },
    data: updateData,
  });

  console.log(`✅ Berhasil memperbarui akun admin '${targetAdmin.username}'!`);
}

/**
 * [DELETE] Hapus Akun Admin
 */
async function deleteAdmin(rl) {
  console.log("\n--- [🗑️ HAPUS AKUN ADMIN] ---");
  const admins = await listAdmins();

  if (admins.length <= 1) {
    console.log("⚠️ Sistem harus memiliki minimal 1 akun Admin. Tidak dapat menghapus admin terakhir!");
    return;
  }

  const targetInput = await askQuestion(
    rl,
    `Pilih Nomor urut (1-${admins.length}) atau ketik Username yang ingin dihapus: `
  );

  let targetAdmin = null;
  const targetIndex = parseInt(targetInput, 10);
  if (!isNaN(targetIndex) && targetIndex >= 1 && targetIndex <= admins.length) {
    targetAdmin = admins[targetIndex - 1];
  } else {
    targetAdmin = admins.find((a) => a.username.toLowerCase() === targetInput.toLowerCase());
  }

  if (!targetAdmin) {
    console.log("⚠️ Akun admin tidak ditemukan!");
    return;
  }

  // Cek relasi dependensi (Course creator atau Grade assistant)
  const hasCourse = await prisma.course.findFirst({
    where: { creatorId: targetAdmin.id },
    select: { id: true, code: true, title: true },
  });

  if (hasCourse) {
    console.log(
      `⚠️ Tidak dapat menghapus admin '${targetAdmin.username}' karena telah membuat mata kuliah '${hasCourse.code} - ${hasCourse.title}'.`
    );
    return;
  }

  const confirm = await askQuestion(
    rl,
    `⚠️ PERINGATAN: Yakin ingin menghapus akun admin '${targetAdmin.username}' (${targetAdmin.name})? (ketik 'HAPUS' untuk konfirmasi): `
  );

  if (confirm !== "HAPUS") {
    console.log("❌ Penghapusan dibatalkan.");
    return;
  }

  await prisma.user.delete({
    where: { id: targetAdmin.id },
  });

  console.log(`✅ Akun admin '${targetAdmin.username}' berhasil dihapus dari database.`);
}

/**
 * Menu Utama Interaktif CLI
 */
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n=======================================================");
  console.log("   🛡️  CLI SEED & CRUD ADMIN LABORATORIUM  🛡️");
  console.log("=======================================================");
  console.log("Alat manajemen terminal untuk akun Administrator");
  console.log("(Tanpa menyimpan kredensial di kode atau .env)\n");

  await ensureDefaultSemester();

  let keepRunning = true;

  while (keepRunning) {
    console.log("\nSilakan pilih menu:");
    console.log("  [1] 📋 Tampilkan Daftar Admin (Read)");
    console.log("  [2] ➕ Tambah Akun Admin Baru (Create)");
    console.log("  [3] ✏️  Edit Data / Reset Password Admin (Update)");
    console.log("  [4] 🗑️  Hapus Akun Admin (Delete)");
    console.log("  [5] 🚪 Keluar (Exit)");

    const choice = await askQuestion(rl, "\nPilihan Anda (1-5): ");

    switch (choice) {
      case "1":
        await listAdmins();
        break;
      case "2":
        await createAdmin(rl);
        break;
      case "3":
        await updateAdmin(rl);
        break;
      case "4":
        await deleteAdmin(rl);
        break;
      case "5":
      case "q":
      case "exit":
        keepRunning = false;
        console.log("\nTerima kasih! Selesai mengelola akun admin.\n");
        break;
      default:
        console.log("⚠️ Pilihan tidak valid, silakan ketik angka 1 sampai 5.");
        break;
    }
  }

  rl.close();
}

main()
  .catch((e) => {
    console.error("\n❌ Terjadi kesalahan pada CLI Admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
