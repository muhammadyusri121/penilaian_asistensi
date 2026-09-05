import * as XLSX from "xlsx";

interface ExportSemesterData {
  modules: Array<{ id: string; title: string }>;
  pretests: Array<{ id: string; title: string }>;
  weights?: {
    attendance: number;
    assignment: number;
    pretest: number;
    uts: number;
    uas: number;
  };
  students: Array<{
    student: {
      nim: string;
      name: string;
      classGroup?: string | null;
      assistant?: { name: string; username: string } | null;
    };
    attendanceScores: number[];
    moduleScores: number[];
    pretestScoresArray: number[];
    rawUtsScore: number;
    rawUasScore: number;
    summary: {
      attendanceScore: number;
      assignmentsScore: number;
      pretestScore: number;
      utsScore: number;
      uasScore: number;
      totalScore: number;
      gradeLetter: string;
    };
  }>;
}

/**
 * Generate dan unduh file spreadsheet Excel (.xlsx) dengan struktur persis format resmi laboratorium
 */
export function exportSemesterToExcel(data: ExportSemesterData, filename = "Rekap_Nilai_Praktikum.xlsx") {
  const hasAssistant = data.students.some((s) => s.student.assistant);
  const w = data.weights ?? { attendance: 10, assignment: 20, pretest: 10, uts: 25, uas: 35 };

  const headers = [
    "No",
    "NIM",
    "Nama Lengkap",
    "Kelas/Shift",
    ...(hasAssistant ? ["Asisten Pembina"] : []),
    // Kehadiran 1..12
    ...Array.from({ length: 12 }, (_, i) => `P${i + 1}`),
    `Total Presensi (${w.attendance}%)`,
    // Modul dinamis
    ...data.modules.map((m) => m.title),
    `Total Modul (${w.assignment}%)`,
    // Pretests dinamis
    ...data.pretests.map((p) => p.title),
    `Total Pretest (${w.pretest}%)`,
    // Ujian
    "Nilai Murni UTS",
    `Persentase UTS (${w.uts}%)`,
    "Nilai Murni UAS",
    `Persentase UAS (${w.uas}%)`,
    // Akhir
    "TOTAL NILAI",
    "NILAI AKHIR (NA)",
  ];

  const rows = data.students.map((item, index) => {
    return [
      index + 1,
      item.student.nim,
      item.student.name,
      item.student.classGroup || "-",
      ...(hasAssistant ? [item.student.assistant?.name || "-"] : []),
      // 12 presensi
      ...item.attendanceScores,
      item.summary.attendanceScore,
      // Modul scores
      ...item.moduleScores,
      item.summary.assignmentsScore,
      // Pretest scores
      ...item.pretestScoresArray,
      item.summary.pretestScore,
      // UTS & UAS (menggunakan nilai murni langsung tanpa pembagian float)
      item.rawUtsScore,
      item.summary.utsScore,
      item.rawUasScore,
      item.summary.uasScore,
      // Total & Grade
      item.summary.totalScore,
      item.summary.gradeLetter,
    ];
  });

  const worksheetData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set lebar kolom otomatis
  ws["!cols"] = [
    { wch: 5 },  // No
    { wch: 15 }, // NIM
    { wch: 30 }, // Nama
    { wch: 15 }, // Kelas
    ...(hasAssistant ? [{ wch: 20 }] : []),
    ...Array(12).fill({ wch: 6 }), // 12 presensi
    { wch: 18 }, // Total Presensi
    ...data.modules.map(() => ({ wch: 16 })), // Modul
    { wch: 16 }, // Total Modul
    ...data.pretests.map(() => ({ wch: 14 })), // Pretest
    { wch: 16 }, // Total Pretest
    { wch: 15 }, // UTS Murni
    { wch: 18 }, // UTS 25%
    { wch: 15 }, // UAS Murni
    { wch: 18 }, // UAS 35%
    { wch: 15 }, // Total
    { wch: 16 }, // NA
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rekap Nilai Semester");
  XLSX.writeFile(wb, filename);
}
