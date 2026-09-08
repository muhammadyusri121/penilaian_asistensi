"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ComboGradingModal } from "./combo-grading-modal";
import { ArrowLeft, Search, Edit3, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDateDMY } from "../utils/date";

interface ModuleGradingWorkspaceProps {
  module: {
    id: string;
    title: string;
    orderIndex: number;
    description?: string | null;
    courseId?: string;
  };
  initialStudents: Array<{
    nim: string;
    name: string;
    classGroup?: string | null;
    enrollmentStatus?: string;
    submissions: Array<{
      id: string;
      moduleId: string;
      status: string;
      githubUrl?: string | null;
      demoUrl?: string | null;
      grade?: {
        asistensiDate: Date;
        taskConformity: number;
        programExplanation: number;
        attendance: number;
        attitude: number;
        reportDiscussion: number;
        reportFormat: number;
        plagiarism: number;
        neatness: number;
        submissionPunctuality: number;
        totalScore: number;
        notes?: string | null;
      } | null;
    }>;
  }>;
}

export function ModuleGradingWorkspace({
  module,
  initialStudents,
}: ModuleGradingWorkspaceProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<{
    nim: string;
    name: string;
    classGroup?: string | null;
    currentGrade?: {
      asistensiDate?: Date;
      taskConformity: number;
      programExplanation: number;
      attendance: number;
      attitude: number;
      reportDiscussion: number;
      reportFormat: number;
      plagiarism: number;
      neatness: number;
      submissionPunctuality: number;
      notes?: string | null;
    } | null;
    githubUrl?: string | null;
    demoUrl?: string | null;
  } | null>(null);

  const filteredStudents = initialStudents.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.nim.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.classGroup && s.classGroup.toLowerCase().includes(q))
    );
  });

  const gradedCount = initialStudents.filter(
    (s) => s.submissions[0]?.grade?.totalScore !== undefined
  ).length;

  const averageScore =
    gradedCount > 0
      ? Number(
          (
            initialStudents.reduce((acc, s) => acc + (s.submissions[0]?.grade?.totalScore ?? 0), 0) /
            gradedCount
          ).toFixed(1)
        )
      : 0;

  function openGradeModal(student: (typeof initialStudents)[0]) {
    if (student.enrollmentStatus && student.enrollmentStatus !== "APPROVED") {
      alert("Praktikan ini berstatus Menunggu ACC dari Koordinator Lab dan belum dapat dinilai.");
      return;
    }
    const sub = student.submissions[0];
    setSelectedStudent({
      nim: student.nim,
      name: student.name,
      classGroup: student.classGroup,
      currentGrade: sub?.grade,
      githubUrl: sub?.githubUrl,
      demoUrl: sub?.demoUrl,
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="neo-box bg-[#FFEB3B] p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={module.courseId ? `/${module.courseId}/modul` : "/praktikum"}
            className="neo-btn p-2 bg-white text-black hover:bg-neutral-100 flex items-center justify-center"
            title="Kembali ke Daftar Modul"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="neo-box-sm px-2 py-0.5 bg-black text-[#FFEB3B] font-mono text-xs font-black">
                MODUL #{module.orderIndex}
              </span>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">
                {module.title}
              </h1>
            </div>
            <p className="text-xs font-medium text-neutral-800 mt-0.5">
              Lembar Penilaian Asistensi Praktikum (Asistensi 55%, Laporan 35%, Pengumpulan 10%)
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2">
          <div className="neo-box-sm bg-white px-3 py-1.5 text-center">
            <span className="text-[10px] font-bold text-neutral-500 uppercase block">Dinilai</span>
            <span className="text-base font-black font-mono-numbers text-black">
              {gradedCount} / {initialStudents.length}
            </span>
          </div>
          <div className="neo-box-sm bg-neutral-900 text-white px-3 py-1.5 text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Rata-rata</span>
            <span className="text-base font-black font-mono-numbers text-[#FFEB3B]">
              {averageScore}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="neo-box p-3 bg-white flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Cari NIM atau Nama praktikan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="neo-input w-full pl-9 pr-3 py-1.5 text-xs font-medium"
          />
        </div>
        <div className="text-xs font-black uppercase text-neutral-600">
          Total: <span className="text-black font-mono">{filteredStudents.length} Praktikan</span>
        </div>
      </div>

      {/* Spreadsheet Table View */}
      <div className="neo-box bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border-b-2 border-black">
            {/* Super Headers */}
            <thead className="bg-black text-white font-mono uppercase text-[11px] border-b-2 border-black">
              <tr>
                <th rowSpan={2} className="p-2 border-r border-neutral-700 text-center w-10">No</th>
                <th rowSpan={2} className="p-2 border-r border-neutral-700 w-28 text-center">Tgl Asistensi</th>
                <th rowSpan={2} className="p-2 border-r border-neutral-700 w-32">NIM</th>
                <th rowSpan={2} className="p-2 border-r border-neutral-700 min-w-[160px]">Nama Lengkap</th>
                <th colSpan={5} className="p-2 border-r border-neutral-700 text-center bg-amber-500 text-black font-black">
                  Asistensi Code (55%)
                </th>
                <th colSpan={5} className="p-2 border-r border-neutral-700 text-center bg-sky-500 text-black font-black">
                  Laporan Resmi (35%)
                </th>
                <th rowSpan={2} className="p-2 border-r border-neutral-700 text-center bg-emerald-500 text-black font-black w-24">
                  Pengumpulan (10)
                </th>
                <th rowSpan={2} className="p-2 border-r border-neutral-700 text-center bg-yellow-300 text-black font-black w-24">
                  Total Nilai (100)
                </th>
                <th rowSpan={2} className="p-2 text-center w-28 bg-neutral-800 text-white">Aksi</th>
              </tr>
              <tr className="bg-neutral-900 text-[10px] text-neutral-300">
                {/* Subheaders Asistensi Code */}
                <th className="p-1.5 border-r border-neutral-700 text-center">Tugas (22)</th>
                <th className="p-1.5 border-r border-neutral-700 text-center">Penjelasan (19)</th>
                <th className="p-1.5 border-r border-neutral-700 text-center">Kehadiran (8)</th>
                <th className="p-1.5 border-r border-neutral-700 text-center">Sikap (6)</th>
                <th className="p-1.5 border-r border-neutral-700 text-center bg-amber-600 text-black font-black">Jumlah (55)</th>

                {/* Subheaders Laporan Resmi */}
                <th className="p-1.5 border-r border-neutral-700 text-center">Pembahasan (12)</th>
                <th className="p-1.5 border-r border-neutral-700 text-center">Format (10.5)</th>
                <th className="p-1.5 border-r border-neutral-700 text-center">Plagiat (9)</th>
                <th className="p-1.5 border-r border-neutral-700 text-center">Rapi (3.5)</th>
                <th className="p-1.5 border-r border-neutral-700 text-center bg-sky-600 text-black font-black">Jumlah (35)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-300 font-mono-numbers">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={17} className="p-8 text-center text-neutral-500 font-sans">
                    <p className="font-bold uppercase text-sm">Tidak ada mahasiswa terdaftar</p>
                    <p className="text-xs mt-1">Buka menu Data Praktikan untuk mengimpor daftar mahasiswa.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const sub = s.submissions[0];
                  const gr = sub?.grade;

                  const asistensiSubtotal = gr
                    ? Number((gr.taskConformity + gr.programExplanation + gr.attendance + gr.attitude).toFixed(1))
                    : 0;

                  const reportSubtotal = gr
                    ? Number((gr.reportDiscussion + gr.reportFormat + gr.plagiarism + gr.neatness).toFixed(1))
                    : 0;

                  const total = gr?.totalScore ?? 0;
                  const isGraded = gr !== null && gr !== undefined;

                  const formattedDate = gr?.asistensiDate
                    ? formatDateDMY(gr.asistensiDate)
                    : "-";

                  return (
                    <tr
                      key={s.nim}
                      className={`hover:bg-yellow-50/70 transition-colors ${
                        isGraded ? "bg-white" : "bg-neutral-50/50"
                      }`}
                    >
                      <td className="p-2 border-r border-neutral-300 text-center font-bold text-neutral-500">
                        {idx + 1}
                      </td>
                      <td className="p-2 border-r border-neutral-300 text-center font-mono text-[11px] text-neutral-700">
                        {formattedDate}
                      </td>
                      <td className="p-2 border-r border-neutral-300 font-black text-black">
                        {s.nim}
                      </td>
                      <td className="p-2 border-r border-neutral-300 font-sans font-bold text-black">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span>{s.name}</span>
                            {s.enrollmentStatus && s.enrollmentStatus !== "APPROVED" && (
                              <span className="neo-box-sm bg-[#FFEB3B] text-black text-[9px] px-1 py-0.5 font-bold inline-flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" />
                                Menunggu ACC
                              </span>
                            )}
                          </div>
                          {s.classGroup && (
                            <span className="text-[10px] text-neutral-500 font-normal">
                              {s.classGroup}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Asistensi Code (4 criteria + Subtotal) */}
                      <td className="p-2 border-r border-neutral-200 text-center">{gr?.taskConformity ?? "-"}</td>
                      <td className="p-2 border-r border-neutral-200 text-center">{gr?.programExplanation ?? "-"}</td>
                      <td className="p-2 border-r border-neutral-200 text-center">{gr?.attendance ?? "-"}</td>
                      <td className="p-2 border-r border-neutral-200 text-center">{gr?.attitude ?? "-"}</td>
                      <td className="p-2 border-r border-neutral-300 text-center font-black bg-amber-50 text-amber-900">
                        {isGraded ? asistensiSubtotal : "-"}
                      </td>

                      {/* Laporan Resmi (4 criteria + Subtotal) */}
                      <td className="p-2 border-r border-neutral-200 text-center">{gr?.reportDiscussion ?? "-"}</td>
                      <td className="p-2 border-r border-neutral-200 text-center">{gr?.reportFormat ?? "-"}</td>
                      <td className="p-2 border-r border-neutral-200 text-center">{gr?.plagiarism ?? "-"}</td>
                      <td className="p-2 border-r border-neutral-200 text-center">{gr?.neatness ?? "-"}</td>
                      <td className="p-2 border-r border-neutral-300 text-center font-black bg-sky-50 text-sky-900">
                        {isGraded ? reportSubtotal : "-"}
                      </td>

                      {/* Pengumpulan (10) */}
                      <td className="p-2 border-r border-neutral-300 text-center font-bold bg-emerald-50/50">
                        {gr?.submissionPunctuality ?? "-"}
                      </td>

                      {/* Total Nilai (100) */}
                      <td className="p-2 border-r border-neutral-300 text-center font-black text-sm bg-yellow-100/60 text-black">
                        {isGraded ? total : "-"}
                      </td>

                      {/* Aksi Button */}
                      <td className="p-2 text-center">
                        {s.enrollmentStatus && s.enrollmentStatus !== "APPROVED" ? (
                          <button
                            disabled
                            className="neo-btn px-1.5 py-1 text-[10px] font-black bg-neutral-200 text-neutral-500 cursor-not-allowed flex items-center justify-center gap-1 w-full"
                            title="Praktikan ini berstatus Menunggu ACC dari Koordinator Lab dan belum dapat dinilai."
                          >
                            <Lock className="w-3 h-3" />
                            Menunggu ACC
                          </button>
                        ) : (
                          <button
                            onClick={() => openGradeModal(s)}
                            className={`neo-btn px-2.5 py-1 text-[11px] font-black cursor-pointer flex items-center justify-center gap-1 w-full ${
                              isGraded
                                ? "bg-white text-black hover:bg-neutral-100"
                                : "bg-[#FFEB3B] text-black hover:bg-yellow-400"
                            }`}
                          >
                            <Edit3 className="w-3 h-3" />
                            {isGraded ? "Edit" : "Nilai"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Penilaian Combo */}
      <ComboGradingModal
        key={selectedStudent?.nim}
        isOpen={selectedStudent !== null}
        onClose={() => setSelectedStudent(null)}
        moduleId={module.id}
        moduleTitle={module.title}
        student={selectedStudent}
        onSuccess={() => {
          setSelectedStudent(null);
          router.refresh();
        }}
      />
    </div>
  );
}
