"use client";

import React, { useState, useEffect } from "react";
import { Copy, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { duplicateCourseByAdminAction } from "../actions/course.actions";
import { CourseCatalogItem } from "./admin-courses-manager";

interface CourseDuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseCatalogItem | null;
  onSuccess: (message: string) => void;
}

export function CourseDuplicateModal({
  isOpen,
  onClose,
  course,
  onSuccess,
}: CourseDuplicateModalProps) {
  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (course) {
      setNewCode(`${course.code}-COPY`);
      setNewTitle(`${course.title} (Copy)`);
      setErrorMsg(null);
    }
  }, [course]);

  if (!isOpen || !course) return null;

  async function handleDuplicate(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;

    if (!newCode.trim() || !newTitle.trim()) {
      setErrorMsg("Kode dan Judul mata kuliah wajib diisi.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await duplicateCourseByAdminAction(
        course.id,
        newCode.trim(),
        newTitle.trim()
      );

      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        setErrorMsg(res.message || "Gagal menduplikasi mata kuliah.");
      }
    } catch {
      setErrorMsg("Terjadi kendala saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white border-3 border-black shadow-[8px_8px_0px_#000000] p-6 space-y-5">
        {/* Header Modal */}
        <div className="flex items-center gap-3 border-b-3 border-black pb-4">
          <div className="neo-box-sm bg-[#00E5FF] p-2.5">
            <Copy className="w-6 h-6 text-black" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-black">
              Duplikat Mata Kuliah
            </h2>
            <p className="text-xs font-bold text-neutral-600">
              Salin kurikulum modul dan bobot dari: <span className="font-black text-black">{course.code}</span>
            </p>
          </div>
        </div>

        {/* Info Ringkasan Salinan & Pengecualian */}
        <div className="neo-box-sm bg-[#FFF9F0] p-3.5 text-xs font-bold space-y-2 border-l-4 border-l-[#2196F3]">
          <div className="flex items-center gap-1.5 text-black font-black uppercase">
            <AlertCircle className="w-4 h-4 text-[#2196F3]" />
            <span>Ketentuan Duplikasi:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-neutral-700 pl-1">
            <li>
              <span className="text-green-700 font-black">Disalin:</span> {course.modules.length} modul praktikum, deskripsi, dan persentase bobot penilaian.
            </li>
            <li>
              <span className="text-red-600 font-black">Dikecualikan:</span> Asisten pengampu, jadwal kuliah (hari/jam), data praktikan, tugas/file, dan nilai.
            </li>
          </ul>
        </div>

        {errorMsg && (
          <div className="neo-box-sm bg-[#FF5252] text-white p-3 text-xs font-black uppercase tracking-wide">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Form Duplikasi */}
        <form onSubmit={handleDuplicate} className="space-y-4">
          <div>
            <label
              htmlFor="duplicate-code"
              className="text-xs font-black uppercase tracking-wider text-black block mb-1"
            >
              Kode Mata Kuliah Baru
            </label>
            <Input
              id="duplicate-code"
              type="text"
              required
              disabled={loading}
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Contoh: IF201-COPY atau IF201-B"
              className="bg-white"
            />
          </div>

          <div>
            <label
              htmlFor="duplicate-title"
              className="text-xs font-black uppercase tracking-wider text-black block mb-1"
            >
              Judul Mata Kuliah Baru
            </label>
            <Input
              id="duplicate-title"
              type="text"
              required
              disabled={loading}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Contoh: Struktur Data (Copy) atau Struktur Data - Kelas B"
              className="bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-neutral-200">
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
              disabled={loading}
              className="text-xs bg-[#FFEB3B] hover:bg-yellow-400 text-black flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menduplikasi...
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Duplikat Sekarang
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
