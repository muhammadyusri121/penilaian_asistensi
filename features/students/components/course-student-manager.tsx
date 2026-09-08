"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CourseImportModal } from "./course-import-modal";
import {
  removeStudentFromCourseAction,
  approveStudentEnrollmentAction,
  rejectStudentEnrollmentAction,
  approveAllStudentsInCourseAction,
} from "../actions/student.actions";
import { submitCourseProposalAction } from "@/features/courses/actions/course-proposal.actions";
import { formatIndoDateTime, getRemainingDaysText } from "@/features/periods/lib/period-date.utils";
import { CourseStudentCreateModal } from "./course-student-create-modal";
import { CourseStudentEditModal } from "./course-student-edit-modal";
import { Button } from "@/components/ui/button";
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
  Edit3,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";

interface CourseStudentItem {
  nim: string;
  name: string;
  classGroup: string | null;
  status: string;
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
  const [editingStudent, setEditingStudent] = useState<{ nim: string; name: string } | null>(null);
  const [approvingNim, setApprovingNim] = useState<string | null>(null);
  const [batchApproving, setBatchApproving] = useState(false);

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

  async function handleApproveStudent(studentNim: string) {
    setApprovingNim(studentNim);
    try {
      const res = await approveStudentEnrollmentAction(courseId, studentNim);
      if (res.success) {
        setProposalMsg({ text: res.message });
        router.refresh();
      } else {
        setProposalMsg({ text: res.message, error: true });
      }
    } catch {
      setProposalMsg({ text: "Terjadi kesalahan jaringan saat meng-ACC.", error: true });
    } finally {
      setApprovingNim(null);
    }
  }

  async function handleRejectStudent(studentNim: string) {
    if (!confirm(`Tolak praktikan dengan NIM ${studentNim}?`)) return;
    setApprovingNim(studentNim);
    try {
      const res = await rejectStudentEnrollmentAction(courseId, studentNim);
      if (res.success) {
        setProposalMsg({ text: res.message });
        router.refresh();
      } else {
        setProposalMsg({ text: res.message, error: true });
      }
    } catch {
      setProposalMsg({ text: "Terjadi kesalahan jaringan saat menolak praktikan.", error: true });
    } finally {
      setApprovingNim(null);
    }
  }

  async function handleBatchApprove() {
    if (!confirm("Setujui (ACC) seluruh praktikan yang berstatus Menunggu ACC di mata kuliah ini?")) return;
    setBatchApproving(true);
    try {
      const res = await approveAllStudentsInCourseAction(courseId);
      if (res.success) {
        setProposalMsg({ text: res.message });
        router.refresh();
      } else {
        setProposalMsg({ text: res.message, error: true });
      }
    } catch {
      setProposalMsg({ text: "Terjadi kendala jaringan.", error: true });
    } finally {
      setBatchApproving(false);
    }
  }

  const pendingCount = students.filter((s) => s.status === "PENDING_APPROVAL").length;

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

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {isAdmin && pendingCount > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleBatchApprove}
              disabled={batchApproving}
              className="bg-[#4CAF50] hover:bg-green-600 text-white font-black text-xs"
              title="ACC seluruh praktikan pending sekaligus"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              {batchApproving ? "Memproses..." : `ACC Semua (${pendingCount})`}
            </Button>
          )}
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
                <th className="p-3 border-r-3 border-black w-32">NIM</th>
                <th className="p-3 border-r-3 border-black">Nama Praktikan</th>
                <th className="p-3 border-r-3 border-black w-36 text-center">Status ACC</th>
                {isAdmin && <th className="p-3 border-r-3 border-black w-40">Asisten Bimbingan</th>}
                <th className="p-3 text-center w-36">Aksi</th>
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
                  const canEdit = isAdmin || s.assistantId === currentUserId;
                  const canDelete = isAdmin || s.assistantId === currentUserId;
                  const isProcessing = approvingNim === s.nim;

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
                      <td className="p-3 border-r-3 border-black text-center">
                        {s.status === "APPROVED" && (
                          <span className="neo-box-sm bg-[#4CAF50] text-white px-2 py-0.5 text-[10px] font-black uppercase inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            DISETUJUI (ACC)
                          </span>
                        )}
                        {s.status === "PENDING_APPROVAL" && (
                          <span className="neo-box-sm bg-[#FFEB3B] text-black px-2 py-0.5 text-[10px] font-black uppercase inline-flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3" />
                            MENUNGGU ACC
                          </span>
                        )}
                        {s.status === "REJECTED" && (
                          <span className="neo-box-sm bg-[#FF5252] text-white px-2 py-0.5 text-[10px] font-black uppercase inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            DITOLAK
                          </span>
                        )}
                        {s.status === "DRAFT" && (
                          <span className="neo-box-sm bg-neutral-200 text-neutral-800 px-2 py-0.5 text-[10px] font-bold uppercase">
                            DRAFT
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="p-3 border-r-3 border-black font-bold text-neutral-800">
                          <span className="inline-block bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded text-[11px]">
                            {s.assistantName}
                          </span>
                        </td>
                      )}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isAdmin && s.status !== "APPROVED" && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleApproveStudent(s.nim)}
                              className="neo-btn px-1.5 py-1 bg-[#4CAF50] text-white hover:bg-green-600 cursor-pointer text-[10px] font-black flex items-center gap-0.5"
                              title="Setujui (ACC) Praktikan Ini"
                            >
                              <Check className="w-3 h-3" />
                              ACC
                            </button>
                          )}

                          {isAdmin && s.status === "PENDING_APPROVAL" && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleRejectStudent(s.nim)}
                              className="neo-btn px-1.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 border-red-300 cursor-pointer text-[10px] font-black flex items-center gap-0.5"
                              title="Tolak Praktikan Ini"
                            >
                              <X className="w-3 h-3" />
                              Tolak
                            </button>
                          )}

                          {canEdit && (
                            <button
                              type="button"
                              className="neo-btn p-1.5 bg-yellow-300 text-black hover:bg-yellow-400 cursor-pointer"
                              onClick={() => setEditingStudent({ nim: s.nim, name: s.name })}
                              title="Edit NIM / Nama Praktikan"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

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
                        </div>
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
      <CourseStudentCreateModal
        courseId={courseId}
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => router.refresh()}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        assistantsList={assistantsList}
      />
      {/* Modal Edit Praktikan */}
      <CourseStudentEditModal
        courseId={courseId}
        isOpen={editingStudent !== null}
        onClose={() => setEditingStudent(null)}
        onSuccess={() => router.refresh()}
        isAdmin={isAdmin}
        student={editingStudent}
      />
    </div>
  );
}
