"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { deleteAssistantByAdminAction } from "../actions/admin.actions";
import { AssistantItem } from "./assistant-manager";

interface AssistantDeleteModalProps {
  assistant: AssistantItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function AssistantDeleteModal({
  assistant,
  onClose,
  onSuccess,
}: AssistantDeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!assistant) return null;

  async function handleDelete() {
    if (!assistant) return;
    setLoading(true);
    setError(null);

    try {
      const res = await deleteAssistantByAdminAction(assistant.id);
      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        setError(res.message);
      }
    } catch {
      setError("Terjadi kendala jaringan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={!!assistant}
      onClose={onClose}
      title="Konfirmasi Hapus Akun Asisten"
      maxWidth="sm"
    >
      <div className="space-y-4">
        {error && (
          <div className="neo-box-sm bg-[#FF5252] text-white p-2.5 text-xs font-black">
            ⚠️ {error}
          </div>
        )}

        <div className="flex items-start gap-3 p-3 bg-red-50 border-2 border-red-300 text-red-900 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div>
            <p className="font-bold">
              Apakah Anda yakin ingin menghapus akun asisten berikut?
            </p>
            <div className="mt-2 font-mono font-black text-black bg-white p-2 border border-red-200">
              <div>Nama: {assistant.name}</div>
              <div>Username: {assistant.username}</div>
              <div>MK Diampu: {assistant._count.assignedCourses}</div>
              <div>Praktikan: {assistant._count.studentEnrollments}</div>
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
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={loading}
            onClick={handleDelete}
          >
            {loading ? "Menghapus..." : "Ya, Hapus Akun"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
