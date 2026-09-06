"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateExamScoreAction } from "../actions/final-grades.actions";

interface ExamStudentData {
  nim: string;
  name: string;
  uts: number;
  uas: number;
}

interface ExamScoreModalProps {
  student: ExamStudentData | null;
  courseId?: string;
  weights: {
    uts: number;
    uas: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function ExamScoreModal({
  student,
  courseId,
  weights,
  onClose,
  onSuccess,
}: ExamScoreModalProps) {
  const [utsInput, setUtsInput] = useState<number>(0);
  const [uasInput, setUasInput] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setUtsInput(student.uts);
      setUasInput(student.uas);
      setError(null);
    }
  }, [student]);

  if (!student) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!student) return;

    setLoading(true);
    setError(null);

    try {
      const res = await updateExamScoreAction({
        studentNim: student.nim,
        utsScore: utsInput,
        uasScore: uasInput,
        courseId,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || "Gagal menyimpan nilai ujian.");
      }
    } catch {
      setError("Terjadi kendala koneksi ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={!!student}
      onClose={onClose}
      title={`Nilai Ujian: ${student.name}`}
      maxWidth="sm"
    >
      <form onSubmit={handleSave} className="space-y-4">
        <p className="text-xs text-neutral-600 font-bold">
          Masukkan nilai murni (0 - 100) untuk UTS dan UAS mahasiswa{" "}
          <strong className="text-black">{student.nim}</strong>.
        </p>

        {error && (
          <div className="neo-box-sm bg-[#FF5252] text-white p-2.5 text-xs font-black">
            ⚠️ {error}
          </div>
        )}

        <Input
          label={`Nilai Murni UTS (Bobot ${weights.uts}%)`}
          type="number"
          min={0}
          max={100}
          step="0.1"
          required
          value={utsInput}
          onChange={(e) => setUtsInput(parseFloat(e.target.value) || 0)}
        />

        <Input
          label={`Nilai Murni UAS (Bobot ${weights.uas}%)`}
          type="number"
          min={0}
          max={100}
          step="0.1"
          required
          value={uasInput}
          onChange={(e) => setUasInput(parseFloat(e.target.value) || 0)}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Nilai Ujian"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
