"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CourseImportModal } from "./course-import-modal";
import { createStudentInCourseAction, removeStudentFromCourseAction } from "../actions/student.actions";
import { submitCourseProposalAction } from "@/features/courses/actions/course.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  Search,
  Upload,
  Plus,
  Trash2,
  Users,
  UserCheck,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
} from "lucide-react";
import Link from "next/link";

interface CourseStudentItem {
  nim: string;
  name: string;
  classGroup: string | null;
  assistantName: string;
  assistantId: string;
}

interface AssistantOption {
  id: string;
  name: string;
  username: string;
}

interface CourseStudentManagerProps {
  courseId: string;
  students: CourseStudentItem[];
  currentUserId: string;
  isAdmin: boolean;
  proposalStatus?: string | null;
  proposalNotes?: string | null;
  assistantsList?: AssistantOption[];
  studentInputEnd?: Date | string | null;
}

function formatIndoDateTime(val?: Date | string | null) {
  if (!val) return "-";
  const date = new Date(val);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getRemainingDaysText(targetDate?: Date | string | null): string {
  if (!targetDate) return "";
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diffMs = target - now;

  if (diffMs <= 0) {
    return "Telah ditutup";
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 24) {
    if (diffHours <= 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `${diffMins} menit lagi`;
    }
    return `${diffHours} jam lagi`;
  }

  return `${diffDays} hari lagi`;
}

export function CourseStudentManager({
  courseId,
  students,
  currentUserId,
  isAdmin,
  proposalStatus,
  proposalNotes,
  assistantsList = [],
  studentInputEnd,
}: CourseStudentManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State Tambah Manual
  const [nim, setNim] = useState("");
  const [name, setName] = useState("");
  const [classGroup, setClassGroup] = useState("");
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>(
    assistantsList[0]?.id || currentUserId
  );
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Proposal Submission State
  const [submitLoading, setSubmitLoading] = useState(false);
  const [proposalMsg, setProposalMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.nim.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.classGroup && s.classGroup.toLowerCase().includes(q))
    );
  });

  async function handleAddManual(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);

    try {
      const res = await createStudentInCourseAction(courseId, {
        nim,
        name,
        classGroup: classGroup || undefined,
        assistantId: isAdmin ? selectedAssistantId : undefined,
      });

      if (res.success) {
        setIsAddOpen(false);
        setNim("");
        setName("");
        setClassGroup("");
        router.refresh();
      } else {
        setAddError(res.message);
      }
    } catch {
      setAddError("Terjadi kendala jaringan.");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleSubmitProposal() {
    if (students.length === 0) {
      alert("Harap tambahkan minimal 1 mahasiswa praktikan sebelum mengajukan ke Koordinator Lab.");
      return;
    }

    if (!confirm("Ajukan mata kuliah dan seluruh daftar praktikan binaan Anda kepada Koordinator Lab (Admin) untuk di-ACC?")) {
      return;
    }

    setSubmitLoading(true);
    setProposalMsg(null);

    try {
      const res = await submitCourseProposalAction(courseId);
      if (res.success) {
        setProposalMsg({ text: res.message });
        router.refresh();
      } else {
        setProposalMsg({ text: res.message, error: true });
      }
    } catch {
      setProposalMsg({ text: "Terjadi kesalahan jaringan saat mengajukan.", error: true });
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleRemove(nimToRemove: string, studentName: string) {
    if (
      !confirm(
        `Apakah Anda yakin ingin mengeluarkan praktikan ${nimToRemove} - ${studentName} dari mata kuliah ini?`
      )
    ) {
      return;
    }

    try {
      const res = await removeStudentFromCourseAction(courseId, nimToRemove);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.message);
      }
    } catch {
      alert("Terjadi kendala jaringan.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Proposal Notification Feedback */}
      {proposalMsg && (
        <div
          className={`neo-box p-4 text-xs font-black flex items-center justify-between ${
            proposalMsg.error ? "bg-[#FF5252] text-white" : "bg-emerald-400 text-black"
          }`}
        >
          <span>{proposalMsg.text}</span>
          <button
            onClick={() => setProposalMsg(null)}
            className="text-xs font-mono uppercase underline ml-4 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Banner Estimasi Ditutup saat Periode Input Praktikan Dibuka */}
      {studentInputEnd && new Date(studentInputEnd) > new Date() && (
        <div className="neo-box p-4 border-3 border-black flex items-center justify-between flex-wrap gap-3 bg-[#FFF9C4]">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-neutral-800 shrink-0" />
            <div>
              <span className="text-xs font-black uppercase text-black block">
                Periode Input Data Praktikan Sedang Dibuka
              </span>
              <span className="text-xs font-medium text-neutral-700">
                Batas akhir input data praktikan s.d. {formatIndoDateTime(studentInputEnd)}
              </span>
            </div>
          </div>

          <span className="neo-box-sm bg-amber-300 text-black px-3 py-1 text-xs font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            ⏳ Ditutup dalam {getRemainingDaysText(studentInputEnd)}
          </span>
        </div>
      )}

      {/* Asprak Proposal Status Banner */}
      {!isAdmin && (
        <div className="neo-box bg-white p-5 border-3 border-black">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                  Status Pengajuan Mata Kuliah:
                </span>
                {proposalStatus === "APPROVED" && (
                  <span className="neo-box-sm text-[10px] px-2 py-0.5 bg-emerald-400 text-black font-black flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    DISETUJUI (ACC)
                  </span>
                )}
                {proposalStatus === "PENDING_APPROVAL" && (
                  <span className="neo-box-sm text-[10px] px-2 py-0.5 bg-amber-400 text-black font-black flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    MENUNGGU ACC ADMIN
                  </span>
                )}
                {proposalStatus === "REJECTED" && (
                  <span className="neo-box-sm text-[10px] px-2 py-0.5 bg-[#FF5252] text-white font-black flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    PERLU REVISI / DITOLAK
                  </span>
                )}
                {(!proposalStatus || proposalStatus === "DRAFT") && (
                  <span className="neo-box-sm text-[10px] px-2 py-0.5 bg-[#FFEB3B] text-black font-black flex items-center gap-1">
                    DRAFT
                  </span>
                )}
              </div>

              <p className="text-xs font-bold text-neutral-700">
                {proposalStatus === "APPROVED" &&
                  "Pengajuan Anda telah disetujui oleh Koordinator Lab. Fitur penilaian asistensi praktikum telah aktif."}
                {proposalStatus === "PENDING_APPROVAL" &&
                  "Pengajuan mata kuliah & mahasiswa binaan Anda sedang diverifikasi oleh Koordinator Lab. Penilaian asistensi akan dibuka setelah disetujui."}
                {proposalStatus === "REJECTED" && (
                  <>
                    Pengajuan ditolak/dikembalikan. Catatan Admin:{" "}
                    <span className="font-mono text-red-600 font-black">
                      &quot;{proposalNotes || "Perbaiki data praktikan binaan"}&quot;
                    </span>
                  </>
                )}
                {(!proposalStatus || proposalStatus === "DRAFT") &&
                  "Pastikan seluruh mahasiswa praktikan binaan Anda telah ditambahkan di bawah ini sebelum mengajukan ke Koordinator Lab."}
              </p>
            </div>

            {/* Action Buttons depending on status */}
            <div className="flex items-center gap-2 shrink-0">
              {(!proposalStatus || proposalStatus === "DRAFT" || proposalStatus === "REJECTED") && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmitProposal}
                  disabled={submitLoading || students.length === 0}
                  className="bg-[#00E5FF] hover:bg-cyan-400 text-black font-black"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {submitLoading
                    ? "Mengajukan..."
                    : proposalStatus === "REJECTED"
                    ? "Ajukan Ulang ke Admin"
                    : "Ajukan ke Admin (ACC)"}
                </Button>
              )}

              {proposalStatus === "APPROVED" && (
                <Link
                  href={`/${courseId}/modul`}
                  className="neo-btn px-3 py-1.5 bg-black text-[#FFEB3B] text-xs font-black flex items-center gap-1.5 hover:bg-neutral-800"
                >
                  <Award className="w-3.5 h-3.5 text-[#FFEB3B]" />
                  Buka Penilaian Asistensi
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className="neo-box bg-white p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            className="neo-input w-full pl-9 pr-4 py-2 text-xs font-medium text-black placeholder:text-neutral-500"
            placeholder="Cari berdasarkan NIM, Nama, atau Kelas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => setIsImportOpen(true)}>
            <Upload className="w-3.5 h-3.5 mr-1" />
            Import Excel
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Tambah Praktikan
          </Button>
        </div>
      </div>

      {/* Tabel Praktikan */}
      <div className="neo-box bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-3 border-black bg-[#FFF9F0] text-xs font-black uppercase">
                <th className="p-3 border-r-3 border-black w-12 text-center">No</th>
                <th className="p-3 border-r-3 border-black w-36">NIM</th>
                <th className="p-3 border-r-3 border-black">Nama Praktikan</th>
                <th className="p-3 border-r-3 border-black w-36">Kelas / Shift</th>
                {isAdmin && <th className="p-3 border-r-3 border-black w-44">Asisten Bimbingan</th>}
                <th className="p-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-neutral-200 text-xs font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-neutral-500 font-bold">
                    {search
                      ? "Tidak ada praktikan yang cocok dengan kata kunci pencarian."
                      : "Belum ada praktikan binaan yang terdaftar di mata kuliah ini. Silakan import file Excel atau tambah manual."}
                  </td>
                </tr>
              ) : (
                filtered.map((s, idx) => {
                  const canDelete = isAdmin || s.assistantId === currentUserId;

                  return (
                    <tr key={s.nim} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-3 border-r-3 border-black font-mono font-bold text-center">
                        {idx + 1}
                      </td>
                      <td className="p-3 border-r-3 border-black font-mono font-black text-black">
                        {s.nim}
                      </td>
                      <td className="p-3 border-r-3 border-black font-bold text-black">
                        {s.name}
                      </td>
                      <td className="p-3 border-r-3 border-black text-neutral-600 font-mono">
                        {s.classGroup || "-"}
                      </td>
                      {isAdmin && (
                        <td className="p-3 border-r-3 border-black font-bold text-neutral-800">
                          <span className="inline-block bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded text-[11px]">
                            {s.assistantName}
                          </span>
                        </td>
                      )}
                      <td className="p-3 text-center">
                        {canDelete && (
                          <button
                            type="button"
                            className="neo-btn p-1.5 bg-[#FF5252] text-white hover:bg-red-600 cursor-pointer"
                            onClick={() => handleRemove(s.nim, s.name)}
                            title="Keluarkan praktikan dari mata kuliah ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal Import Excel */}
      <CourseImportModal
        courseId={courseId}
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => router.refresh()}
      />

      {/* Modal Tambah Manual */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Tambah Praktikan Manual" maxWidth="sm">
        <form onSubmit={handleAddManual} className="space-y-4">
          {addError && (
            <div className="neo-box-sm bg-[#FF5252] text-white p-2.5 text-xs font-black">
              ⚠️ {addError}
            </div>
          )}

          <Input
            id="manual-nim"
            label="NIM Praktikan (Hanya Angka)"
            placeholder="cth: 220101001"
            required
            inputMode="numeric"
            pattern="[0-9]*"
            value={nim}
            onChange={(e) => {
              const numericOnly = e.target.value.replace(/\D/g, "");
              setNim(numericOnly);
            }}
          />

          <Input
            id="manual-name"
            label="Nama Lengkap"
            placeholder="cth: Budi Santoso"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            id="manual-class"
            label="Kelas / Shift (Opsional)"
            placeholder="cth: Kelas A / Shift Senin 08:00"
            value={classGroup}
            onChange={(e) => setClassGroup(e.target.value)}
          />

          {isAdmin && assistantsList.length > 0 && (
            <div className="space-y-1">
              <label htmlFor="manual-assistant" className="block text-xs font-black uppercase text-black">
                Tentukan Asisten Pembina:
              </label>
              <select
                id="manual-assistant"
                value={selectedAssistantId}
                onChange={(e) => setSelectedAssistantId(e.target.value)}
                className="neo-input w-full py-2 px-3 text-xs font-bold text-black bg-white cursor-pointer"
              >
                {assistantsList.map((ast) => (
                  <option key={ast.id} value={ast.id}>
                    {ast.name} (@{ast.username})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-neutral-500 font-medium">
                Admin dapat menentukan asprak yang membimbing praktikan ini secara langsung.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t-2 border-neutral-200">
            <Button type="button" variant="secondary" onClick={() => setIsAddOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={addLoading}>
              {addLoading ? "Menyimpan..." : "Simpan Praktikan"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
