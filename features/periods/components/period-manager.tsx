"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createPeriodAction, setActivePeriodAction } from "../actions/period.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, CheckCircle2, Clock, Plus } from "lucide-react";

interface PeriodItem {
  id: string;
  name: string;
  isActive: boolean;
  studentInputStart: Date;
  studentInputEnd: Date;
  _count: { courses: number };
}

interface PeriodManagerProps {
  periods: PeriodItem[];
}

export function PeriodManager({ periods }: PeriodManagerProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [studentInputStart, setStudentInputStart] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [studentInputEnd, setStudentInputEnd] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await createPeriodAction({
        name,
        isActive,
        studentInputStart: new Date(`${studentInputStart}T00:00:00.000`).toISOString(),
        studentInputEnd: new Date(`${studentInputEnd}T23:59:59.999`).toISOString(),
      });

      if (res.success) {
        setShowAddForm(false);
        setName("");
        router.refresh();
      } else {
        setErrorMsg(res.message || "Gagal membuat periode.");
      }
    } catch {
      setErrorMsg("Terjadi kendala jaringan.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetActive(periodId: string) {
    try {
      const res = await setActivePeriodAction(periodId);
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
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant={showAddForm ? "secondary" : "primary"}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          {showAddForm ? "Tutup Form" : "Buat Periode Baru"}
        </Button>
      </div>

      {showAddForm && (
        <div className="neo-box bg-white p-6">
          <h3 className="text-base font-black uppercase tracking-tight mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-black" />
            <span>Form Periode Akademik Baru</span>
          </h3>

          {errorMsg && (
            <div className="neo-box-sm bg-[#FF5252] text-white p-3 mb-4 text-xs font-black uppercase">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              id="period-name"
              label="Nama Periode Semester"
              placeholder="cth: Semester Gasal 2026/2027"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="input-start"
                label="Tanggal Buka Input Mahasiswa"
                type="date"
                required
                value={studentInputStart}
                onChange={(e) => setStudentInputStart(e.target.value)}
              />
              <Input
                id="input-end"
                label="Tanggal Tutup Input Mahasiswa"
                type="date"
                required
                value={studentInputEnd}
                onChange={(e) => setStudentInputEnd(e.target.value)}
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-black cursor-pointer pt-1">
              <input
                type="checkbox"
                className="w-4 h-4 rounded-none border-2 border-black accent-black"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span>Jadikan sebagai Periode Semester Aktif Sekarang</span>
            </label>

            <div className="flex justify-end gap-3 pt-3 border-t-3 border-black">
              <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Periode"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tabel Daftar Periode */}
      <div className="neo-box bg-white overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-3 border-black bg-[#FFF9F0] text-xs font-black uppercase">
              <th className="p-3 border-r-3 border-black w-12 text-center">No</th>
              <th className="p-3 border-r-3 border-black">Nama Periode</th>
              <th className="p-3 border-r-3 border-black">Jendela Input Mahasiswa</th>
              <th className="p-3 border-r-3 border-black text-center">Mata Kuliah</th>
              <th className="p-3 border-r-3 border-black text-center">Status</th>
              <th className="p-3 text-center w-36">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-neutral-200 text-xs font-medium">
            {periods.map((p, idx) => {
              const now = new Date();
              const isExpired = now > new Date(p.studentInputEnd);
              const isNotYet = now < new Date(p.studentInputStart);

              return (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="p-3 border-r-3 border-black font-mono font-bold text-center">
                    {idx + 1}
                  </td>
                  <td className="p-3 border-r-3 border-black font-bold text-black">
                    {p.name}
                  </td>
                  <td className="p-3 border-r-3 border-black text-neutral-600 font-mono">
                    {new Date(p.studentInputStart).toLocaleDateString("id-ID")} s.d.{" "}
                    {new Date(p.studentInputEnd).toLocaleDateString("id-ID")}
                    {isExpired && (
                      <span className="neo-box-sm bg-[#FF5252] text-white text-[9px] px-1.5 py-0.5 ml-2 font-black uppercase">
                        Terkunci (Ditutup)
                      </span>
                    )}
                    {!isExpired && !isNotYet && (
                      <span className="neo-box-sm bg-[#4CAF50] text-black text-[9px] px-1.5 py-0.5 ml-2 font-black uppercase">
                        Terbuka
                      </span>
                    )}
                  </td>
                  <td className="p-3 border-r-3 border-black font-mono font-black text-center">
                    {p._count.courses}
                  </td>
                  <td className="p-3 border-r-3 border-black text-center">
                    {p.isActive ? (
                      <span className="neo-box-sm bg-[#4CAF50] text-black px-2 py-0.5 text-[10px] font-black uppercase">
                        AKTIF
                      </span>
                    ) : (
                      <span className="neo-box-sm bg-neutral-200 text-neutral-600 px-2 py-0.5 text-[10px] font-black uppercase">
                        Non-Aktif
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {!p.isActive && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs px-2.5 py-1"
                        onClick={() => handleSetActive(p.id)}
                      >
                        Set Aktif
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
