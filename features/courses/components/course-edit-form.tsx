"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCourseByAdminAction } from "../actions/course.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, BookOpen, Layers, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  CourseWeightsEditor,
  CourseWeights,
  DEFAULT_COURSE_WEIGHTS,
} from "./course-weights-editor";

interface ModuleEditRow {
  id?: string;
  title: string;
  description: string;
  isFinalReport: boolean;
}

interface CourseEditFormProps {
  course: {
    id: string;
    code: string;
    title: string;
    description: string | null;
    scheduleDay?: string | null;
    scheduleTime?: string | null;
    weightAttendance?: number | null;
    weightAssignment?: number | null;
    weightPretest?: number | null;
    weightUts?: number | null;
    weightUas?: number | null;
    modules: Array<{
      id: string;
      title: string;
      description: string | null;
      isFinalReport: boolean;
      orderIndex: number;
    }>;
  };
}

export function CourseEditForm({ course }: CourseEditFormProps) {
  const router = useRouter();
  const [code, setCode] = useState(course.code);
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description || "");
  const [scheduleDay, setScheduleDay] = useState(course.scheduleDay || "");
  const [scheduleTime, setScheduleTime] = useState(course.scheduleTime || "");
  const [weights, setWeights] = useState<CourseWeights>({
    weightAttendance: course.weightAttendance ?? DEFAULT_COURSE_WEIGHTS.weightAttendance,
    weightAssignment: course.weightAssignment ?? DEFAULT_COURSE_WEIGHTS.weightAssignment,
    weightPretest: course.weightPretest ?? DEFAULT_COURSE_WEIGHTS.weightPretest,
    weightUts: course.weightUts ?? DEFAULT_COURSE_WEIGHTS.weightUts,
    weightUas: course.weightUas ?? DEFAULT_COURSE_WEIGHTS.weightUas,
  });
  const [modules, setModules] = useState<ModuleEditRow[]>(
    course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description || "",
      isFinalReport: m.isFinalReport,
    }))
  );

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

  function updateModule(index: number, field: keyof ModuleEditRow, value: unknown) {
    const updated = [...modules];
    updated[index] = { ...updated[index], [field]: value };
    setModules(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validasi judul modul
    for (let i = 0; i < modules.length; i++) {
      if (!modules[i].title.trim()) {
        setErrorMsg(`Judul modul pada baris ke-${i + 1} tidak boleh kosong!`);
        setLoading(false);
        return;
      }
    }

    // Validasi total bobot penilaian tepat 100%
    const totalWeights =
      weights.weightAttendance +
      weights.weightAssignment +
      weights.weightPretest +
      weights.weightUts +
      weights.weightUas;

    if (Math.abs(totalWeights - 100) > 0.01) {
      setErrorMsg(`Total bobot persentase penilaian harus tepat 100%! Saat ini: ${totalWeights}%.`);
      setLoading(false);
      return;
    }

    try {
      const res = await updateCourseByAdminAction(course.id, {
        code: code.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        scheduleDay: scheduleDay.trim() || undefined,
        scheduleTime: scheduleTime.trim() || undefined,
        weightAttendance: weights.weightAttendance,
        weightAssignment: weights.weightAssignment,
        weightPretest: weights.weightPretest,
        weightUts: weights.weightUts,
        weightUas: weights.weightUas,
        modules: modules.map((m) => ({
          id: m.id,
          title: m.title.trim(),
          description: m.description.trim() || undefined,
          isFinalReport: m.isFinalReport,
        })),
      });

      if (res.success) {
        setSuccessMsg(res.message || "Mata kuliah dan modul berhasil diperbarui!");
        setTimeout(() => {
          router.push("/admin/matakuliah");
          router.refresh();
        }, 1200);
      } else {
        setErrorMsg(res.message || "Gagal memperbarui mata kuliah.");
        setLoading(false);
      }
    } catch {
      setErrorMsg("Terjadi kendala koneksi ke server.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/matakuliah"
          className="neo-btn px-3 py-1.5 bg-white text-black text-xs font-black flex items-center gap-1 hover:bg-neutral-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Mata Kuliah
        </Link>
      </div>

      <div className="neo-box bg-white p-6">
        <div className="flex items-center gap-3 border-b-3 border-black pb-4 mb-6">
          <div className="neo-box-sm bg-[#FFEB3B] p-2.5">
            <BookOpen className="w-7 h-7 text-black" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">
              Edit Mata Kuliah & Modul Praktikum
            </h1>
            <p className="text-xs font-bold text-neutral-600">
              Perbarui nama mata kuliah, kode, dan susunan judul modul praktikum.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="neo-box-sm bg-[#FF5252] text-white p-3 mb-6 text-xs font-black uppercase tracking-wide">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="neo-box-sm bg-[#4CAF50] text-white p-3 mb-6 text-xs font-black uppercase tracking-wide flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* IDENTITAS MATA KULIAH */}
          <div className="p-4 neo-box-sm bg-neutral-50 space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-700 flex items-center gap-2">
              <Layers className="w-4 h-4 text-black" />
              1. Identitas Mata Kuliah
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  label="Kode Mata Kuliah *"
                  placeholder="Contoh: IF201"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Nama Mata Kuliah *"
                  placeholder="Contoh: Struktur Data & Algoritma"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Jadwal Hari & Jam Praktikum */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-course-day" className="block text-xs font-black uppercase tracking-wider mb-1 text-black">
                  Hari Pelaksanaan Praktikum
                </label>
                <select
                  id="edit-course-day"
                  className="neo-input w-full p-2 text-xs font-medium text-black bg-white cursor-pointer"
                  value={scheduleDay}
                  onChange={(e) => setScheduleDay(e.target.value)}
                >
                  <option value="">-- Pilih Hari (Opsional) --</option>
                  <option value="Senin">Senin</option>
                  <option value="Selasa">Selasa</option>
                  <option value="Rabu">Rabu</option>
                  <option value="Kamis">Kamis</option>
                  <option value="Jumat">Jumat</option>
                  <option value="Sabtu">Sabtu</option>
                  <option value="Minggu">Minggu</option>
                </select>
              </div>
              <div>
                <Input
                  label="Jam Pelaksanaan Praktikum"
                  placeholder="cth: 08:00 - 10:30 WIB"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-wider text-black block mb-1">
                Deskripsi Praktikum (Opsional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Rangkuman kompetensi praktikum..."
                rows={2}
                className="neo-input w-full p-2.5 text-xs font-medium resize-y"
              />
            </div>
          </div>

          {/* 2. KUSTOMISASI BOBOT PERSENTASE PENILAIAN */}
          <CourseWeightsEditor
            weights={weights}
            onChange={setWeights}
            disabled={loading}
          />

          {/* 3. DAFTAR MODUL PRAKTIKUM */}
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

              <Button type="button" variant="secondary" size="sm" onClick={addModuleRow}>
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
                      required
                    />
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none bg-neutral-100 px-2.5 py-1.5 neo-box-sm border border-black">
                      <input
                        type="checkbox"
                        checked={mod.isFinalReport}
                        onChange={(e) => updateModule(idx, "isFinalReport", e.target.checked)}
                        className="w-4 h-4 accent-black cursor-pointer"
                      />
                      <span className="text-[11px] font-black uppercase">Laporan Akhir</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => removeModuleRow(idx)}
                      disabled={modules.length <= 1}
                      title="Hapus baris modul ini"
                      className="p-1.5 neo-box-sm bg-red-100 text-red-700 hover:bg-red-200 border border-black disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t-2 border-neutral-200">
            <Link href="/admin/matakuliah" className="neo-btn px-4 py-2 bg-neutral-200 text-black text-xs font-black">
              Batal
            </Link>
            <Button type="submit" variant="primary" size="md" disabled={loading}>
              {loading ? "Menyimpan Perubahan..." : "Simpan Perubahan Mata Kuliah"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
