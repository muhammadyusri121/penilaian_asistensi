"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { exportSemesterToExcel } from "../utils/export-excel";
import { updateExamScoreAction } from "../actions/final-grades.actions";
import { Download, Search, Edit3 } from "lucide-react";
import { useRouter } from "next/navigation";

interface SemesterTableViewProps {
  data: {
    modules: Array<{ id: string; title: string; orderIndex: number; isFinalReport: boolean }>;
    pretests: Array<{ id: string; title: string; orderIndex: number }>;
    students: Array<{
      student: {
        nim: string;
        name: string;
        classGroup?: string | null;
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
  };
}

export function SemesterTableView({ data }: SemesterTableViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedStudentForExam, setSelectedStudentForExam] = useState<{
    nim: string;
    name: string;
    uts: number;
    uas: number;
  } | null>(null);

  const [utsInput, setUtsInput] = useState<number>(0);
  const [uasInput, setUasInput] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [examError, setExamError] = useState<string | null>(null);

  const filtered = data.students.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.student.nim.toLowerCase().includes(q) ||
      item.student.name.toLowerCase().includes(q) ||
      (item.student.classGroup && item.student.classGroup.toLowerCase().includes(q))
    );
  });

  function handleExport() {
    exportSemesterToExcel(data, `Rekap_Nilai_Praktikum_${new Date().toISOString().split("T")[0]}.xlsx`);
  }

  function openExamModal(item: (typeof data.students)[0]) {
    const utsMurni = item.rawUtsScore;
    const uasMurni = item.rawUasScore;
    setExamError(null);
    setSelectedStudentForExam({
      nim: item.student.nim,
      name: item.student.name,
      uts: utsMurni,
      uas: uasMurni,
    });
    setUtsInput(utsMurni);
    setUasInput(uasMurni);
  }

  async function handleSaveExams(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudentForExam) return;
    setLoading(true);
    setExamError(null);

    try {
      const res = await updateExamScoreAction(selectedStudentForExam.nim, utsInput, uasInput);
      if (res.success) {
        setSelectedStudentForExam(null);
        router.refresh();
      } else {
        setExamError(res.message || "Gagal menyimpan nilai ujian.");
      }
    } catch {
      setExamError("Terjadi kendala koneksi ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="neo-box p-4 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Cari NIM atau Nama praktikan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="neo-input w-full pl-9 pr-3 py-2 text-xs font-medium"
          />
        </div>

        <Button type="button" variant="primary" size="md" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Download Rekap Excel (.xlsx)
        </Button>
      </div>

      {/* Main Recapitulation Table */}
      <div className="neo-box bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border-b-2 border-black">
            {/* Top Super-Headers */}
            <thead className="bg-black text-white font-mono uppercase text-[11px] border-b-2 border-black">
              <tr>
                <th rowSpan={2} className="p-2 border-r border-neutral-700 text-center w-10">No</th>
                <th rowSpan={2} className="p-2 border-r border-neutral-700 w-28">NIM</th>
                <th rowSpan={2} className="p-2 border-r border-neutral-700 min-w-[150px]">Nama Lengkap</th>
                
                {/* 1. Kehadiran 10% */}
                <th colSpan={13} className="p-2 border-r border-neutral-700 text-center bg-amber-400 text-black font-black">
                  Kehadiran Praktikan (10%)
                </th>

                {/* 2. Tugas & Laporan 20% */}
                <th colSpan={data.modules.length + 2} className="p-2 border-r border-neutral-700 text-center bg-sky-400 text-black font-black">
                  Tugas dan Laporan (20%)
                </th>

                {/* 3. Pretest 10% */}
                <th colSpan={Math.max(1, data.pretests.length) + 2} className="p-2 border-r border-neutral-700 text-center bg-teal-400 text-black font-black">
                  Pretest (10%)
                </th>

                {/* 4. UTS 25% */}
                <th colSpan={2} className="p-2 border-r border-neutral-700 text-center bg-orange-400 text-black font-black">
                  UTS (25%)
                </th>

                {/* 5. UAS 35% */}
                <th colSpan={2} className="p-2 border-r border-neutral-700 text-center bg-rose-400 text-black font-black">
                  UAS (35%)
                </th>

                {/* Total & NA */}
                <th rowSpan={2} className="p-2 border-r border-neutral-700 text-center bg-neutral-900 text-[#FFEB3B] font-black w-20">
                  Total Nilai
                </th>
                <th rowSpan={2} className="p-2 border-r border-neutral-700 text-center bg-[#FFEB3B] text-black font-black w-24">
                  Nilai Akhir (NA)
                </th>
                <th rowSpan={2} className="p-2 text-center w-20 bg-neutral-800 text-white">
                  Ujian
                </th>
              </tr>

              {/* Sub-Headers */}
              <tr className="bg-neutral-900 text-[10px] text-neutral-300">
                {/* 12 Presensi + Total */}
                {Array.from({ length: 12 }, (_, i) => (
                  <th key={i} className="p-1 border-r border-neutral-700 text-center w-8">
                    {i + 1}
                  </th>
                ))}
                <th className="p-1 border-r border-neutral-700 text-center bg-amber-500 text-black font-black w-12">
                  Total
                </th>

                {/* Modul 1..N + Average + Total */}
                {data.modules.map((m) => (
                  <th key={m.id} className="p-1 border-r border-neutral-700 text-center min-w-[70px]">
                    {m.isFinalReport ? "Lap Akhir" : `M${m.orderIndex}`}
                  </th>
                ))}
                <th className="p-1 border-r border-neutral-700 text-center bg-sky-500 text-black font-black w-14">
                  Average
                </th>
                <th className="p-1 border-r border-neutral-700 text-center bg-sky-600 text-black font-black w-14">
                  Total (20%)
                </th>

                {/* Pretest + Average + Total */}
                {data.pretests.length === 0 ? (
                  <th className="p-1 border-r border-neutral-700 text-center">Pretest 1</th>
                ) : (
                  data.pretests.map((p) => (
                    <th key={p.id} className="p-1 border-r border-neutral-700 text-center min-w-[70px]">
                      {p.title}
                    </th>
                  ))
                )}
                <th className="p-1 border-r border-neutral-700 text-center bg-teal-500 text-black font-black w-14">
                  Average
                </th>
                <th className="p-1 border-r border-neutral-700 text-center bg-teal-600 text-black font-black w-14">
                  Total (10%)
                </th>

                {/* UTS */}
                <th className="p-1 border-r border-neutral-700 text-center w-14">Murni</th>
                <th className="p-1 border-r border-neutral-700 text-center bg-orange-500 text-black font-black w-14">25%</th>

                {/* UAS */}
                <th className="p-1 border-r border-neutral-700 text-center w-14">Murni</th>
                <th className="p-1 border-r border-neutral-700 text-center bg-rose-500 text-black font-black w-14">35%</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-neutral-200 font-mono-numbers">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={30} className="p-8 text-center text-neutral-500 font-sans">
                    <p className="font-bold uppercase text-sm">Tidak ada data praktikan</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const s = item.student;
                  const sum = item.summary;
                  const avgMod = Number((sum.assignmentsScore / 0.20).toFixed(1));
                  const avgPre = Number((sum.pretestScore / 0.10).toFixed(1));

                  return (
                    <tr key={s.nim} className="hover:bg-yellow-50/70 transition-colors">
                      <td className="p-2 border-r border-neutral-300 text-center font-bold text-neutral-500">
                        {idx + 1}
                      </td>
                      <td className="p-2 border-r border-neutral-300 font-black text-black">
                        {s.nim}
                      </td>
                      <td className="p-2 border-r border-neutral-300 font-sans font-bold text-black">
                        {s.name}
                      </td>

                      {/* 12 Presensi */}
                      {item.attendanceScores.map((sc, i) => (
                        <td key={i} className="p-1 border-r border-neutral-200 text-center text-[11px]">
                          {sc}
                        </td>
                      ))}
                      <td className="p-1 border-r border-neutral-300 text-center font-black bg-amber-50 text-amber-900">
                        {sum.attendanceScore}
                      </td>

                      {/* Modul scores */}
                      {item.moduleScores.map((sc, i) => (
                        <td key={i} className="p-1 border-r border-neutral-200 text-center text-[11px]">
                          {sc > 0 ? sc : "-"}
                        </td>
                      ))}
                      <td className="p-1 border-r border-neutral-300 text-center font-bold bg-sky-50">
                        {avgMod > 0 ? avgMod : "-"}
                      </td>
                      <td className="p-1 border-r border-neutral-300 text-center font-black bg-sky-100 text-sky-900">
                        {sum.assignmentsScore > 0 ? sum.assignmentsScore : "-"}
                      </td>

                      {/* Pretest scores */}
                      {item.pretestScoresArray.length === 0 ? (
                        <td className="p-1 border-r border-neutral-200 text-center">-</td>
                      ) : (
                        item.pretestScoresArray.map((sc, i) => (
                          <td key={i} className="p-1 border-r border-neutral-200 text-center text-[11px]">
                            {sc > 0 ? sc : "-"}
                          </td>
                        ))
                      )}
                      <td className="p-1 border-r border-neutral-300 text-center font-bold bg-teal-50">
                        {avgPre > 0 ? avgPre : "-"}
                      </td>
                      <td className="p-1 border-r border-neutral-300 text-center font-black bg-teal-100 text-teal-900">
                        {sum.pretestScore > 0 ? sum.pretestScore : "-"}
                      </td>

                      {/* UTS */}
                      <td className="p-1 border-r border-neutral-200 text-center font-medium">
                        {item.rawUtsScore > 0 ? item.rawUtsScore : "-"}
                      </td>
                      <td className="p-1 border-r border-neutral-300 text-center font-black bg-orange-50 text-orange-900">
                        {sum.utsScore > 0 ? sum.utsScore : "-"}
                      </td>

                      {/* UAS */}
                      <td className="p-1 border-r border-neutral-200 text-center font-medium">
                        {item.rawUasScore > 0 ? item.rawUasScore : "-"}
                      </td>
                      <td className="p-1 border-r border-neutral-300 text-center font-black bg-rose-50 text-rose-900">
                        {sum.uasScore > 0 ? sum.uasScore : "-"}
                      </td>

                      {/* TOTAL NILAI */}
                      <td className="p-2 border-r border-neutral-300 text-center font-black text-sm bg-neutral-100 text-black">
                        {sum.totalScore}
                      </td>

                      {/* NILAI AKHIR HURUF MUTU (NA) */}
                      <td className="p-2 border-r border-neutral-300 text-center">
                        <span
                          className={`neo-box-sm px-2.5 py-1 text-xs font-black inline-block ${
                            sum.gradeLetter === "A"
                              ? "bg-[#4CAF50] text-black"
                              : sum.gradeLetter.startsWith("B")
                              ? "bg-[#2196F3] text-white"
                              : sum.gradeLetter.startsWith("C")
                              ? "bg-[#FFEB3B] text-black"
                              : "bg-[#FF5252] text-white"
                          }`}
                        >
                          {sum.gradeLetter}
                        </span>
                      </td>

                      {/* Input Ujian Button */}
                      <td className="p-1 text-center">
                        <button
                          onClick={() => openExamModal(item)}
                          className="neo-btn p-1 px-2 text-[10px] bg-white hover:bg-neutral-100 text-black cursor-pointer inline-flex items-center gap-1"
                          title="Input Nilai UTS & UAS"
                        >
                          <Edit3 className="w-3 h-3" />
                          UTS/UAS
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input UTS & UAS */}
      <Modal
        isOpen={selectedStudentForExam !== null}
        onClose={() => setSelectedStudentForExam(null)}
        title={`Nilai Ujian: ${selectedStudentForExam?.name}`}
        maxWidth="sm"
      >
        <form onSubmit={handleSaveExams} className="space-y-4">
          <p className="text-xs text-neutral-600 font-bold">
            Masukkan nilai murni (0 - 100) untuk UTS dan UAS mahasiswa <strong className="text-black">{selectedStudentForExam?.nim}</strong>.
          </p>

          {examError && (
            <div className="neo-box-sm bg-[#FF5252] text-white p-2.5 text-xs font-black">
              ⚠️ {examError}
            </div>
          )}

          <Input
            label="Nilai Murni UTS (Bobot 25%)"
            type="number"
            min={0}
            max={100}
            step="0.1"
            required
            value={utsInput}
            onChange={(e) => setUtsInput(parseFloat(e.target.value) || 0)}
          />

          <Input
            label="Nilai Murni UAS (Bobot 35%)"
            type="number"
            min={0}
            max={100}
            step="0.1"
            required
            value={uasInput}
            onChange={(e) => setUasInput(parseFloat(e.target.value) || 0)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setSelectedStudentForExam(null)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Nilai Ujian"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
