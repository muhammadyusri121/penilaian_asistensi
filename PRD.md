# Product Requirements Document (PRD)
# Sistem Penilaian Asistensi Praktikum Laboratorium

| Metadata | Detail |
| :--- | :--- |
| **Status** | Finalized / Ready for Implementation |
| **Versi Dokumen** | 1.0.0 |
| **Terakhir Diperbarui** | 2026-09-02 |
| **Stack Utama** | Next.js (App Router), PostgreSQL, Prisma ORM, MinIO (S3-Compatible), Tailwind CSS |
| **Tema Desain** | Neubrutalism (Borders tebal, offset shadow, high contrast) |

---

## 1. Ringkasan Proyek (Overview & Objective)

Sistem Penilaian Asistensi adalah **aplikasi web internal khusus Asisten Praktikum (Asprak) & Koordinator Lab** untuk mengelola, menilai, mengarsipkan tugas, serta merekap nilai praktikum secara cepat dan akurat. Mahasiswa **tidak menggunakan/login** ke sistem ini.

Sistem ini memfasilitasi kebutuhan asprak dalam:
1. **Manajemen Praktikan Mandiri via NIM:** Setiap asprak dapat mengimpor daftar mahasiswa binaannya (via Excel/CSV) dengan data primer berupa **NIM** dan Nama Lengkap.
2. **Pengarsipan Berkas & Link Tugas Mahasiswa:** Asprak dapat melampirkan berkas tugas (PDF laporan, arsip kode ZIP, gambar/video) ke MinIO serta mencatat tautan eksternal (GitHub repo/demo).
3. **Penilaian Asistensi Interaktif (Combo System):** Input nilai cepat menggunakan tombol rubrik persentase instan + input desimal manual dengan kalkulasi live real-time.
4. **Rekapitulasi Semester & Export Excel:** Mengotomatisasi perhitungan kehadiran (12x), tugas modul dinamis, pretest dinamis, UTS, UAS, dan konversi huruf mutu sesuai rumus resmi lab, serta dapat langsung diekspor ke Excel.

---

## 2. Aktor & Peran Pengguna (Internal Roles Only)

Sistem ini bersifat *closed-internal* dan hanya dapat diakses oleh:

1. **Asisten Praktikum (Asprak):**
   - Mengimpor daftar mahasiswa bimbingannya via file Excel/CSV (NIM, Nama, Kelas/Shift).
   - Mengunggah/melampirkan berkas tugas (PDF/ZIP) dan menautkan link GitHub praktikan.
   - Melakukan penilaian asistensi modul menggunakan sistem kombo (preset + manual).
   - Mengisi presensi kehadiran 12 pertemuan dan nilai pretest dinamis.
   - Menginput nilai UTS dan UAS praktikan binaannya.
   - Mengunduh rekapitulasi nilai akhir per modul maupun semester dalam format Excel (.xlsx).

2. **Koordinator / Admin Lab:**
   - Mengelola akun dan hak akses asisten praktikum.
   - Mengatur daftar modul praktikum aktif ($N$ modul) dan tenggat waktu.
   - Memantau rekapitulasi nilai lintas asisten/kelas secara terpusat.
   - Mengekspor seluruh data nilai akhir laboratorium ke format spreadsheet resmi untuk Dosen Pengampu.

---

## 3. Struktur & Proporsi Rubrik Penilaian

Sistem penilaian dibagi menjadi dua lapisan:
1. **Penilaian per Modul (Micro / Asistensi)**: Mengukur kualitas teknis dan laporan per pertemuan praktikum.
2. **Penilaian Keseluruhan / Nilai Akhir (Macro / Semester)**: Mengakumulasikan seluruh aspek pembelajaran praktikum selama 1 semester.

---

### 3.1. Penilaian Per Modul (Bobot 100 Poin per Modul)

Setiap modul praktikum dinilai dengan bobot tetap berikut:

```
[TOTAL NILAI MODUL: 100 POIN]
 ├── 1. Asistensi Code (55%)
 │    ├── Kesesuaian Tugas       : Max 22
 │    ├── Penjelasan Program      : Max 19
 │    ├── Kehadiran               : Max 8
 │    └── Sikap                   : Max 6
 ├── 2. Laporan Resmi (35%)
 │    ├── Kesesuaian Pembahasan   : Max 12
 │    ├── Kesesuaian Format       : Max 10.5
 │    ├── Plagiarisme             : Max 9
 │    └── Kerapian                : Max 3.5
 └── 3. Ketepatan Pengumpulan (10%)
      └── Pengumpulan Tepat Waktu : Max 10
```

### Tabel Rincian Kriteria & Poin Maksimal

| Kategori | Kriteria Penilaian | Bobot Maksimal | Keterangan Evaluasi |
| :--- | :--- | :---: | :--- |
| **Asistensi Code (55%)** | Kesesuaian Tugas | **22** | Kelengkapan fitur program sesuai spesifikasi modul. |
| | Penjelasan Program | **19** | Penguasaan logika, pemahaman sintaks, dan alur kode. |
| | Kehadiran | **8** | Kehadiran saat sesi asistensi sesuai jadwal. |
| | Sikap | **6** | Etika, komunikasi, dan profesionalisme praktikan. |
| **Laporan Resmi (35%)** | Kesesuaian Pembahasan & Hasil | **12** | Analisis hasil praktikum mendalam dan data pengujian. |
| | Kesesuaian Format | **10.5** | Kepatuhan terhadap template laporan resmi lab. |
| | Plagiarisme | **9** | Orisinalitas tulisan dan kode (bebas plagiasi). |
| | Kerapian | **3.5** | Tata letak dokumen, penomoran tabel/gambar, dan kerapian. |
| **Pengumpulan (10%)** | Ketepatan Pengumpulan | **10** | Ketepatan waktu pengumpulan berkas tugas. |
| **TOTAL MODUL** | | **100** | |

### 3.2. Penilaian Keseluruhan Praktikum (Rekap Nilai Akhir 100%)

Mengacu pada lembar rekapitulasi semester laboratorium:

| Komponen | Porsi/Bobot | Mekanisme Perhitungan |
| :--- | :---: | :--- |
| **1. Kehadiran Praktikan** | **10%** | Diambil dari absensi **12 Pertemuan**.<br>$\text{Skor} = \left(\frac{\sum \text{Kehadiran (1..12)}}{12}\right) \times 10\%$ |
| **2. Tugas & Laporan Modul** | **20%** | **Dinamis ($N$ Modul)**: Jumlah modul fleksibel (bisa 5, 6, 7, 8, dst. sesuai kebutuhan mata kuliah praktikum) + opsi Laporan Akhir.<br>$\text{Skor} = \left(\frac{\sum_{i=1}^{N} \text{Nilai Modul}_i}{N}\right) \times 20\%$ |
| **3. Pretest** | **10%** | **Dinamis** (bisa 1x pretest, 2x, atau lebih). Sistem menghitung rata-ratanya.<br>$\text{Skor} = \text{Average(Pretest 1..N)} \times 10\%$ |
| **4. Ujian Tengah Semester (UTS)** | **25%** | Nilai Murni UTS $\times 25\%$ |
| **5. Ujian Akhir Semester (UAS)** | **35%** | Nilai Murni UAS $\times 35\%$ |
| **TOTAL NILAI AKHIR (NA)** | **100%** | $\sum (\text{Skor } 1 + 2 + 3 + 4 + 5)$ |

#### Contoh Perhitungan (Sesuai Ilustrasi Spreadsheet dengan $N=8$ termasuk Laporan Akhir):
* Kehadiran 12x (100%): $100 \times 10\% = \mathbf{10}$
* Tugas & Laporan ($N$ Modul dinamis, contoh rata-rata 99): $99 \times 20\% = \mathbf{19.8}$
* Pretest (Pretest 1: 98, Pretest 2: 87 $\rightarrow$ Rata-rata 92.5): $92.5 \times 10\% = \mathbf{9.25}$
* Nilai Murni UTS (97): $97 \times 25\% = \mathbf{24.25}$
* Nilai Murni UAS (87): $87 \times 35\% = \mathbf{30.45}$
* **Total Nilai Angka:** $10 + 19.8 + 9.25 + 24.25 + 30.45 = \mathbf{93.75}$
* **Nilai Akhir (Huruf Mutu):** **A**

#### Formula Konversi Resmi Nilai Akhir (Huruf Mutu):
Rumus diimplementasikan persis sesuai formula spreadsheet laboratorium:
```excel
=IF(AI6<50,"E",IF(AND(AI6<=60),"D",IF(AND(AI6>60,AI6<=65),"C",IF(AND(AI6>65,AI6<=70),"C+",IF(AND(AI6>70,AI6<=75),"B",IF(AND(AI6>75,AI6<=80),"B+",IF(AI6>80,"A")))))))
```

Tabel Konversi Rentang Skor:
| Rentang Skor Akhir ($S$) | Huruf Mutu | Keterangan Logika Formula |
| :---: | :---: | :--- |
| **$S > 80$** | **A** | `IF(AI6 > 80, "A")` |
| **$75 < S \le 80$** | **B+** | `IF(AND(AI6 > 75, AI6 <= 80), "B+")` |
| **$70 < S \le 75$** | **B** | `IF(AND(AI6 > 70, AI6 <= 75), "B")` |
| **$65 < S \le 70$** | **C+** | `IF(AND(AI6 > 65, AI6 <= 70), "C+")` |
| **$60 < S \le 65$** | **C** | `IF(AND(AI6 > 60, AI6 <= 65), "C")` |
| **$50 \le S \le 60$** | **D** | `IF(AND(AI6 <= 60), "D")` *(setelah kondisi $< 50$ dilewati)* |
| **$S < 50$** | **E** | `IF(AI6 < 50, "E")` |

---

### 3.3. Fitur Export Rekap Nilai Excel (.xlsx)

Asprak dan Admin dapat mengunduh rekapitulasi penilaian dalam format file spreadsheet `.xlsx` siap pakai:
1. **Export Rekap Semester:** Mencakup seluruh kolom persis seperti lembar penilaian laboratorium (NIM, Nama, 12 Kehadiran + Total 10%, $N$ Modul + Laporan Akhir + Rata-rata 20%, Pretest Dinamis 10%, Nilai Murni UTS 25%, Nilai Murni UAS 35%, Total Nilai Angka, dan Nilai Akhir Huruf Mutu).
2. **Export Rekap per Modul:** Menampilkan detail 4 sub-kriteria Asistensi Code (55%), 4 sub-kriteria Laporan (35%), dan Pengumpulan (10%) per mahasiswa.

---

## 4. Mekanisme Input Nilai: "Combo System"

Untuk efisiensi asisten lab saat menilai puluhan mahasiswa sekaligus:

1. **Preset Rubric Buttons (Tombol Cepat):**
   Setiap kriteria memiliki tombol persentase instan yang langsung mengisikan nilai pecahan/bulat:
   - **Sempurna (100%):** Mengisi nilai maksimal kriteria.
   - **Baik (80%):** Mengisi 80% dari nilai maksimal.
   - **Cukup (60%):** Mengisi 60% dari nilai maksimal.
   - **Kurang (40%):** Mengisi 40% dari nilai maksimal.
   - **Sangat Buruk (20%):** Mengisi 20% dari nilai maksimal.
2. **Manual Input Field (Number/Decimal):**
   - Kolom angka tetap dapat diketik bebas (mendukung pecahan desimal seperti `10.5` atau `3.5`).
3. **Live Auto-Calculation:**
   - Subtotal Asistensi Code (max 55), Subtotal Laporan (max 35), dan Total Skor (max 100) dikalkulasi secara reaktif di sisi klien tanpa jeda.
4. **Catatan Evaluasi / Feedback:**
   - Field catatan teks untuk asisten memberikan poin koreksi detail.

---

## 5. Spesifikasi Pengumpulan Tugas & Object Storage

### 5.1. Format yang Didukung
* **File Upload (MinIO / S3):**
  - Dokumen: `.pdf` (Laporan Resmi)
  - Arsip Kode: `.zip`, `.tar.gz`, `.rar`
  - Media & Bukti: `.png`, `.jpg`, `.jpeg`, `.mp4`, `.webm`
* **External Links:**
  - Git Repository: GitHub / GitLab URL
  - Media Cloud / Video Demo: YouTube, Google Drive, Loom URL

### 5.2. Arsitektur Object Storage
* **Fase Development:** MinIO server lokal (berjalan di container Docker atau binary lokal).
* **Driver Integrasi:** Menggunakan `@aws-sdk/client-s3` dengan konfigurasi *S3-compatible endpoint*.
* **Strategi Upload:**
  - Presigned URL untuk upload langsung yang aman dan hemat beban server aplikasi Next.js, atau Next.js Route Handler sebagai proxy upload terkontrol.
* **Kesiapan Produksi:** Migrasi ke Cloudflare R2 / AWS S3 hanya memerlukan pergantian environment variables (`S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_NAME`) tanpa mengubah kode aplikasi.

### 5.3. Fitur Bulk Import Data Praktikan (Excel/CSV)
* Asprak dapat mengunggah file `.xlsx` / `.csv` daftar praktikan binaannya.
* Kolom yang diekstrak:
  - `NIM` (Wajib, primary key unik)
  - `Nama Lengkap` (Wajib)
  - `Kelas / Shift` (Opsional, misal "Kelas B" atau "Shift 1")
* Menggunakan mekanisme *Upsert*: Data mahasiswa yang sudah ada akan diperbarui namanya/kelasnya tanpa menghapus riwayat nilai yang sudah diinput sebelumnya.
* Otomatis terhubung dengan akun Asprak yang sedang login (`assistantId`).

---

## 6. Desain Antarmuka: Neubrutalism

Mengikuti spesifikasi [design.md](./design.md):
* **Borders & Shadows:** Border hitam solid `3px solid #000000` dengan hard offset drop shadow `4px 4px 0 #000000`.
* **Palet Warna:**
  - Primary Surface: Kuning Cerah `#FFEB3B`
  - Accent / Danger / Bad Score: Merah `#FF5252`
  - Supporting / Info / Action: Biru `#2196F3`
  - Canvas / Background: Off-white / Muted light
  - Text & Outlines: Hitam Netral `#000000`
* **Tipografi:**
  - Antarmuka & Judul: Sans-serif (Bold, punchy)
  - Skor, Angka, & NIM: Monospace (`JetBrains Mono` / monospace stack) untuk presisi ala spreadsheet teknis.

---

## 7. Arsitektur Folder Modular (Feature-Based Architecture)

Untuk menjamin kemudahan pemeliharaan (*maintainability*), skalabilitas, dan keterpisahan tanggung jawab (*separation of concerns*), proyek disusun menggunakan pendekatan **Feature-First**:

```
penilaian_asistensi/
├── app/                              # Next.js App Router (Routing, Layout, Page)
│   ├── (auth)/                       # Route group untuk login / logout
│   │   └── login/
│   ├── (dashboard)/                  # Route group terproteksi
│   │   ├── layout.tsx                # Shell navigasi neubrutalist (sidebar/topbar)
│   │   ├── page.tsx                  # Dashboard overview sesuai role
│   │   ├── modul/                    # Manajemen & pengumpulan modul
│   │   ├── penilaian/                # Workspace penilaian asistensi combo
│   │   ├── kehadiran/                # Rekap absensi 12 pertemuan
│   │   ├── pretest/                  # Manajemen & penilaian pretest dinamis
│   │   └── rekap-nilai/              # Rekapitulasi nilai akhir semester & export
│   └── api/                          # Route handlers (jika diperlukan webhook/upload)
├── features/                         # DOMAIN LOGIC (Terisolasi per Fitur)
│   ├── auth/                         # Autentikasi & session guard
│   │   ├── actions/                  # Server Actions (login, logout)
│   │   ├── components/               # LoginForm, RoleGuard
│   │   ├── schemas/                  # Zod auth validation
│   │   └── types/
│   ├── modules/                      # Fitur Modul Praktikum
│   │   ├── actions/
│   │   ├── components/
│   │   └── schemas/
│   ├── students/                     # Manajemen Praktikan & Import Excel
│   │   ├── actions/                  # Import, upsert, list praktikan binaan
│   │   ├── components/               # ImportStudentModal, StudentTable
│   │   └── schemas/                  # Zod validation NIM & data mahasiswa
│   ├── submissions/                  # Fitur Upload Tugas & Storage
│   │   ├── actions/
│   │   ├── components/               # FileUploader, SubmissionViewer
│   │   └── services/                 # S3 / MinIO Presigned URL handler
│   ├── grading/                      # Fitur Penilaian Combo Asistensi
│   │   ├── actions/                  # Save grade, bulk evaluate
│   │   ├── components/               # RubricPresetButtons, ComboScoreForm, GradeSummaryTable
│   │   ├── utils/                    # Formula hitung modul (murni & unit-testable)
│   │   └── schemas/                  # Validasi skor batas atas/bawah
│   ├── attendance/                   # Fitur Kehadiran 12x
│   ├── pretests/                     # Fitur Pretest Dinamis
│   └── final-grades/                 # Fitur Rekapitulasi Akhir
│       ├── utils/                    # calculateGradeLetter() & formula semester
│       └── components/               # SpreadsheetTableView, ExportExcelButton
├── components/                       # Shared UI Primitives (Neubrutalism Kit)
│   └── ui/                           # Button, Input, Modal, Badge, Card, Table
├── lib/                              # Shared Utilities & Clients
│   ├── prisma.ts                     # Prisma client singleton (connection pooling)
│   ├── s3.ts                         # S3 / MinIO Client singleton (`server-only`)
│   └── security.ts                   # Token signing, sanitization helpers
└── prisma/
    └── schema.prisma                 # Skema basis data deklaratif
```

---

## 8. Standar Rekayasa Keamanan (Security Engineering Standards)

Keamanan adalah pilar prioritas tertinggi. Sistem menerapkan prinsip *Defense in Depth*:

1. **Pencegahan Kebocoran API & Kredensial:**
   - Semua koneksi database (`DATABASE_URL`), kredensial storage (`MINIO_SECRET_KEY`, `MINIO_ACCESS_KEY`), dan encryption key dilindungi dengan paket `import "server-only"`.
   - Client bundle tidak akan pernah memuat secret keys atau koneksi backend secara langsung.

2. **Validasi Input Ketat (Zero-Trust) via Zod:**
   - Setiap Server Action dan Route Handler memvalidasi payload menggunakan skema Zod sebelum menyentuh logika bisnis atau basis data.
   - Angka skor divalidasi memiliki batas bawah `0` dan batas atas sesuai bobot maksimum kriteria (misal: Kesesuaian Tugas `z.number().min(0).max(22)`).

3. **Role-Based Access Control (RBAC):**
   - Pemeriksaan otorisasi dilakukan secara ganda: di level **Middleware/Layout** (menolak navigasi) dan di level **Server Action** (menolak eksekusi mutasi).
   - Setiap Asprak memiliki batasan akses untuk mengelola dan menilai daftar praktikan binaannya sendiri, sementara akun dengan peran `ADMIN` memiliki hak akses penuh untuk melihat, mengevaluasi, dan mengekspor seluruh data laboratorium.

4. **Penyimpanan Berkas Aman (Presigned URLs & MIME Whitelist):**
   - Berkas tugas praktikan diunggah langsung ke MinIO menggunakan URL presigned berumur pendek (TTL 5-10 menit).
   - Sistem memvalidasi ekstensi dan tipe MIME berkas di sisi server sebelum menerbitkan URL presigned untuk mencegah eksekusi skrip berbahaya (`.exe`, `.sh`, `.php`, dsb.).

5. **Pencegahan XSS, CSRF, & SQL Injection:**
   - **XSS:** React App Router secara bawaan melakukan auto-escaping konten string. Teks feedback/catatan asisten disanitasi penuh.
   - **CSRF:** Server Actions Next.js memiliki perlindungan CSRF bawaan dengan verifikasi origin dan header `Host`. Session cookie disimpan dengan atribut `HttpOnly`, `SameSite=Lax` (atau `Strict`), dan `Secure`.
   - **SQL Injection:** Prisma ORM menggunakan kueri berparameter (*parameterized queries*) pada seluruh operasi ORM.

---

## 9. Strategi Performa Tinggi & Reusabilitas Logika

1. **React Server Components (RSC) First:**
   - Data tabel rekap, daftar modul, dan submission dimuat langsung di server (RSC) tanpa putaran bolak-balik fetch jaringan browser (meniadakan waterfall request).
2. **Kalkulasi Reaktif Murni (Pure Logic):**
   - Logika kalkulasi nilai modul dan formula semester dibuat sebagai fungsi murni (*pure functions*) yang terisolasi di `features/grading/utils/` dan `features/final-grades/utils/`.
   - Fungsi yang sama digunakan di sisi klien untuk *live preview* interaktif tanpa jeda, dan di sisi server untuk memvalidasi keaslian nilai sebelum disimpan ke PostgreSQL.
3. **Optimistic UI:**
   - Saat asisten menekan tombol rubrik combo (Sempurna, Baik, dst.), tampilan angka dan subtotal langsung merespons dalam 0 ms, memberikan kenyamanan pengalaman penggunaan setara aplikasi desktop.

---

## 10. Skema Data Relasional & Prisma ORM

ORM yang digunakan adalah **Prisma ORM** (`@prisma/client` & `prisma`). Skema dirancang agar mencakup penilaian per modul sekaligus akumulasi nilai semester (12 kehadiran, pretest dinamis, UTS, UAS, dan nilai akhir).

### Rancangan `schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  ASISTEN
}

enum SubmissionStatus {
  NOT_SUBMITTED
  SUBMITTED
  GRADED
}

enum FileType {
  PDF
  VIDEO
  IMAGE
  ARCHIVE
}

// Akun Pengguna Internal (Hanya Asisten & Admin Lab)
model User {
  id           String       @id @default(uuid())
  username     String       @unique // Kode Asprak / NIP
  name         String
  email        String?      @unique
  passwordHash String
  role         Role         @default(ASISTEN)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  students     Student[]    @relation("AssistantStudents")
  gradedItems  Grade[]      @relation("AssistantGrades")
}

// Data Praktikan (Di-import oleh masing-masing Asprak via Excel/CSV)
model Student {
  nim          String       @id // Primary Key: NIM Mahasiswa
  name         String       // Nama Lengkap Praktikan
  classGroup   String?      // Contoh: "Kelas A", "Shift Senin 08:00", "Kelompok 2"
  assistantId  String?      // Asisten pembimbing yang mengampu
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  assistant    User?        @relation("AssistantStudents", fields: [assistantId], references: [id], onDelete: SetNull)
  submissions  Submission[]
  attendances  Attendance[]
  pretestScores PretestScore[]
  finalGrade   FinalGrade?
}

model Module {
  id          String       @id @default(uuid())
  title       String       // Contoh: "Modul 1: Pointer", "Laporan Akhir"
  orderIndex  Int          // Urutan modul
  description String?
  deadline    DateTime?
  isFinalReport Boolean    @default(false) // Menandai jika entri ini adalah Laporan Akhir
  createdAt   DateTime     @default(now())

  submissions Submission[]
}

// Data Tugas/Berkas Praktikan per Modul (Dicatat/Diarsipkan oleh Asprak)
model Submission {
  id           String           @id @default(uuid())
  studentNim   String
  moduleId     String
  githubUrl    String?
  demoUrl      String?
  submittedAt  DateTime         @default(now())
  status       SubmissionStatus @default(SUBMITTED)

  student      Student          @relation(fields: [studentNim], references: [nim], onDelete: Cascade)
  module       Module           @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  files        SubmissionFile[]
  grade        Grade?

  @@unique([studentNim, moduleId])
}

model SubmissionFile {
  id           String     @id @default(uuid())
  submissionId String
  fileName     String
  fileKey      String     // Path penyimpanan di MinIO / S3
  fileUrl      String
  fileType     FileType
  fileSizeBytes Int
  createdAt    DateTime   @default(now())

  submission   Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
}

// Lembar Penilaian Asistensi per Modul
model Grade {
  id                    String     @id @default(uuid())
  submissionId          String     @unique
  assistantId           String     // Asprak yang menilai
  asistensiDate         DateTime   @default(now())

  // Komponen 1: Asistensi Code (55%)
  taskConformity        Float      @default(0) // Max 22
  programExplanation    Float      @default(0) // Max 19
  attendance            Float      @default(0) // Max 8
  attitude              Float      @default(0) // Max 6

  // Komponen 2: Laporan Resmi (35%)
  reportDiscussion      Float      @default(0) // Max 12
  reportFormat          Float      @default(0) // Max 10.5
  plagiarism            Float      @default(0) // Max 9
  neatness              Float      @default(0) // Max 3.5

  // Komponen 3: Pengumpulan (10%)
  submissionPunctuality Float      @default(0) // Max 10

  // Total Nilai Modul (Max 100)
  totalScore            Float      @default(0)
  notes                 String?

  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt

  submission            Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  assistant             User       @relation("AssistantGrades", fields: [assistantId], references: [id])
}

// Presensi 12 Pertemuan
model Attendance {
  id           String     @id @default(uuid())
  studentNim   String
  meetingNo    Int        // 1 s.d. 12
  score        Float      @default(100) // Nilai 0 - 100
  createdAt    DateTime   @default(now())

  student      Student    @relation(fields: [studentNim], references: [nim], onDelete: Cascade)

  @@unique([studentNim, meetingNo])
}

// Pretest Dinamis
model Pretest {
  id          String         @id @default(uuid())
  title       String         // Contoh: "Pretest 1", "Pretest 2"
  orderIndex  Int
  createdAt   DateTime       @default(now())

  scores      PretestScore[]
}

model PretestScore {
  id          String   @id @default(uuid())
  pretestId   String
  studentNim  String
  score       Float    @default(0) // 0 - 100
  createdAt   DateTime @default(now())

  pretest     Pretest  @relation(fields: [pretestId], references: [id], onDelete: Cascade)
  student     Student  @relation(fields: [studentNim], references: [nim], onDelete: Cascade)

  @@unique([studentNim, pretestId])
}

// Rekapitulasi Nilai Akhir Semester Praktikan
model FinalGrade {
  id                 String   @id @default(uuid())
  studentNim         String   @unique

  attendanceScore    Float    @default(0) // Rata-rata kehadiran (10%)
  assignmentsScore   Float    @default(0) // Rata-rata modul 1..N + Lap Akhir (20%)
  pretestScore       Float    @default(0) // Rata-rata pretest dinamis (10%)
  utsScore           Float    @default(0) // Nilai Murni UTS (25%)
  uasScore           Float    @default(0) // Nilai Murni UAS (35%)

  totalScore         Float    @default(0) // Total Angka 0 - 100
  gradeLetter        String?  // 'A', 'B+', 'B', 'C+', 'C', 'D', 'E'

  updatedAt          DateTime @updatedAt

  student            Student  @relation(fields: [studentNim], references: [nim], onDelete: Cascade)
}
```

---

## 11. Catatan Keputusan & Diskusi Terbuka (Open Items)

Dokumen ini akan terus diperbarui seiring berjalannya diskusi:

- [x] Porsi dan kriteria penilaian fix per modul (55% Asistensi Code, 35% Laporan Resmi, 10% Pengumpulan).
- [x] Sistem input nilai kombo (tombol rubrik preset + input angka manual desimal).
- [x] Porsi penilaian akhir semester (10% Kehadiran 12x, 20% Tugas & Modul Dinamis $N$ modul + opsi Laporan Akhir, 10% Pretest Dinamis, 25% UTS, 35% UAS -> Total 100% & Konversi Nilai Huruf).
- [x] **Lingkup Pengguna:** Aplikasi tertutup khusus internal Asprak & Admin (mahasiswa tidak login). Data praktikan di-import per asprak via Excel/CSV dengan primary key **NIM**.
- [x] Target infrastruktur dev: Next.js + PostgreSQL Local + MinIO Object Storage.
- [x] Dukungan format submission: File (PDF, Video, Gambar, ZIP) dan Link (GitHub, Demo URL).
- [x] **Pemilihan ORM:** **Prisma ORM** (Model `schema.prisma` type-safe, migrasi deklaratif).
- [x] **Standar Arsitektur & Keamanan:** Feature-First directory, Zero-Trust Zod validation, `server-only` secrets, Presigned S3 URLs, RBAC ganda, dan Pure Logic calculation.
- [x] **Metode Autentikasi:** **Opsi A** (Custom Auth ultra-ringan & cepat berbasis `jose` JWT + `bcryptjs` disimpan di `HttpOnly`, `SameSite=Lax`, `Secure` cookies).
- [x] **Lingkungan Lokal:** Native Service / Non-Docker (PostgreSQL lokal native + MinIO lokal binary/service terhubung melalui `.env`).

---

## 12. Kesiapan Eksekusi (Ready for Implementation)

Seluruh spesifikasi arsitektur, kebutuhan fungsional, formula matematis, standar keamanan, dan skema basis data telah **disetujui sepenuhnya (100% Locked & Agreed)**. Proyek siap dieksekusi saat ada aba-aba dari pengguna.
