"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit3, Loader2 } from "lucide-react";
import { updatePeriodNameAction } from "../actions/period.actions";
import { PeriodItem } from "./period-manager";

interface PeriodEditNameModalProps {
  period: PeriodItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function PeriodEditNameModal({
  period,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: PeriodEditNameModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (period) {
      setName(period.name);
      setErrorMsg(null);
    }
  }, [period]);

  if (!period) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!period) return;

    const trimmed = name.trim();
    if (trimmed.length < 3) {
      setErrorMsg("Nama periode minimal 3 karakter.");
      return;
    }

    if (trimmed === period.name) {
      onClose();
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await updatePeriodNameAction(period.id, trimmed);
      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        setErrorMsg(res.message || "Gagal mengubah nama periode.");
      }
    } catch {
      setErrorMsg("Terjadi kendala saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Nama Periode Semester"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 border-b-2 border-dashed border-neutral-300 pb-3">
          <div className="neo-box-sm bg-[#FFEB3B] p-2">
            <Edit3 className="w-5 h-5 text-black" />
          </div>
          <div>
            <span className="text-xs font-black uppercase text-neutral-500">
              Ubah Nama Periode
            </span>
            <p className="text-xs font-bold text-neutral-700">
              Nama periode saat ini: <span className="text-black font-black underline">{period.name}</span>
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="neo-box-sm bg-[#FF5252] text-white p-3 text-xs font-black uppercase tracking-wide">
            ⚠️ {errorMsg}
          </div>
        )}

        <div>
          <label
            htmlFor="period-new-name"
            className="text-xs font-black uppercase tracking-wider text-black block mb-1"
          >
            Nama Periode Baru *
          </label>
          <Input
            id="period-new-name"
            type="text"
            required
            disabled={loading}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Semester Gasal 2026/2027"
            className="bg-white"
            autoFocus
          />
          <p className="text-[11px] font-medium text-neutral-500 mt-1">
            Nama ini akan tampil di seluruh header dashboard, katalog mata kuliah, dan rekap penilaian.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-neutral-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !name.trim()}
            className="text-xs bg-[#FFEB3B] hover:bg-yellow-400 text-black flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
