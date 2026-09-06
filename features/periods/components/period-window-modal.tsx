"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Clock, Lock, Unlock } from "lucide-react";
import { togglePeriodWindowAction } from "../actions/period.actions";
import {
  formatIndoDateTime,
  toLocalDatetimeInputString,
  getRemainingDaysText,
} from "../lib/period-date.utils";
import { PeriodItem } from "./period-manager";
import { AutoCloseModalData } from "./period-auto-close-modal";

interface PeriodWindowModalProps {
  period: PeriodItem | null;
  onClose: () => void;
  onOpenAutoCloseModal: (data: AutoCloseModalData) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function PeriodWindowModal({
  period,
  onClose,
  onOpenAutoCloseModal,
  onSuccess,
  onError,
}: PeriodWindowModalProps) {
  const [courseOpenDays, setCourseOpenDays] = useState<number | "custom">(7);
  const [courseCustomClose, setCourseCustomClose] = useState<string>(
    toLocalDatetimeInputString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  );

  const [studentOpenDays, setStudentOpenDays] = useState<number | "custom">(7);
  const [studentCustomClose, setStudentCustomClose] = useState<string>(
    toLocalDatetimeInputString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  );

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (!period) return null;

  const now = new Date();

  const isTargetCourseOpen =
    (!period.courseInputStart || now >= new Date(period.courseInputStart)) &&
    (period.courseInputEnd ? now <= new Date(period.courseInputEnd) : false);

  const isTargetStudentOpen =
    (!period.studentInputStart || now >= new Date(period.studentInputStart)) &&
    (period.studentInputEnd ? now <= new Date(period.studentInputEnd) : false);

  async function handleToggleWindow(
    windowType: "course" | "student",
    action: "open" | "close"
  ) {
    if (!period) return;

    let autoCloseISO: string | undefined = undefined;

    if (action === "open") {
      if (windowType === "course") {
        if (courseOpenDays === "custom") {
          if (!courseCustomClose || isNaN(new Date(courseCustomClose).getTime())) {
            setActionLoading(null);
            onError("Silakan tentukan tanggal dan waktu penutupan yang valid.");
            return;
          }
          autoCloseISO = new Date(courseCustomClose).toISOString();
        } else {
          autoCloseISO = new Date(
            Date.now() + Number(courseOpenDays) * 24 * 60 * 60 * 1000
          ).toISOString();
        }
      } else {
        if (studentOpenDays === "custom") {
          if (!studentCustomClose || isNaN(new Date(studentCustomClose).getTime())) {
            setActionLoading(null);
            onError("Silakan tentukan tanggal dan waktu penutupan yang valid.");
            return;
          }
          autoCloseISO = new Date(studentCustomClose).toISOString();
        } else {
          autoCloseISO = new Date(
            Date.now() + Number(studentOpenDays) * 24 * 60 * 60 * 1000
          ).toISOString();
        }
      }
    }

    const actionKey = `${period.id}-${windowType}-${action}`;
    setActionLoading(actionKey);

    try {
      const res = await togglePeriodWindowAction(
        period.id,
        windowType,
        action,
        autoCloseISO
      );
      if (res.success) {
        onSuccess(res.message);
      } else {
        onError(res.message);
      }
    } catch {
      onError("Terjadi kendala jaringan saat mengatur jendela waktu.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <Modal
      isOpen={!!period}
      onClose={onClose}
      title={`Pengaturan Jendela: ${period.name}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <p className="text-xs text-neutral-600 font-medium">
          Kelola status pembukaan jendela klaim mata kuliah bagi asprak dan penginputan praktikan untuk periode ini.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* KARTU 1: Jendela Klaim MK (Asprak) */}
          <div
            className={`neo-box p-4 flex flex-col justify-between border-3 border-black transition-colors ${
              isTargetCourseOpen ? "bg-[#F0FDF4]" : "bg-white"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-black">
                  1. JENDELA KLAIM MK (ASPRAK)
                </span>
                {isTargetCourseOpen ? (
                  <span className="neo-box-sm bg-[#4CAF50] text-black px-2.5 py-1 text-xs font-black uppercase border-2 border-black inline-flex items-center gap-1.5">
                    <Unlock className="w-3.5 h-3.5" /> TERBUKA
                  </span>
                ) : (
                  <span className="neo-box-sm bg-[#FF5252] text-white px-2.5 py-1 text-xs font-black uppercase border-2 border-black inline-flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> DITUTUP
                  </span>
                )}
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                {isTargetCourseOpen
                  ? "Asisten praktikum saat ini dapat memilih mata kuliah praktikum yang akan diampu pada semester ini."
                  : "Asisten praktikum tidak dapat memilih atau mengganti mata kuliah praktikum saat ini."}
              </p>

              {isTargetCourseOpen ? (
                <div className="neo-box-sm bg-white p-3 space-y-1.5 border-2 border-black">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-black">
                      <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Tutup Otomatis:</span>
                    </div>
                    <span className="neo-box-sm bg-amber-300 text-black px-2 py-0.5 text-xs font-black border-2 border-black shrink-0">
                      ⏳ {getRemainingDaysText(period.courseInputEnd)}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-neutral-800 font-mono pl-5">
                    {formatIndoDateTime(period.courseInputEnd)}
                  </p>
                  <div className="pt-1 pl-5">
                    <button
                      type="button"
                      onClick={() => {
                        const curr = period.courseInputEnd
                          ? toLocalDatetimeInputString(new Date(period.courseInputEnd))
                          : toLocalDatetimeInputString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
                        onOpenAutoCloseModal({
                          periodId: period.id,
                          windowType: "course",
                          title: "Sesuaikan Tutup Otomatis Klaim MK",
                          currentDate: curr,
                        });
                      }}
                      className="text-[11px] font-black underline text-blue-700 hover:text-blue-900 cursor-pointer"
                    >
                      Sesuaikan Waktu Tutup Otomatis
                    </button>
                  </div>
                </div>
              ) : (
                <div className="neo-box-sm bg-neutral-50 p-3 space-y-2 border-2 border-neutral-300">
                  <span className="text-[11px] font-black uppercase text-neutral-700 block">
                    Pilihan Tutup Otomatis saat Dibuka:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[3, 7, 14, 30].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setCourseOpenDays(days)}
                        className={`px-2 py-1 text-xs font-black border-2 border-black cursor-pointer ${
                          courseOpenDays === days
                            ? "bg-black text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                            : "bg-white text-black hover:bg-neutral-100"
                        }`}
                      >
                        {days} Hari
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCourseOpenDays("custom")}
                      className={`px-2 py-1 text-xs font-black border-2 border-black cursor-pointer ${
                        courseOpenDays === "custom"
                          ? "bg-black text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          : "bg-white text-black hover:bg-neutral-100"
                      }`}
                    >
                      Pilih Waktu...
                    </button>
                  </div>

                  {courseOpenDays === "custom" && (
                    <div className="pt-1">
                      <label className="text-[10px] font-black text-neutral-600 block mb-1">
                        Tutup Otomatis Pada:
                      </label>
                      <input
                        type="datetime-local"
                        value={courseCustomClose}
                        onChange={(e) => setCourseCustomClose(e.target.value)}
                        className="w-full text-xs p-1.5 border-2 border-black font-mono font-bold bg-white"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t-2 border-dashed border-neutral-300 mt-4">
              {isTargetCourseOpen ? (
                <button
                  type="button"
                  disabled={actionLoading === `${period.id}-course-close`}
                  onClick={() => handleToggleWindow("course", "close")}
                  className="w-full neo-btn py-2.5 bg-[#FF5252] text-white border-2 border-black font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  {actionLoading === `${period.id}-course-close`
                    ? "Menutup..."
                    : "TUTUP JENDELA SEKARANG"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionLoading === `${period.id}-course-open`}
                  onClick={() => handleToggleWindow("course", "open")}
                  className="w-full neo-btn py-2.5 bg-[#4CAF50] text-black border-2 border-black font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-[#43A047] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  {actionLoading === `${period.id}-course-open`
                    ? "Membuka..."
                    : "BUKA JENDELA SEKARANG"}
                </button>
              )}
            </div>
          </div>

          {/* KARTU 2: Jendela Input Praktikan */}
          <div
            className={`neo-box p-4 flex flex-col justify-between border-3 border-black transition-colors ${
              isTargetStudentOpen ? "bg-[#F0FDF4]" : "bg-white"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-black">
                  2. JENDELA INPUT PRAKTIKAN
                </span>
                {isTargetStudentOpen ? (
                  <span className="neo-box-sm bg-[#4CAF50] text-black px-2.5 py-1 text-xs font-black uppercase border-2 border-black inline-flex items-center gap-1.5">
                    <Unlock className="w-3.5 h-3.5" /> TERBUKA
                  </span>
                ) : (
                  <span className="neo-box-sm bg-[#FF5252] text-white px-2.5 py-1 text-xs font-black uppercase border-2 border-black inline-flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> DITUTUP
                  </span>
                )}
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                {isTargetStudentOpen
                  ? "Asisten praktikum saat ini dapat mendaftarkan mahasiswa bimbingan praktikan ke mata kuliah yang diampu."
                  : "Penginputan data mahasiswa praktikan oleh asprak sedang dinonaktifkan / ditutup."}
              </p>

              {isTargetStudentOpen ? (
                <div className="neo-box-sm bg-white p-3 space-y-1.5 border-2 border-black">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-black">
                      <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Tutup Otomatis:</span>
                    </div>
                    <span className="neo-box-sm bg-amber-300 text-black px-2 py-0.5 text-xs font-black border-2 border-black shrink-0">
                      ⏳ {getRemainingDaysText(period.studentInputEnd)}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-neutral-800 font-mono pl-5">
                    {formatIndoDateTime(period.studentInputEnd)}
                  </p>
                  <div className="pt-1 pl-5">
                    <button
                      type="button"
                      onClick={() => {
                        const curr = period.studentInputEnd
                          ? toLocalDatetimeInputString(new Date(period.studentInputEnd))
                          : toLocalDatetimeInputString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
                        onOpenAutoCloseModal({
                          periodId: period.id,
                          windowType: "student",
                          title: "Sesuaikan Tutup Otomatis Input Praktikan",
                          currentDate: curr,
                        });
                      }}
                      className="text-[11px] font-black underline text-blue-700 hover:text-blue-900 cursor-pointer"
                    >
                      Sesuaikan Waktu Tutup Otomatis
                    </button>
                  </div>
                </div>
              ) : (
                <div className="neo-box-sm bg-neutral-50 p-3 space-y-2 border-2 border-neutral-300">
                  <span className="text-[11px] font-black uppercase text-neutral-700 block">
                    Pilihan Tutup Otomatis saat Dibuka:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[3, 7, 14, 30].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setStudentOpenDays(days)}
                        className={`px-2 py-1 text-xs font-black border-2 border-black cursor-pointer ${
                          studentOpenDays === days
                            ? "bg-black text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                            : "bg-white text-black hover:bg-neutral-100"
                        }`}
                      >
                        {days} Hari
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setStudentOpenDays("custom")}
                      className={`px-2 py-1 text-xs font-black border-2 border-black cursor-pointer ${
                        studentOpenDays === "custom"
                          ? "bg-black text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          : "bg-white text-black hover:bg-neutral-100"
                      }`}
                    >
                      Pilih Waktu...
                    </button>
                  </div>

                  {studentOpenDays === "custom" && (
                    <div className="pt-1">
                      <label className="text-[10px] font-black text-neutral-600 block mb-1">
                        Tutup Otomatis Pada:
                      </label>
                      <input
                        type="datetime-local"
                        value={studentCustomClose}
                        onChange={(e) => setStudentCustomClose(e.target.value)}
                        className="w-full text-xs p-1.5 border-2 border-black font-mono font-bold bg-white"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t-2 border-dashed border-neutral-300 mt-4">
              {isTargetStudentOpen ? (
                <button
                  type="button"
                  disabled={actionLoading === `${period.id}-student-close`}
                  onClick={() => handleToggleWindow("student", "close")}
                  className="w-full neo-btn py-2.5 bg-[#FF5252] text-white border-2 border-black font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  {actionLoading === `${period.id}-student-close`
                    ? "Menutup..."
                    : "TUTUP JENDELA SEKARANG"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionLoading === `${period.id}-student-open`}
                  onClick={() => handleToggleWindow("student", "open")}
                  className="w-full neo-btn py-2.5 bg-[#4CAF50] text-black border-2 border-black font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-[#43A047] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  {actionLoading === `${period.id}-student-open`
                    ? "Membuka..."
                    : "BUKA JENDELA SEKARANG"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t-2 border-neutral-200">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Selesai / Tutup Pop-up
          </Button>
        </div>
      </div>
    </Modal>
  );
}
