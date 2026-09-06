"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveUserAction,
  rejectUserAction,
} from "../actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  Shield,
  UserCheck,
} from "lucide-react";
import { AssistantCreateModal } from "./assistant-create-modal";
import { AssistantEditModal } from "./assistant-edit-modal";
import { AssistantDeleteModal } from "./assistant-delete-modal";

export interface AssistantItem {
  id: string;
  username: string;
  name: string;
  email: string | null;
  status: "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED" | "REJECTED";
  createdAt: Date | string;
  approvedAt?: Date | string | null;
  _count: {
    assignedCourses: number;
    studentEnrollments: number;
  };
}

interface AssistantManagerProps {
  assistants: AssistantItem[];
}

export function AssistantManager({ assistants }: AssistantManagerProps) {
  const router = useRouter();

  // Filter & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<AssistantItem | null>(null);
  const [deletingAssistant, setDeletingAssistant] = useState<AssistantItem | null>(null);

  // Global Feedback Banner
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  // Filtered list
  const filtered = assistants.filter((ast) => {
    const q = search.toLowerCase();
    const matchSearch =
      ast.name.toLowerCase().includes(q) ||
      ast.username.toLowerCase().includes(q) ||
      (ast.email && ast.email.toLowerCase().includes(q));

    const matchStatus = statusFilter === "ALL" || ast.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function handleSuccess(message: string) {
    setFeedback({ success: true, message });
    router.refresh();
  }

  // Quick Approve
  async function handleQuickApprove(id: string) {
    setActionId(id);
    setFeedback(null);
    try {
      const res = await approveUserAction(id);
      setFeedback({ success: res.success, message: res.message });
      if (res.success) router.refresh();
    } catch {
      setFeedback({ success: false, message: "Terjadi kendala jaringan." });
    } finally {
      setActionId(null);
    }
  }

  // Quick Reject
  async function handleQuickReject(id: string) {
    if (!confirm("Tolak permohonan akun asisten ini?")) return;
    setActionId(id);
    setFeedback(null);
    try {
      const res = await rejectUserAction(id);
      setFeedback({ success: res.success, message: res.message });
      if (res.success) router.refresh();
    } catch {
      setFeedback({ success: false, message: "Terjadi kendala jaringan." });
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`neo-box p-4 text-xs font-black flex items-center justify-between ${
            feedback.success ? "bg-[#4CAF50] text-black" : "bg-[#FF5252] text-white"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline ml-4 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari asisten (nama, username, email)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs font-bold pl-9 pr-3 py-2 border-2 border-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-black px-3 py-2 border-2 border-black bg-white focus:outline-none"
          >
            <option value="ALL">Semua Status ({assistants.length})</option>
            <option value="ACTIVE">Aktif ({assistants.filter((a) => a.status === "ACTIVE").length})</option>
            <option value="PENDING_APPROVAL">
              Menunggu ACC ({assistants.filter((a) => a.status === "PENDING_APPROVAL").length})
            </option>
            <option value="SUSPENDED">
              Nonaktif ({assistants.filter((a) => a.status === "SUSPENDED").length})
            </option>
            <option value="REJECTED">
              Ditolak ({assistants.filter((a) => a.status === "REJECTED").length})
            </option>
          </select>
        </div>

        {/* Tombol Tambah Asprak */}
        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          className="shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Akun Asprak
        </Button>
      </div>

      {/* Tabel Akun Asisten */}
      <div className="neo-box bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-3 border-black bg-[#FFF9F0] text-xs font-black uppercase">
                <th className="p-3 border-r-3 border-black w-12 text-center">No</th>
                <th className="p-3 border-r-3 border-black">Nama Lengkap</th>
                <th className="p-3 border-r-3 border-black">Username (Kode Asprak)</th>
                <th className="p-3 border-r-3 border-black">Email</th>
                <th className="p-3 border-r-3 border-black text-center">MK Diampu</th>
                <th className="p-3 border-r-3 border-black text-center">Praktikan</th>
                <th className="p-3 border-r-3 border-black text-center">Status</th>
                <th className="p-3 text-center w-52">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-neutral-200 text-xs font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-500 font-bold">
                    Tidak ada akun asisten praktikum yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((ast, idx) => (
                  <tr key={ast.id} className="hover:bg-neutral-50">
                    <td className="p-3 border-r-3 border-black font-mono font-bold text-center">
                      {idx + 1}
                    </td>
                    <td className="p-3 border-r-3 border-black font-black text-black">
                      {ast.name}
                    </td>
                    <td className="p-3 border-r-3 border-black font-mono font-black text-[#2196F3]">
                      {ast.username}
                    </td>
                    <td className="p-3 border-r-3 border-black text-neutral-600 font-mono text-[11px]">
                      {ast.email || "-"}
                    </td>
                    <td className="p-3 border-r-3 border-black font-mono font-black text-center">
                      {ast._count.assignedCourses}
                    </td>
                    <td className="p-3 border-r-3 border-black font-mono font-black text-center">
                      {ast._count.studentEnrollments}
                    </td>
                    <td className="p-3 border-r-3 border-black text-center">
                      {ast.status === "ACTIVE" && (
                        <span className="neo-box-sm bg-[#4CAF50] text-black px-2 py-0.5 text-[10px] font-black uppercase">
                          AKTIF
                        </span>
                      )}
                      {ast.status === "PENDING_APPROVAL" && (
                        <span className="neo-box-sm bg-[#FFEB3B] text-black px-2 py-0.5 text-[10px] font-black uppercase">
                          MENUNGGU ACC
                        </span>
                      )}
                      {ast.status === "SUSPENDED" && (
                        <span className="neo-box-sm bg-[#FF9800] text-black px-2 py-0.5 text-[10px] font-black uppercase">
                          NONAKTIF
                        </span>
                      )}
                      {ast.status === "REJECTED" && (
                        <span className="neo-box-sm bg-[#FF5252] text-white px-2 py-0.5 text-[10px] font-black uppercase">
                          DITOLAK
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {ast.status === "PENDING_APPROVAL" && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-[11px] px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-black font-black"
                            disabled={actionId === ast.id}
                            onClick={() => handleQuickApprove(ast.id)}
                            title="Setujui / ACC Akun"
                          >
                            ACC
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-[11px] px-2 py-1"
                          onClick={() => setEditingAssistant(ast)}
                          title="Edit Data / Reset Password"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="text-[11px] px-2 py-1"
                          onClick={() => setDeletingAssistant(ast)}
                          title="Hapus Akun Asprak"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Akun Asprak */}
      <AssistantCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleSuccess}
      />

      {/* Modal Edit Akun Asprak */}
      <AssistantEditModal
        assistant={editingAssistant}
        onClose={() => setEditingAssistant(null)}
        onSuccess={handleSuccess}
      />

      {/* Modal Hapus Akun */}
      <AssistantDeleteModal
        assistant={deletingAssistant}
        onClose={() => setDeletingAssistant(null)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
