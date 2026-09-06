"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { createPeriodAction } from "../actions/period.actions";

interface PeriodCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function PeriodCreateForm({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: PeriodCreateFormProps) {
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const now = new Date();
    const defaultEnd = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const res = await createPeriodAction({
      name,
      isActive,
      courseInputStart: now.toISOString(),
      courseInputEnd: defaultEnd.toISOString(),
      studentInputStart: now.toISOString(),
      studentInputEnd: defaultEnd.toISOString(),
    });

    setLoading(false);

    if (res.success) {
      setName("");
      onSuccess("Periode akademik baru berhasil dibuat.");
      onClose();
    } else {
      onError(res.message || "Gagal membuat periode.");
    }
  }

  return (
    <div className="neo-box bg-white p-5 border-3 border-black space-y-4">
      <h3 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
        <Plus className="w-5 h-5" />
        Buat Periode Akademik Baru
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="period-name"
          label="Nama Periode Semester"
          placeholder="Contoh: Semester Genap 2026/2027"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex items-center gap-2 pt-1">
          <input
            id="is-active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 border-2 border-black accent-black cursor-pointer"
          />
          <label htmlFor="is-active" className="text-xs font-bold text-black cursor-pointer">
            Langsung aktifkan sebagai semester berjalan sekarang
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t-2 border-black">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Periode Baru"}
          </Button>
        </div>
      </form>
    </div>
  );
}
