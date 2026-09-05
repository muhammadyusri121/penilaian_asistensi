"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveCourseProposalAction,
  rejectCourseProposalAction,
} from "@/features/courses/actions/course.actions";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CheckCircle2, XCircle, Clock, BookOpen, User, Users, AlertCircle } from "lucide-react";
import Link from "next/link";

interface CourseProposalItem {
  id: string;
  courseId: string;
  assistantId: string;
  status: string;
  submittedAt: Date | null;
  approvedAt: Date | null;
  notes: string | null;
  assignedAt: Date;
  studentCount: number;
  course: {
    id: string;
    code: string;
    title: string;
  };
  assistant: {
    id: string;
    name: string;
    username: string;
    email: string | null;
  };
}

interface CourseProposalManagerProps {
  proposals: CourseProposalItem[];
}

export function CourseProposalManager({ proposals }: CourseProposalManagerProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal Tolak / Revisi
  const [rejectingItem, setRejectingItem] = useState<CourseProposalItem | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  async function handleApprove(courseId: string, assistantId: string) {
    if (!confirm("Setujui (ACC) pengajuan mata kuliah dan praktikan untuk asisten ini?")) return;

    setLoadingId(`${courseId}_${assistantId}`);
    setActionError(null);
    setSuccessMsg(null);

    try {
      const res = await approveCourseProposalAction(courseId, assistantId);
      if (res.success) {
        setSuccessMsg(res.message);
        router.refresh();
      } else {
        setActionError(res.message);
      }
    } catch {
      setActionError("Terjadi kendala jaringan.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingItem) return;

    setLoadingId(`${rejectingItem.courseId}_${rejectingItem.assistantId}`);
    setActionError(null);
    setSuccessMsg(null);

    try {
      const res = await rejectCourseProposalAction(
        rejectingItem.courseId,
        rejectingItem.assistantId,
        rejectNotes.trim() || undefined
      );
      if (res.success) {
        setSuccessMsg(res.message);
        setRejectingItem(null);
        setRejectNotes("");
        router.refresh();
      } else {
        setActionError(res.message);
      }
    } catch {
      setActionError("Terjadi kendala jaringan.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="neo-box-sm bg-[#FF5252] text-white p-3 text-xs font-black uppercase tracking-wide">
          ⚠️ {actionError}
        </div>
      )}

      {successMsg && (
        <div className="neo-box-sm bg-[#4CAF50] text-white p-3 text-xs font-black uppercase tracking-wide flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      <div className="neo-box bg-white overflow-hidden">
        <div className="p-4 border-b-3 border-black bg-[#FFEB3B] flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Daftar Pengajuan Mata Kuliah & Mahasiswa Binaan ({proposals.length} Pengajuan)
          </span>
        </div>

        {proposals.length === 0 ? (
          <div className="p-10 text-center text-neutral-500">
            <BookOpen className="w-10 h-10 mx-auto mb-2 text-neutral-400" />
            <p className="font-bold uppercase text-sm">Belum ada pengajuan mata kuliah dari asisten</p>
            <p className="text-xs text-neutral-600 mt-1">
              Saat asisten praktikum memilih mata kuliah dan mengajukan mahasiswa binaan, pengajuan akan muncul di sini untuk di-ACC.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-black text-white font-mono uppercase">
                <tr>
                  <th className="p-3 border-r border-neutral-700 w-10 text-center">No</th>
                  <th className="p-3 border-r border-neutral-700 w-48">Mata Kuliah</th>
                  <th className="p-3 border-r border-neutral-700 w-48">Asisten Pengampu</th>
                  <th className="p-3 border-r border-neutral-700 w-28 text-center">Praktikan</th>
                  <th className="p-3 border-r border-neutral-700 w-36 text-center">Status</th>
                  <th className="p-3 border-r border-neutral-700 w-40">Waktu Pengajuan</th>
                  <th className="p-3 text-center w-52">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-neutral-200">
                {proposals.map((item, idx) => {
                  const isProcessing = loadingId === `${item.courseId}_${item.assistantId}`;
                  return (
                    <tr key={item.id} className="hover:bg-yellow-50/50 transition-colors">
                      <td className="p-3 border-r border-neutral-200 text-center font-bold font-mono">
                        {idx + 1}
                      </td>
                      <td className="p-3 border-r border-neutral-200">
                        <span className="neo-box-sm bg-black text-white text-[10px] font-mono px-1.5 py-0.5 mr-1 font-bold">
                          {item.course.code}
                        </span>
                        <span className="font-bold text-black">{item.course.title}</span>
                      </td>
                      <td className="p-3 border-r border-neutral-200">
                        <div className="font-black text-black">{item.assistant.name}</div>
                        <div className="text-[11px] font-mono text-neutral-500">@{item.assistant.username}</div>
                      </td>
                      <td className="p-3 border-r border-neutral-200 text-center">
                        <span className="neo-box-sm bg-blue-100 text-blue-900 px-2 py-0.5 font-mono font-bold text-xs">
                          {item.studentCount} Mahasiswa
                        </span>
                      </td>
                      <td className="p-3 border-r border-neutral-200 text-center">
                        {item.status === "APPROVED" && (
                          <span className="neo-box-sm bg-[#4CAF50] text-white px-2 py-1 font-black text-[10px] uppercase">
                            DISETUJUI (ACC)
                          </span>
                        )}
                        {item.status === "PENDING_APPROVAL" && (
                          <span className="neo-box-sm bg-[#FFEB3B] text-black px-2 py-1 font-black text-[10px] uppercase animate-pulse">
                            MENUNGGU ACC
                          </span>
                        )}
                        {item.status === "DRAFT" && (
                          <span className="neo-box-sm bg-neutral-200 text-neutral-800 px-2 py-1 font-bold text-[10px] uppercase">
                            DRAFT
                          </span>
                        )}
                        {item.status === "REJECTED" && (
                          <span className="neo-box-sm bg-[#FF5252] text-white px-2 py-1 font-black text-[10px] uppercase">
                            DITOLAK / REVISI
                          </span>
                        )}
                      </td>
                      <td className="p-3 border-r border-neutral-200 text-[11px] font-mono text-neutral-600">
                        {item.submittedAt ? new Date(item.submittedAt).toLocaleString("id-ID") : "Belum diajukan"}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {item.status !== "APPROVED" && (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => handleApprove(item.courseId, item.assistantId)}
                              className="text-xs bg-[#4CAF50] hover:bg-green-600 text-white"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              ACC
                            </Button>
                          )}

                          {item.status !== "REJECTED" && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => {
                                setRejectingItem(item);
                                setRejectNotes("");
                              }}
                              className="text-xs bg-red-100 hover:bg-red-200 text-red-700 border-red-300"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Tolak
                            </Button>
                          )}

                          <Link
                            href={`/${item.courseId}/praktikan`}
                            className="neo-btn text-[11px] px-2 py-1 bg-white hover:bg-neutral-100 text-black font-bold flex items-center gap-1"
                          >
                            <Users className="w-3 h-3" />
                            Praktikan
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tolak / Revisi */}
      <Modal
        isOpen={!!rejectingItem}
        onClose={() => setRejectingItem(null)}
        title="Tolak / Minta Revisi Pengajuan MK"
      >
        {rejectingItem && (
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            <p className="text-xs font-bold text-neutral-700">
              Anda akan mengembalikan pengajuan mata kuliah <span className="font-black text-black">{rejectingItem.course.title}</span> dari asisten <span className="font-black text-black">{rejectingItem.assistant.name}</span> untuk diperbaiki.
            </p>

            <div>
              <label className="text-xs font-black uppercase text-black block mb-1">
                Catatan Revisi untuk Asisten (Opsional)
              </label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Contoh: Harap sesuaikan pembagian shift mahasiswa kelas B..."
                rows={3}
                className="neo-input w-full p-2 text-xs font-medium resize-y"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setRejectingItem(null)}>
                Batal
              </Button>
              <Button type="submit" variant="primary" className="bg-[#FF5252] text-white">
                Tolak & Minta Revisi
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
