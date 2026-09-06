"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAssistantByAdminAction } from "../actions/admin.actions";

interface AssistantCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function AssistantCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: AssistantCreateModalProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED" | "REJECTED">("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await createAssistantByAdminAction({
        name,
        username,
        email: email || undefined,
        password,
        status,
      });

      if (res.success) {
        setName("");
        setUsername("");
        setEmail("");
        setPassword("");
        setStatus("ACTIVE");
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
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Akun Asisten Praktikum Baru"
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
            id="create-name"
            label="Nama Lengkap Asisten"
            placeholder="Contoh: Muhammad Yusri"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            id="create-username"
            label="Username / Kode Asprak"
            placeholder="Contoh: asprak_yusri / NIP"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="create-email"
            type="email"
            label="Email (Opsional)"
            placeholder="asisten@kampus.ac.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            id="create-password"
            type="password"
            label="Password Awal"
            placeholder="Minimal 6 karakter"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-black uppercase text-black block mb-1">
            Status Akun Awal
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full text-xs font-bold p-2 border-2 border-black bg-white focus:outline-none"
          >
            <option value="ACTIVE">ACTIVE (Langsung aktif dan dapat login)</option>
            <option value="PENDING_APPROVAL">PENDING_APPROVAL (Menunggu persetujuan)</option>
            <option value="SUSPENDED">SUSPENDED (Nonaktif sementara)</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t-2 border-neutral-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Menyimpan..." : "Buat Akun Asisten"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
