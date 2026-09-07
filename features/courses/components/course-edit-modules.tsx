"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaptchaDeleteModal } from "@/components/ui/captcha-delete-modal";
import { deleteModuleAction } from "@/features/modules/actions/module.actions";

export interface ModuleEditRow {
  id?: string;
  title: string;
  description: string;
  isFinalReport: boolean;
}

interface CourseEditModulesProps {
  modules: ModuleEditRow[];
  setModules: React.Dispatch<React.SetStateAction<ModuleEditRow[]>>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function CourseEditModules({
  modules,
  setModules,
  onSuccess,
  onError,
  disabled = false,
}: CourseEditModulesProps) {
  const router = useRouter();
  const [modToDelete, setModToDelete] = useState<ModuleEditRow | null>(null);

  function addModuleRow() {
    setModules([
      ...modules,
      {
        title: `Modul ${modules.length + 1}: `,
        description: "",
        isFinalReport: false,
      },
    ]);
  }

  function updateModule(index: number, field: keyof ModuleEditRow, value: unknown) {
    const updated = [...modules];
    updated[index] = { ...updated[index], [field]: value };
    setModules(updated);
  }

  function handleRequestRemoveModule(index: number) {
    if (modules.length <= 1) {
      onError("Mata kuliah harus memiliki minimal 1 modul!");
      return;
    }

    const targetMod = modules[index];
    if (targetMod.id) {
      setModToDelete(targetMod);
    } else {
      setModules(modules.filter((_, idx) => idx !== index));
    }
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#2196F3]" />
              3. Susunan Modul Praktikum ({modules.length} Modul)
            </span>
            <p className="text-[11px] font-medium text-neutral-600">
              Ubah judul modul, tambahkan modul baru, atau tandai modul sebagai Laporan Akhir.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addModuleRow}
            disabled={disabled}
          >
            <Plus className="w-4 h-4" />
            Tambah Modul
          </Button>
        </div>

        <div className="space-y-3">
          {modules.map((mod, idx) => (
            <div
              key={mod.id || idx}
              className="neo-box-sm bg-white p-3 border-2 border-black flex flex-col md:flex-row items-start md:items-center gap-3"
            >
              <div className="neo-box-sm bg-black text-[#FFEB3B] text-xs font-mono font-black px-2.5 py-1 shrink-0">
                #{idx + 1}
              </div>

              <div className="flex-1 w-full space-y-1">
                <input
                  type="text"
                  placeholder={`Judul Modul ${idx + 1}`}
                  value={mod.title}
                  onChange={(e) => updateModule(idx, "title", e.target.value)}
                  className="neo-input w-full px-3 py-1.5 text-xs font-bold"
                  disabled={disabled}
                  required
                />
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none bg-neutral-100 px-2.5 py-1.5 neo-box-sm border border-black">
                  <input
                    type="checkbox"
                    checked={mod.isFinalReport}
                    onChange={(e) => updateModule(idx, "isFinalReport", e.target.checked)}
                    disabled={disabled}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                  <span className="text-[11px] font-black uppercase">Laporan Akhir</span>
                </label>

                <button
                  type="button"
                  onClick={() => handleRequestRemoveModule(idx)}
                  disabled={disabled || modules.length <= 1}
                  title="Hapus modul ini"
                  className="p-1.5 neo-box-sm bg-red-100 text-red-700 hover:bg-red-200 border border-black disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL KONFIRMASI HAPUS MODUL DENGAN CAPTCHA */}
      {modToDelete?.id && (
        <CaptchaDeleteModal
          isOpen={!!modToDelete}
          onClose={() => setModToDelete(null)}
          title="Konfirmasi Hapus Modul"
          action="DELETE_MODULE"
          targetId={modToDelete.id}
          confirmButtonText="Ya, Hapus Modul Ini"
          targetDescription={
            <p>
              Apakah Anda yakin ingin menghapus{" "}
              <span className="font-black underline">{modToDelete.title}</span>?
            </p>
          }
          warningNotice={
            <>
              Seluruh riwayat tugas pengumpulan mahasiswa, file yang telah diunggah, dan lembar nilai
              asistensi untuk modul ini akan <span className="font-black underline">DIHAPUS PERMANEN</span>.
            </>
          }
          onConfirm={(token, input) =>
            deleteModuleAction(modToDelete.id!, token, input)
          }
          onSuccess={(message) => {
            setModules((prev) => prev.filter((m) => m.id !== modToDelete.id));
            setModToDelete(null);
            onSuccess(message);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
