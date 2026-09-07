"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CaptchaDeleteModal } from "@/components/ui/captcha-delete-modal";
import {
  deletePeriodAction,
  setActivePeriodAction,
} from "../actions/period.actions";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Lock,
  Plus,
  Sliders,
  Trash2,
  Unlock,
  Edit3,
} from "lucide-react";
import {
  formatIndoDateTime,
  getRemainingDaysText,
} from "../lib/period-date.utils";
import { PeriodCreateForm } from "./period-create-form";
import { PeriodWindowModal } from "./period-window-modal";
import {
  PeriodAutoCloseModal,
  AutoCloseModalData,
} from "./period-auto-close-modal";
import { PeriodEditNameModal } from "./period-edit-name-modal";

export interface PeriodItem {
  id: string;
  name: string;
  isActive: boolean;
  courseInputStart?: Date | string | null;
  courseInputEnd?: Date | string | null;
  studentInputStart: Date | string;
  studentInputEnd: Date | string;
  _count: { courses: number };
}

interface PeriodManagerProps {
  periods: PeriodItem[];
}

export function PeriodManager({ periods }: PeriodManagerProps) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Active period
  const activePeriod = periods.find((p) => p.isActive) || periods[0];

  // Modal Kontrol Jendela Waktu
  const [selectedPeriodIdForWindow, setSelectedPeriodIdForWindow] = useState<string | null>(null);
  const selectedPeriod = periods.find((p) => p.id === selectedPeriodIdForWindow) || null;

  // Auto-close adjustment modal state
  const [autoCloseModal, setAutoCloseModal] = useState<AutoCloseModalData | null>(null);

  // Create Period Form State
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit Period Name Modal State
  const [periodToEdit, setPeriodToEdit] = useState<PeriodItem | null>(null);

  // Delete Period Modal State
  const [periodToDelete, setPeriodToDelete] = useState<PeriodItem | null>(null);

  const now = new Date();

  // Helper checks for active period
  const isCourseOpen = activePeriod
    ? (!activePeriod.courseInputStart || now >= new Date(activePeriod.courseInputStart)) &&
      (activePeriod.courseInputEnd ? now <= new Date(activePeriod.courseInputEnd) : false)
    : false;

  const isStudentOpen = activePeriod
    ? (!activePeriod.studentInputStart || now >= new Date(activePeriod.studentInputStart)) &&
      (activePeriod.studentInputEnd ? now <= new Date(activePeriod.studentInputEnd) : false)
    : false;

  // Set Active Period
  async function handleSetActive(periodId: string) {
    setActionLoading(`set-active-${periodId}`);
    try {
      const res = await setActivePeriodAction(periodId);
      if (res.success) {
        setFeedback({ success: true, message: res.message });
        router.refresh();
      } else {
        setFeedback({ success: false, message: res.message });
      }
    } catch {
      setFeedback({ success: false, message: "Terjadi kendala jaringan." });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`neo-box p-4 flex items-center justify-between text-xs font-black ${
            feedback.success ? "bg-[#4CAF50] text-black" : "bg-[#FF5252] text-white"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-bold underline text-xs ml-4 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Kontrol Ringkasan Periode Aktif */}
      {activePeriod && (
        <div className="neo-box bg-[#FFF9F0] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-dashed border-neutral-300 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                Periode Semester Aktif
              </span>
              <h2 className="text-xl font-black uppercase text-black flex items-center gap-2">
                <span>{activePeriod.name}</span>
                <button
                  type="button"
                  onClick={() => setPeriodToEdit(activePeriod)}
                  title="Edit Nama Periode"
                  className="p-1 hover:bg-neutral-200 border border-black cursor-pointer text-black inline-flex items-center"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <span className="neo-box-sm bg-[#4CAF50] text-black px-2 py-0.5 text-[10px] font-black uppercase">
                  Aktif
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="text-xs"
                onClick={() => setSelectedPeriodIdForWindow(activePeriod.id)}
              >
                <Sliders className="w-3.5 h-3.5 mr-1 text-[#2196F3]" />
                Atur Jendela Waktu
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="text-xs"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Periode Baru
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-white border-2 border-black flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase block">
                  1. Klaim MK (Asprak)
                </span>
                <span className="text-xs font-black text-black">
                  {isCourseOpen ? "Sedang Dibuka" : "Sedang Ditutup"}
                </span>
              </div>
              {isCourseOpen ? (
                <span className="neo-box-sm bg-[#4CAF50] text-black px-2.5 py-1 text-[11px] font-black uppercase flex items-center gap-1">
                  <Unlock className="w-3 h-3" />
                  Terbuka ({getRemainingDaysText(activePeriod.courseInputEnd)})
                </span>
              ) : (
                <span className="neo-box-sm bg-[#FF5252] text-white px-2.5 py-1 text-[11px] font-black uppercase flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Ditutup
                </span>
              )}
            </div>

            <div className="p-3 bg-white border-2 border-black flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase block">
                  2. Input Praktikan
                </span>
                <span className="text-xs font-black text-black">
                  {isStudentOpen ? "Sedang Dibuka" : "Sedang Ditutup"}
                </span>
              </div>
              {isStudentOpen ? (
                <span className="neo-box-sm bg-[#4CAF50] text-black px-2.5 py-1 text-[11px] font-black uppercase flex items-center gap-1">
                  <Unlock className="w-3 h-3" />
                  Terbuka ({getRemainingDaysText(activePeriod.studentInputEnd)})
                </span>
              ) : (
                <span className="neo-box-sm bg-[#FF5252] text-white px-2.5 py-1 text-[11px] font-black uppercase flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Ditutup
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Buat Periode Baru */}
      <PeriodCreateForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={(message) => {
          setFeedback({ success: true, message });
          router.refresh();
        }}
        onError={(message) => {
          setFeedback({ success: false, message });
        }}
      />

      {/* Tabel Riwayat & Manajemen Semua Periode */}
      <div className="neo-box bg-white overflow-hidden">
        <div className="p-4 bg-neutral-100 border-b-3 border-black flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-tight text-neutral-800 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Riwayat Seluruh Periode Akademik
          </h3>
          <span className="text-xs font-mono font-bold text-neutral-600">
            Total: {periods.length} Periode
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-3 border-black bg-[#FFF9F0] text-xs font-black uppercase">
                <th className="p-3 border-r-3 border-black w-12 text-center">No</th>
                <th className="p-3 border-r-3 border-black">Nama Periode</th>
                <th className="p-3 border-r-3 border-black">Jendela Klaim MK</th>
                <th className="p-3 border-r-3 border-black">Jendela Input Praktikan</th>
                <th className="p-3 border-r-3 border-black text-center">Total MK</th>
                <th className="p-3 border-r-3 border-black text-center">Status</th>
                <th className="p-3 text-center w-56">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-neutral-200 text-xs font-medium">
              {periods.map((p, idx) => {
                const isPStudentOpen =
                  (!p.studentInputStart || now >= new Date(p.studentInputStart)) &&
                  (p.studentInputEnd ? now <= new Date(p.studentInputEnd) : false);

                const isPCourseOpen =
                  (!p.courseInputStart || now >= new Date(p.courseInputStart)) &&
                  (p.courseInputEnd ? now <= new Date(p.courseInputEnd) : false);

                return (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="p-3 border-r-3 border-black font-mono font-bold text-center">
                      {idx + 1}
                    </td>
                    <td className="p-3 border-r-3 border-black font-bold text-black">
                      {p.name}
                    </td>

                    <td className="p-3 border-r-3 border-black">
                      <div className="flex items-center gap-2">
                        {isPCourseOpen ? (
                          <>
                            <span className="neo-box-sm bg-[#4CAF50] text-black px-1.5 py-0.5 text-[10px] font-black uppercase">
                              Buka
                            </span>
                            <span className="font-mono text-[11px] text-neutral-700">
                              s.d. {formatIndoDateTime(p.courseInputEnd)}
                            </span>
                          </>
                        ) : (
                          <span className="neo-box-sm bg-[#FF5252] text-white px-1.5 py-0.5 text-[10px] font-black uppercase">
                            Tutup
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 border-r-3 border-black">
                      <div className="flex items-center gap-2">
                        {isPStudentOpen ? (
                          <>
                            <span className="neo-box-sm bg-[#4CAF50] text-black px-1.5 py-0.5 text-[10px] font-black uppercase">
                              Buka
                            </span>
                            <span className="font-mono text-[11px] text-neutral-700">
                              s.d. {formatIndoDateTime(p.studentInputEnd)}
                            </span>
                          </>
                        ) : (
                          <span className="neo-box-sm bg-[#FF5252] text-white px-1.5 py-0.5 text-[10px] font-black uppercase">
                            Tutup
                          </span>
                        )}
                      </div>
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
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs px-2 py-1 bg-yellow-300 hover:bg-yellow-400"
                          onClick={() => setPeriodToEdit(p)}
                          title="Edit Nama Periode"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs px-2.5 py-1"
                          onClick={() => setSelectedPeriodIdForWindow(p.id)}
                          title="Atur Jendela Waktu"
                        >
                          <Sliders className="w-3 h-3 mr-1 text-[#2196F3]" />
                          Atur
                        </Button>
                        {!p.isActive && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs px-2 py-1 bg-black text-white hover:bg-neutral-800"
                            disabled={actionLoading === `set-active-${p.id}`}
                            onClick={() => handleSetActive(p.id)}
                          >
                            Aktifkan
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          className="text-xs px-2 py-1 bg-[#FF5252] text-white hover:bg-red-700 transition-colors"
                          onClick={() => setPeriodToDelete(p)}
                          title="Hapus Periode & Seluruh Datanya"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Kontrol Jendela Waktu (Pop-up saat klik "Atur") */}
      {selectedPeriod && (
        <PeriodWindowModal
          period={selectedPeriod}
          onClose={() => setSelectedPeriodIdForWindow(null)}
          onOpenAutoCloseModal={(data) => setAutoCloseModal(data)}
          onSuccess={(message) => {
            setFeedback({ success: true, message });
            router.refresh();
          }}
          onError={(message) => {
            setFeedback({ success: false, message });
          }}
        />
      )}

      {/* Modal Sesuaikan Waktu Tutup Otomatis */}
      {autoCloseModal && (
        <PeriodAutoCloseModal
          data={autoCloseModal}
          onClose={() => setAutoCloseModal(null)}
          onSuccess={(message) => {
            setFeedback({ success: true, message });
            router.refresh();
          }}
          onError={(message) => {
            setFeedback({ success: false, message });
          }}
        />
      )}

      {/* Modal Konfirmasi Hapus Periode dengan CAPTCHA */}
      {periodToDelete && (
        <CaptchaDeleteModal
          isOpen={!!periodToDelete}
          onClose={() => setPeriodToDelete(null)}
          title="Konfirmasi Hapus Periode"
          action="DELETE_PERIOD"
          targetId={periodToDelete.id}
          confirmButtonText="Ya, Hapus Seluruh Data"
          targetDescription={
            <p>
              Apakah Anda yakin ingin menghapus periode{" "}
              <span className="font-black underline">{periodToDelete.name}</span>?
            </p>
          }
          warningNotice={
            <>
              Semua mata kuliah ({periodToDelete._count.courses} MK), modul praktikum, tugas mahasiswa,
              presensi, nilai tugas, dan rekap nilai akhir dalam periode ini akan{" "}
              <span className="font-black underline">DIHAPUS SELURUHNYA</span> dan tidak dapat dipulihkan.
            </>
          }
          onConfirm={(token, input) =>
            deletePeriodAction(periodToDelete.id, token, input)
          }
          onSuccess={(message) => {
            setFeedback({ success: true, message });
            router.refresh();
          }}
        />
      )}

      {/* Modal Edit Nama Periode */}
      {periodToEdit && (
        <PeriodEditNameModal
          period={periodToEdit}
          isOpen={!!periodToEdit}
          onClose={() => setPeriodToEdit(null)}
          onSuccess={(message) => {
            setFeedback({ success: true, message });
            router.refresh();
          }}
          onError={(message) => {
            setFeedback({ success: false, message });
          }}
        />
      )}
    </div>
  );
}
