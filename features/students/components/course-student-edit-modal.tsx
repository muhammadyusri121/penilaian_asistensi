"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateStudentInCourseAction } from "../actions/student.actions";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface CourseStudentEditModalProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isAdmin: boolean;
  student: {
    nim: string;
    name: string;
  } | null;
}

export function CourseStudentEditModal({
  courseId,
  isOpen,
  onClose,
  onSuccess,
  isAdmin,
  student,
}: CourseStudentEditModalProps) {
  const [nim, setNim] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setNim(student.nim);
      setName(student.name);
      setError(null);
      setSuccess(null);
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const isNimChanged = student.nim !== nim.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await updateStudentInCourseAction(courseId, {
        oldNim: student!.nim,
        newNim: nim.trim(),
        name: name.trim(),
      });

      if (res.success) {
        setSuccess(res.message);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      } else {
        setError(res.message);
        setLoading(false);
      }
    } catch {
      setError("Terjadi kendala jaringan.");
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Data Praktikan: ${student.nim}`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="neo-box-sm bg-[#FF5252] text-white p-2.5 text-xs font-black flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="neo-box-sm bg-[#4CAF50] text-white p-2.5 text-xs font-black flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {!isAdmin && (
          <div className="neo-box-sm bg-yellow-50 border-2 border-amber-500 p-2.5 text-[11px] font-bold text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-black text-amber-800 uppercase">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Aturan Perubahan Data:
            </div>
            <p>
              • Mengubah <span className="font-black text-black">Nama Lengkap</span> dapat langsung tersimpan tanpa perlu ACC ulang.
            </p>
            <p>
              • Mengubah <span className="font-black text-black">NIM</span> akan membuat status praktikan menjadi <span className="font-black text-amber-700 underline">Menunggu ACC</span> dari Koordinator Lab.
            </p>
          </div>
        )}

        <Input
          id="edit-nim"
          label="NIM Praktikan (Hanya Angka)"
          placeholder="cth: 220101001"
          required
          inputMode="numeric"
          pattern="[0-9]*"
          value={nim}
          onChange={(e) => {
            const numericOnly = e.target.value.replace(/\D/g, "");
            setNim(numericOnly);
          }}
        />

        {isNimChanged && !isAdmin && (
          <p className="text-[10px] font-bold text-red-600 -mt-2">
            ⚠️ Anda mengubah NIM dari {student.nim} menjadi {nim}. Perubahan ini memerlukan persetujuan (ACC) Admin.
          </p>
        )}

        <Input
          id="edit-name"
          label="Nama Lengkap"
          placeholder="cth: Budi Santoso"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-2 border-t-2 border-neutral-200">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
