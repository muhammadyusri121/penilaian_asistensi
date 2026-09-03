"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createCourseByAdminAction } from "../actions/course.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, BookOpen, Layers, CheckCircle2 } from "lucide-react";

interface ModuleInputRow {
  title: string;
  description: string;
  isFinalReport: boolean;
}

export function CourseBuilderForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [modules, setModules] = useState<ModuleInputRow[]>([
    { title: "Modul 1: Pengantar & Teori Dasar", description: "", isFinalReport: false },
    { title: "Modul 2: Implementasi Dasar", description: "", isFinalReport: false },
    { title: "Modul 3: Lanjutan & Studi Kasus", description: "", isFinalReport: false },
    { title: "Laporan Akhir Praktikum", description: "", isFinalReport: true },
  ]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  function removeModuleRow(index: number) {
    if (modules.length <= 1) {
      alert("Mata kuliah harus memiliki minimal 1 modul!");
      return;
    }
    setModules(modules.filter((_, idx) => idx !== index));
  }

  function updateModule(index: number, field: keyof ModuleInputRow, value: unknown) {
    const updated = [...modules];
    updated[index] = { ...updated[index], [field]: value };
    setModules(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validasi judul modul tidak boleh kosong
    for (let i = 0; i < modules.length; i++) {
      if (!modules[i].title.trim()) {
        setErrorMsg(`Judul modul pada baris ke-${i + 1} tidak boleh kosong!`);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await createCourseByAdminAction({
        code: code.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        modules: modules.map((m) => ({
          title: m.title.trim(),
          description: m.description.trim() || undefined,
          isFinalReport: m.isFinalReport,
        })),
      });

      if (res.success) {
        setSuccessMsg(res.message || "Mata kuliah dan modul berhasil dibuat!");
        setTimeout(() => {
          router.push("/admin/matakuliah");
          router.refresh();
        }, 1200);
      } else {
        setErrorMsg(res.message || "Gagal membuat mata kuliah.");
        setLoading(false);
      }
    } catch {
      setErrorMsg("Terjadi kendala koneksi ke server.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="neo-box bg-white p-6">
        <div className="flex items-center gap-3 border-b-3 border-black pb-4 mb-6">
          <div className="neo-box-sm bg-[#FFEB3B] p-2.5">
            <BookOpen className="w-7 h-7 text-black" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">
              Buat Mata Kuliah Praktikum
            </h1>
            <p className="text-xs font-bold text-neutral-600 uppercase">
              Master Kurikulum & Penyusunan Modul Laboratorium
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="neo-box-sm bg-[#FF5252] text-white p-3 mb-5 text-xs font-black uppercase">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="neo-box-sm bg-[#4CAF50] text-black p-3 mb-5 text-xs font-black uppercase flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informasi Mata Kuliah */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                id="course-code"
                label="Kode MK"
                placeholder="cth: IF201"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                id="course-title"
                label="Nama Mata Kuliah Praktikum"
                placeholder="cth: Algoritma & Pemrograman"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="course-desc" className="block text-xs font-black uppercase tracking-wider mb-1.5 text-black">
              Deskripsi Praktikum (Opsional)
            </label>
            <textarea
              id="course-desc"
              rows={2}
              className="neo-input w-full p-3 text-sm font-medium text-black placeholder:text-neutral-500"
              placeholder="Jelaskan silabus singkat atau capaian praktikum ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Penyusunan Modul Dinamis */}
          <div className="border-t-3 border-black pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-black" />
                <h3 className="text-sm font-black uppercase tracking-wider">
                  Daftar Modul Praktikum ({modules.length} Modul)
                </h3>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addModuleRow}>
                <Plus className="w-4 h-4 mr-1" />
                Tambah Baris Modul
              </Button>
            </div>

            <div className="space-y-3">
              {modules.map((mod, idx) => (
                <div
                  key={idx}
                  className="neo-box-sm bg-[#FFF9F0] p-3 flex flex-col md:flex-row items-start md:items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-none border-2 border-black bg-white flex items-center justify-center font-mono font-black text-xs shrink-0">
                    {idx + 1}
                  </div>

                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      className="neo-input w-full px-3 py-1.5 text-sm font-bold text-black"
                      placeholder="Judul modul..."
                      required
                      value={mod.title}
                      onChange={(e) => updateModule(idx, "title", e.target.value)}
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs font-black cursor-pointer select-none shrink-0">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded-none border-2 border-black accent-black"
                      checked={mod.isFinalReport}
                      onChange={(e) => updateModule(idx, "isFinalReport", e.target.checked)}
                    />
                    <span>Laporan Akhir</span>
                  </label>

                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    className="p-1.5 shrink-0"
                    onClick={() => removeModuleRow(idx)}
                    title="Hapus modul ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t-3 border-black">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan & Buka Mata Kuliah"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
