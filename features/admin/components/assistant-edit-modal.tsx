"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key } from "lucide-react";
import { updateAssistantByAdminAction } from "../actions/admin.actions";
import { AssistantItem } from "./assistant-manager";

interface AssistantEditModalProps {
  assistant: AssistantItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function AssistantEditModal({
  assistant,
  onClose,
  onSuccess,
}: AssistantEditModalProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED" | "REJECTED">("ACTIVE");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assistant) {
      setName(assistant.name);
      setUsername(assistant.username);
      setEmail(assistant.email || "");
      setStatus(assistant.status);
      setPassword("");
      setError(null);
    }
  }, [assistant]);

  if (!assistant) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assistant) return;

    setLoading(true);
    setError(null);

    try {
      const res = await updateAssistantByAdminAction(assistant.id, {
        name,
        username,
        email: email || undefined,
        status,
        password: password.trim() ? password.trim() : undefined,
      });

      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        setError(res.message);
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={!!assistant}
      onClose={onClose}
      title={`Edit Akun: ${assistant.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="neo-box-sm bg-[#FF5252] text-white p-2.5 text-xs font-black">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="edit-name"
            label="Nama Lengkap Asisten"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            id="edit-username"
            label="Username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="edit-email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div>
            <label className="text-xs font-black uppercase text-black block mb-1">
              Status Akun
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-xs p-2 border-2 border-black bg-white font-mono"
          />
          <span className="text-[10px] text-neutral-500 font-medium block">
            Jika diisi, minimal 6 karakter. Password asisten akan langsung diperbarui.
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t-2 border-neutral-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
