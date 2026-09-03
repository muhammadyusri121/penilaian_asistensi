"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CourseImportModal } from "./course-import-modal";
import { createStudentInCourseAction, removeStudentFromCourseAction } from "../actions/student.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Search, Upload, Plus, Trash2, Users, UserCheck } from "lucide-react";

interface CourseStudentItem {
  nim: string;
  name: string;
  classGroup: string | null;
  assistantName: string;
  assistantId: string;
}

interface CourseStudentManagerProps {
  courseId: string;
  students: CourseStudentItem[];
  currentUserId: string;
  isAdmin: boolean;
}

export function CourseStudentManager({
  courseId,
  students,
  currentUserId,
  isAdmin,
}: CourseStudentManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State Tambah Manual
  const [nim, setNim] = useState("");
  const [name, setName] = useState("");
  const [classGroup, setClassGroup] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.nim.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.classGroup && s.classGroup.toLowerCase().includes(q))
    );
  });

  async function handleAddManual(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);

    try {
      const res = await createStudentInCourseAction(courseId, {
        nim,
        name,
        classGroup: classGroup || undefined,
      });

      if (res.success) {
        setIsAddOpen(false);
        setNim("");
        setName("");
        setClassGroup("");
        router.refresh();
      } else {
        setAddError(res.message);
      }
    } catch {
      setAddError("Terjadi kendala jaringan.");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRemove(nimToRemove: string, studentName: string) {
    if (
      !confirm(
        `Apakah Anda yakin ingin mengeluarkan praktikan ${nimToRemove} - ${studentName} dari mata kuliah ini?`
      )
    ) {
      return;
    }

    try {
      const res = await removeStudentFromCourseAction(courseId, nimToRemove);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.message);
      }
    } catch {
      alert("Terjadi kendala jaringan.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="neo-box bg-white p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            className="neo-input w-full pl-9 pr-4 py-2 text-xs font-medium text-black placeholder:text-neutral-500"
            placeholder="Cari berdasarkan NIM, Nama, atau Kelas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => setIsImportOpen(true)}>
            <Upload className="w-3.5 h-3.5 mr-1" />
            Import Excel
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Tambah Praktikan
          </Button>
        </div>
      </div>

      {/* Tabel Praktikan */}
      <div className="neo-box bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-3 border-black bg-[#FFF9F0] text-xs font-black uppercase">
                <th className="p-3 border-r-3 border-black w-12 text-center">No</th>
                <th className="p-3 border-r-3 border-black w-36">NIM</th>
                <th className="p-3 border-r-3 border-black">Nama Praktikan</th>
                <th className="p-3 border-r-3 border-black w-36">Kelas / Shift</th>
                {isAdmin && <th className="p-3 border-r-3 border-black w-40">Asisten Bimbingan</th>}
                <th className="p-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-neutral-200 text-xs font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-neutral-500 font-bold">
                    {search
                      ? "Tidak ada praktikan yang cocok dengan kata kunci pencarian."
                      : "Belum ada praktikan binaan yang terdaftar di mata kuliah ini. Silakan import file Excel atau tambah manual."}
                  </td>
                </tr>
              ) : (
                filtered.map((s, idx) => {
                  const canDelete = isAdmin || s.assistantId === currentUserId;

                  return (
                    <tr key={s.nim} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-3 border-r-3 border-black font-mono font-bold text-center">
                        {idx + 1}
                      </td>
                      <td className="p-3 border-r-3 border-black font-mono font-black text-black">
                        {s.nim}
                      </td>
                      <td className="p-3 border-r-3 border-black font-bold text-black">
                        {s.name}
                      </td>
                      <td className="p-3 border-r-3 border-black text-neutral-600 font-mono">
                        {s.classGroup || "-"}
                      </td>
                      {isAdmin && (
                        <td className="p-3 border-r-3 border-black font-bold text-neutral-800">
                          {s.assistantName}
                        </td>
                      )}
                      <td className="p-3 text-center">
                        {canDelete && (
                          <button
                            type="button"
                            className="neo-btn p-1.5 bg-[#FF5252] text-white hover:bg-red-600 cursor-pointer"
                            onClick={() => handleRemove(s.nim, s.name)}
                            title="Keluarkan praktikan dari mata kuliah ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Import Excel */}
      <CourseImportModal
        courseId={courseId}
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => router.refresh()}
      />

      {/* Modal Tambah Manual */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Tambah Praktikan Manual" maxWidth="sm">
        <form onSubmit={handleAddManual} className="space-y-4">
          {addError && (
            <div className="neo-box-sm bg-[#FF5252] text-white p-2.5 text-xs font-black">
              ⚠️ {addError}
            </div>
          )}

          <Input
            id="manual-nim"
            label="NIM Praktikan"
            placeholder="cth: 220101001"
            required
            value={nim}
            onChange={(e) => setNim(e.target.value)}
          />

          <Input
            id="manual-name"
            label="Nama Lengkap"
            placeholder="cth: Budi Santoso"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            id="manual-class"
            label="Kelas / Shift (Opsional)"
            placeholder="cth: Kelas A / Shift Senin 08:00"
            value={classGroup}
            onChange={(e) => setClassGroup(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t-2 border-neutral-200">
            <Button type="button" variant="secondary" onClick={() => setIsAddOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={addLoading}>
              {addLoading ? "Menyimpan..." : "Simpan Praktikan"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
