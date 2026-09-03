"use client";

import React, { useState } from "react";
import { ImportStudentModal } from "./import-student-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { createStudentAction, deleteStudentAction } from "../actions/student.actions";
import { Upload, Plus, Search, Trash2, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface StudentManagerProps {
  initialStudents: Array<{
    nim: string;
    name: string;
    classGroup?: string | null;
    assistant?: { name: string; username: string } | null;
    submissions: Array<{
      id: string;
      moduleId: string;
      status: string;
      grade?: { totalScore: number } | null;
    }>;
  }>;
  courseId?: string;
}

export function StudentManager({ initialStudents, courseId }: StudentManagerProps) {
  const router = useRouter();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Single Add form
  const [nim, setNim] = useState("");
  const [name, setName] = useState("");
  const [classGroup, setClassGroup] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredStudents = initialStudents.filter((s) => {
    const q = search.toLowerCase();
    return s.nim.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (s.classGroup && s.classGroup.toLowerCase().includes(q));
  });

  async function handleAddSingle(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await createStudentAction({ nim, name, classGroup: classGroup || undefined }, courseId);
      if (res.success) {
        setSuccessMsg(res.message);
        setNim("");
        setName("");
        setClassGroup("");
        setTimeout(() => {
          setIsAddOpen(false);
          router.refresh();
        }, 1000);
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg("Gagal menyimpan data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(studentNim: string, studentName: string) {
    if (!confirm(`Yakin ingin menghapus praktikan ${studentName} (${studentNim}) beserta riwayat nilainya?`)) {
      return;
    }

    const res = await deleteStudentAction(studentNim, courseId);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 neo-box p-4 bg-white">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Cari NIM, Nama, atau Kelas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="neo-input w-full pl-9 pr-3 py-2 text-xs font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4" />
            Tambah Manual
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="flex-1 sm:flex-initial"
          >
            <Upload className="w-4 h-4" />
            Import Excel / CSV
          </Button>
        </div>
      </div>

      {/* Student List Table */}
      <div className="neo-box bg-white overflow-hidden">
        <div className="p-4 border-b-3 border-black bg-neutral-100 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2196F3]" />
            Daftar Praktikan Terdaftar ({filteredStudents.length} Mahasiswa)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-black text-white font-mono uppercase">
              <tr>
                <th className="p-3 border-r border-neutral-700 w-12 text-center">No</th>
                <th className="p-3 border-r border-neutral-700 w-36">NIM</th>
                <th className="p-3 border-r border-neutral-700">Nama Lengkap</th>
                <th className="p-3 border-r border-neutral-700 w-32">Kelas / Shift</th>
                <th className="p-3 border-r border-neutral-700 w-36">Asisten</th>
                <th className="p-3 w-20 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-neutral-200 font-mono-numbers">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500 font-sans">
                    <p className="font-bold uppercase text-sm">Belum ada data praktikan</p>
                    <p className="text-xs mt-1">Klik &quot;Import Excel / CSV&quot; untuk memasukkan data mahasiswa dari spreadsheet.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => (
                  <tr key={s.nim} className="hover:bg-yellow-50/60 transition-colors">
                    <td className="p-3 border-r border-neutral-200 text-center font-bold">{idx + 1}</td>
                    <td className="p-3 border-r border-neutral-200 font-black text-black">{s.nim}</td>
                    <td className="p-3 border-r border-neutral-200 font-sans font-bold text-black">{s.name}</td>
                    <td className="p-3 border-r border-neutral-200 font-sans">
                      {s.classGroup ? (
                        <span className="neo-box-sm px-2 py-0.5 bg-neutral-100 text-neutral-800 text-[10px] font-bold">
                          {s.classGroup}
                        </span>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </td>
                    <td className="p-3 border-r border-neutral-200 font-sans text-xs text-neutral-600">
                      {s.assistant?.name || "-"}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDelete(s.nim, s.name)}
                        className="p-1.5 neo-box-sm bg-[#FF5252] text-white hover:bg-red-600 cursor-pointer"
                        title="Hapus Praktikan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Import Excel */}
      <ImportStudentModal
        isOpen={isImportOpen}
        courseId={courseId}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => {
          setIsImportOpen(false);
          router.refresh();
        }}
      />

      {/* Modal Tambah Manual */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Tambah Praktikan Baru" maxWidth="md">
        <form onSubmit={handleAddSingle} className="space-y-4">
          {errorMsg && (
            <div className="neo-box-sm bg-[#FF5252] text-white p-3 text-xs font-black flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="neo-box-sm bg-[#4CAF50] text-black p-3 text-xs font-black flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <Input
            label="NIM Mahasiswa"
            required
            placeholder="Contoh: 210411100012"
            value={nim}
            onChange={(e) => setNim(e.target.value)}
          />

          <Input
            label="Nama Lengkap"
            required
            placeholder="Contoh: Budi Pratama"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Kelas / Shift / Kelompok"
            placeholder="Contoh: Kelas B / Shift 1"
            value={classGroup}
            onChange={(e) => setClassGroup(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsAddOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
