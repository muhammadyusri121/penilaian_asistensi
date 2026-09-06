"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createStudentInCourseAction } from "../actions/student.actions";

interface AssistantOption {
  id: string;
  name: string;
  username: string;
}

interface CourseStudentCreateModalProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isAdmin: boolean;
  currentUserId: string;
  assistantsList?: AssistantOption[];
}

export function CourseStudentCreateModal({
  courseId,
  isOpen,
  onClose,
  onSuccess,
  isAdmin,
  currentUserId,
  assistantsList = [],
}: CourseStudentCreateModalProps) {
  const [nim, setNim] = useState("");
  const [name, setName] = useState("");
  const [classGroup, setClassGroup] = useState("");
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>(
    assistantsList[0]?.id || currentUserId
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await createStudentInCourseAction(courseId, {
        nim,
        name,
        classGroup: classGroup || undefined,
        assistantId: isAdmin ? selectedAssistantId : undefined,
      });

      if (res.success) {
        setNim("");
        setName("");
        setClassGroup("");
        onSuccess();
        onClose();
      } else {
        setError(res.message);
      }
    } catch {
      setError("Terjadi kendala jaringan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Praktikan Manual"
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="neo-box-sm bg-[#FF5252] text-white p-2.5 text-xs font-black">
            ⚠️ {error}
          </div>
        )}

        <Input
          id="manual-nim"
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

        {isAdmin && assistantsList.length > 0 && (
          <div className="space-y-1">
            <label
              htmlFor="manual-assistant"
              className="block text-xs font-black uppercase text-black"
            >
              Tentukan Asisten Pembina:
            </label>
            <select
              id="manual-assistant"
              value={selectedAssistantId}
              onChange={(e) => setSelectedAssistantId(e.target.value)}
              className="neo-input w-full py-2 px-3 text-xs font-bold text-black bg-white cursor-pointer"
            >
              {assistantsList.map((ast) => (
                <option key={ast.id} value={ast.id}>
                  {ast.name} (@{ast.username})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-neutral-500 font-medium">
              Admin dapat menentukan asprak yang membimbing praktikan ini secara langsung.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t-2 border-neutral-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Praktikan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
