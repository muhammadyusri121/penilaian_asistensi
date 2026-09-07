"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCourseByAdminAction, deleteCourseByAdminAction } from "../actions/course.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CaptchaDeleteModal } from "@/components/ui/captcha-delete-modal";
import { Trash2, Layers, CheckCircle2, ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import {
  CourseWeightsEditor,
  CourseWeights,
  DEFAULT_COURSE_WEIGHTS,
} from "./course-weights-editor";
import { CourseEditModules, ModuleEditRow } from "./course-edit-modules";

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

  // Delete Course Modal State
  const [showDeleteCourseModal, setShowDeleteCourseModal] = useState(false);

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
          <CourseEditModules
            modules={modules}
            setModules={setModules}
            disabled={loading}
            onSuccess={(msg) => setSuccessMsg(msg)}
            onError={(msg) => setErrorMsg(msg)}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t-2 border-neutral-200">
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={() => setShowDeleteCourseModal(true)}
              className="bg-[#FF5252] text-white hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Hapus Mata Kuliah Ini
            </Button>

            <div className="flex items-center gap-3 ml-auto">
              <Link href="/admin/matakuliah" className="neo-btn px-4 py-2 bg-neutral-200 text-black text-xs font-black">
                Batal
              </Link>
              <Button type="submit" variant="primary" size="md" disabled={loading}>
                {loading ? "Menyimpan Perubahan..." : "Simpan Perubahan Mata Kuliah"}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* MODAL KONFIRMASI HAPUS MATA KULIAH DENGAN CAPTCHA */}
      {showDeleteCourseModal && (
        <CaptchaDeleteModal
          isOpen={showDeleteCourseModal}
          onClose={() => setShowDeleteCourseModal(false)}
          title="Konfirmasi Hapus Mata Kuliah"
          action="DELETE_COURSE"
          targetId={course.id}
          confirmButtonText="Ya, Hapus Mata Kuliah"
          targetDescription={
            <p>
              Apakah Anda yakin ingin menghapus mata kuliah{" "}
              <span className="font-black underline">
                {course.code} - {course.title}
              </span>
              ?
            </p>
          }
          warningNotice={
            <>
              Seluruh modul praktikum ({modules.length} modul), tugas praktikan, file pengumpulan,
              presensi, soal pretest, dan nilai asistensi dalam mata kuliah ini akan{" "}
              <span className="font-black underline">DIHAPUS PERMANEN</span> dan tidak dapat dipulihkan.
            </>
          }
          onConfirm={(token, input) =>
            deleteCourseByAdminAction(course.id, token, input)
          }
          onSuccess={() => {
            setShowDeleteCourseModal(false);
            router.push("/admin/matakuliah");
          }}
        />
      )}
    </div>
  );
}
