"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { updateWindowAutoCloseAction } from "../actions/period.actions";
import { toLocalDatetimeInputString } from "../lib/period-date.utils";

export interface AutoCloseModalData {
  periodId: string;
  windowType: "course" | "student";
  title: string;
  currentDate: string;
}

interface PeriodAutoCloseModalProps {
  data: AutoCloseModalData | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function PeriodAutoCloseModal({
  data,
  onClose,
  onSuccess,
  onError,
}: PeriodAutoCloseModalProps) {
  const [newAutoCloseDate, setNewAutoCloseDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) {
      setNewAutoCloseDate(data.currentDate);
    }
  }, [data]);

  if (!data) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;

    setLoading(true);
    try {
      const res = await updateWindowAutoCloseAction(
        data.periodId,
        data.windowType,
        new Date(newAutoCloseDate).toISOString()
      );

      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        onError(res.message);
      }
    } catch {
      onError("Terjadi kesalahan jaringan saat menyimpan waktu tutup.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={!!data}
      onClose={onClose}
      title={data.title}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-neutral-600 font-medium">
          Jendela saat ini sedang dibuka. Tentukan kapan jendela ini akan ditutup secara otomatis oleh sistem.
        </p>

        <div>
          <label className="text-xs font-black uppercase text-black block mb-1">
            Waktu Tutup Otomatis Baru:
          </label>
          <input
            type="datetime-local"
            required
            value={newAutoCloseDate}
            onChange={(e) => setNewAutoCloseDate(e.target.value)}
            className="w-full text-xs p-2 border-2 border-black font-mono font-bold bg-white"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[10px] font-bold text-neutral-500 w-full block">
            Tambah Waktu Cepat:
          </span>
          {[1, 3, 7, 14].map((extraDays) => (
            <button
              key={extraDays}
              type="button"
              onClick={() => {
                const next = new Date(Date.now() + extraDays * 24 * 60 * 60 * 1000);
                setNewAutoCloseDate(toLocalDatetimeInputString(next));
              }}
              className="px-2 py-0.5 text-[10px] font-bold border-2 border-black bg-neutral-100 hover:bg-neutral-200 cursor-pointer"
            >
              +{extraDays} Hari
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t-2 border-neutral-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Waktu Tutup"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
