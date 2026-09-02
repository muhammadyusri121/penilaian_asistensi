/**
 * Pure calculation utilities for grading system
 * Sesuai dengan spesifikasi PRD.md dan formula resmi laboratorium
 */

export interface ModuleCriteriaScores {
  // Asistensi Code (55%)
  taskConformity: number;       // Max 22
  programExplanation: number;   // Max 19
  attendance: number;           // Max 8
  attitude: number;             // Max 6

  // Laporan Resmi (35%)
  reportDiscussion: number;     // Max 12
  reportFormat: number;         // Max 10.5
  plagiarism: number;           // Max 9
  neatness: number;             // Max 3.5

  // Pengumpulan (10%)
  submissionPunctuality: number;// Max 10
}

export interface ModuleScoreResult {
  asistensiSubtotal: number; // Max 55
  reportSubtotal: number;    // Max 35
  punctuality: number;       // Max 10
  totalScore: number;        // Max 100
}

/**
 * Hitung subtotal dan total nilai satu modul asistensi
 */
export function calculateModuleScore(scores: Partial<ModuleCriteriaScores>): ModuleScoreResult {
  const taskConformity = Math.min(22, Math.max(0, scores.taskConformity ?? 0));
  const programExplanation = Math.min(19, Math.max(0, scores.programExplanation ?? 0));
  const attendance = Math.min(8, Math.max(0, scores.attendance ?? 0));
  const attitude = Math.min(6, Math.max(0, scores.attitude ?? 0));

  const reportDiscussion = Math.min(12, Math.max(0, scores.reportDiscussion ?? 0));
  const reportFormat = Math.min(10.5, Math.max(0, scores.reportFormat ?? 0));
  const plagiarism = Math.min(9, Math.max(0, scores.plagiarism ?? 0));
  const neatness = Math.min(3.5, Math.max(0, scores.neatness ?? 0));

  const punctuality = Math.min(10, Math.max(0, scores.submissionPunctuality ?? 0));

  const asistensiSubtotal = Number((taskConformity + programExplanation + attendance + attitude).toFixed(2));
  const reportSubtotal = Number((reportDiscussion + reportFormat + plagiarism + neatness).toFixed(2));
  const totalScore = Number((asistensiSubtotal + reportSubtotal + punctuality).toFixed(2));

  return {
    asistensiSubtotal,
    reportSubtotal,
    punctuality,
    totalScore,
  };
}

/**
 * Konversi nilai angka ke Huruf Mutu
 * Mengimplementasikan persis formula Excel laboratorium:
 * =IF(AI6<50,"E",IF(AND(AI6<=60),"D",IF(AND(AI6>60,AI6<=65),"C",IF(AND(AI6>65,AI6<=70),"C+",IF(AND(AI6>70,AI6<=75),"B",IF(AND(AI6>75,AI6<=80),"B+",IF(AI6>80,"A")))))))
 */
export function calculateGradeLetter(score: number): string {
  if (score < 50) return "E";
  if (score <= 60) return "D";
  if (score <= 65) return "C";
  if (score <= 70) return "C+";
  if (score <= 75) return "B";
  if (score <= 80) return "B+";
  return "A";
}

export interface SemesterComponents {
  attendances: number[];       // Array nilai presensi (12 pertemuan, 0-100)
  moduleScores: number[];      // Array nilai total modul (N modul dinamis, 0-100)
  pretestScores: number[];     // Array nilai pretest (dinamis, 0-100)
  utsScore: number;            // Nilai murni UTS (0-100)
  uasScore: number;            // Nilai murni UAS (0-100)
}

export interface SemesterFinalResult {
  attendanceScore: number;     // Kontribusi 10%
  assignmentsScore: number;    // Kontribusi 20%
  pretestScore: number;        // Kontribusi 10%
  utsScore: number;            // Kontribusi 25%
  uasScore: number;            // Kontribusi 35%
  totalScore: number;          // Total Kumulatif 0 - 100
  gradeLetter: string;         // 'A', 'B+', 'B', 'C+', 'C', 'D', 'E'
}

/**
 * Hitung rekapitulasi nilai akhir semester praktikum (Bobot Kumulatif 100%)
 */
export function calculateSemesterFinalGrade(data: SemesterComponents): SemesterFinalResult {
  // 1. Kehadiran (10%): rata-rata 12 pertemuan
  const avgAttendance = data.attendances.length > 0
    ? data.attendances.reduce((acc, curr) => acc + curr, 0) / 12
    : 0;
  const attendanceScore = Number((avgAttendance * 0.10).toFixed(2));

  // 2. Tugas & Laporan Modul (20%): rata-rata N modul dinamis
  const avgModules = data.moduleScores.length > 0
    ? data.moduleScores.reduce((acc, curr) => acc + curr, 0) / data.moduleScores.length
    : 0;
  const assignmentsScore = Number((avgModules * 0.20).toFixed(2));

  // 3. Pretest (10%): rata-rata N sesi pretest dinamis
  const avgPretest = data.pretestScores.length > 0
    ? data.pretestScores.reduce((acc, curr) => acc + curr, 0) / data.pretestScores.length
    : 0;
  const pretestScore = Number((avgPretest * 0.10).toFixed(2));

  // 4. UTS (25%): nilai murni * 25%
  const utsScore = Number(((data.utsScore ?? 0) * 0.25).toFixed(2));

  // 5. UAS (35%): nilai murni * 35%
  const uasScore = Number(((data.uasScore ?? 0) * 0.35).toFixed(2));

  // Total Nilai Angka
  const totalScore = Number(
    (attendanceScore + assignmentsScore + pretestScore + utsScore + uasScore).toFixed(2)
  );

  const gradeLetter = calculateGradeLetter(totalScore);

  return {
    attendanceScore,
    assignmentsScore,
    pretestScore,
    utsScore,
    uasScore,
    totalScore,
    gradeLetter,
  };
}

/**
 * Persentase tombol rubrik cepat (Combo buttons)
 */
export const RUBRIC_PRESETS = [
  { label: "Sempurna", percentage: 1.0, colorClass: "bg-[#4CAF50] text-black" },
  { label: "Baik", percentage: 0.8, colorClass: "bg-[#8BC34A] text-black" },
  { label: "Cukup", percentage: 0.6, colorClass: "bg-[#FFEB3B] text-black" },
  { label: "Kurang", percentage: 0.4, colorClass: "bg-[#FF9800] text-black" },
  { label: "Sangat Buruk", percentage: 0.2, colorClass: "bg-[#FF5252] text-white" },
] as const;

/**
 * Nilai maksimal per kriteria modul
 */
export const CRITERIA_MAX_SCORES = {
  taskConformity: 22,
  programExplanation: 19,
  attendance: 8,
  attitude: 6,
  reportDiscussion: 12,
  reportFormat: 10.5,
  plagiarism: 9,
  neatness: 3.5,
  submissionPunctuality: 10,
} as const;
