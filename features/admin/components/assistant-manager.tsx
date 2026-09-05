"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createAssistantByAdminAction,
  updateAssistantByAdminAction,
  deleteAssistantByAdminAction,
  approveUserAction,
  rejectUserAction,
} from "../actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  Shield,
  Key,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

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

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createStatus, setCreateStatus] = useState<"ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED" | "REJECTED">("ACTIVE");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal
  const [editingAssistant, setEditingAssistant] = useState<AssistantItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED" | "REJECTED">("ACTIVE");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Modal
  const [deletingAssistant, setDeletingAssistant] = useState<AssistantItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  // Handle Create
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await createAssistantByAdminAction({
        name: createName,
        username: createUsername,
        email: createEmail || undefined,
        password: createPassword,
        status: createStatus,
      });

      if (res.success) {
        setIsCreateOpen(false);
        setCreateName("");
        setCreateUsername("");
        setCreateEmail("");
        setCreatePassword("");
        setCreateStatus("ACTIVE");
        setFeedback({ success: true, message: res.message });
        router.refresh();
      } else {
        setCreateError(res.message);
      }
    } catch {
      setCreateError("Terjadi kendala jaringan.");
    } finally {
      setCreateLoading(false);
    }
  }

  // Open Edit Modal
  function openEditModal(ast: AssistantItem) {
    setEditingAssistant(ast);
    setEditName(ast.name);
    setEditUsername(ast.username);
    setEditEmail(ast.email || "");
    setEditPassword("");
    setEditStatus(ast.status);
    setEditError(null);
  }

  // Handle Edit
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAssistant) return;

    setEditLoading(true);
    setEditError(null);

    try {
      const res = await updateAssistantByAdminAction(editingAssistant.id, {
        name: editName,
        username: editUsername,
        email: editEmail || undefined,
        password: editPassword || undefined,
        status: editStatus,
      });

      if (res.success) {
        setEditingAssistant(null);
        setFeedback({ success: true, message: res.message });
        router.refresh();
      } else {
        setEditError(res.message);
      }
    } catch {
      setEditError("Terjadi kendala jaringan.");
    } finally {
      setEditLoading(false);
    }
  }

  // Handle Delete
  async function handleDeleteConfirm() {
    if (!deletingAssistant) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const res = await deleteAssistantByAdminAction(deletingAssistant.id);
      if (res.success) {
        setDeletingAssistant(null);
        setFeedback({ success: true, message: res.message });
        router.refresh();
      } else {
        setDeleteError(res.message);
      }
    } catch {
      setDeleteError("Terjadi kendala jaringan.");
    } finally {
      setDeleteLoading(false);
    }
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
          onClick={() => {
            setCreateError(null);
            setIsCreateOpen(true);
          }}
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
                          onClick={() => openEditModal(ast)}
                          title="Edit Data / Reset Password"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="text-[11px] px-2 py-1"
                          onClick={() => {
                            setDeleteError(null);
                            setDeletingAssistant(ast);
                          }}
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
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Tambah Akun Asisten Praktikum Baru"
          maxWidth="md"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            {createError && (
              <div className="neo-box-sm bg-[#FF5252] text-white p-2.5 text-xs font-black">
                ⚠️ {createError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="create-name"
                label="Nama Lengkap Asisten"
                placeholder="Contoh: Muhammad Yusri"
                required
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />

              <Input
                id="create-username"
                label="Username / Kode Asprak"
                placeholder="Contoh: asprak_yusri / NIP"
                required
                value={createUsername}
                onChange={(e) => setCreateUsername(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="create-email"
                type="email"
                label="Email (Opsional)"
                placeholder="asisten@kampus.ac.id"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
              />

              <Input
                id="create-password"
                type="password"
                label="Password Awal"
                placeholder="Minimal 6 karakter"
                required
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase text-black block mb-1">
                Status Akun Awal
              </label>
              <select
                value={createStatus}
                onChange={(e) => setCreateStatus(e.target.value as any)}
                className="w-full text-xs font-bold p-2 border-2 border-black bg-white focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE (Langsung aktif dan dapat login)</option>
                <option value="PENDING_APPROVAL">PENDING_APPROVAL (Menunggu persetujuan)</option>
                <option value="SUSPENDED">SUSPENDED (Nonaktif sementara)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t-2 border-neutral-200">
              <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={createLoading}>
                {createLoading ? "Menyimpan..." : "Buat Akun Asisten"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Edit Akun Asprak */}
      {editingAssistant && (
        <Modal
          isOpen={!!editingAssistant}
          onClose={() => setEditingAssistant(null)}
          title={`Edit Akun: ${editingAssistant.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {editError && (
              <div className="neo-box-sm bg-[#FF5252] text-white p-2.5 text-xs font-black">
                ⚠️ {editError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="edit-name"
                label="Nama Lengkap Asisten"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />

              <Input
                id="edit-username"
                label="Username / Kode Asprak"
                required
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="edit-email"
                type="email"
                label="Email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />

              <div>
                <label className="text-xs font-black uppercase text-black block mb-1">
                  Status Akun
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full text-xs font-bold p-2 border-2 border-black bg-white focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE (Aktif)</option>
                  <option value="PENDING_APPROVAL">PENDING_APPROVAL (Menunggu ACC)</option>
                  <option value="SUSPENDED">SUSPENDED (Nonaktif / Dibekukan)</option>
                  <option value="REJECTED">REJECTED (Ditolak)</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-neutral-100 border-2 border-dashed border-neutral-300 rounded space-y-1.5">
              <label className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                Reset Password (Opsional)
              </label>
              <input
                type="password"
                placeholder="Kosongkan jika tidak ingin mengubah password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full text-xs p-2 border-2 border-black bg-white font-mono"
              />
              <span className="text-[10px] text-neutral-500 font-medium block">
                Jika diisi, minimal 6 karakter. Password asisten akan langsung diperbarui.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t-2 border-neutral-200">
              <Button type="button" variant="secondary" onClick={() => setEditingAssistant(null)}>
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={editLoading}>
                {editLoading ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Hapus Akun */}
      {deletingAssistant && (
        <Modal
          isOpen={!!deletingAssistant}
          onClose={() => setDeletingAssistant(null)}
          title="Konfirmasi Hapus Akun Asisten"
          maxWidth="sm"
        >
          <div className="space-y-4">
            {deleteError && (
              <div className="neo-box-sm bg-[#FF5252] text-white p-2.5 text-xs font-black">
                ⚠️ {deleteError}
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-red-50 border-2 border-red-300 text-red-900 text-xs">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold">
                  Apakah Anda yakin ingin menghapus akun asisten berikut?
                </p>
                <div className="mt-2 font-mono font-black text-black bg-white p-2 border border-red-200">
                  <div>Nama: {deletingAssistant.name}</div>
                  <div>Username: {deletingAssistant.username}</div>
                  <div>MK Diampu: {deletingAssistant._count.assignedCourses}</div>
                  <div>Praktikan: {deletingAssistant._count.studentEnrollments}</div>
                </div>
                <p className="mt-2 text-[11px] text-neutral-600">
                  Tindakan ini tidak dapat dibatalkan. Jika akun sudah memiliki riwayat penilaian praktikan, akun tidak dapat dihapus (tetapi dapat dinonaktifkan / SUSPENDED).
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t-2 border-neutral-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeletingAssistant(null)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={deleteLoading}
                onClick={handleDeleteConfirm}
              >
                {deleteLoading ? "Menghapus..." : "Ya, Hapus Akun"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
