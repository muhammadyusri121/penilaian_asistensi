"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { togglePeriodWindowAction } from "../actions/period.actions";
import { toLocalDatetimeInputString } from "../lib/period-date.utils";
import { PeriodItem } from "./period-manager";
import { AutoCloseModalData } from "./period-auto-close-modal";
import { PeriodWindowSection } from "./period-window-section";

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
          <PeriodWindowSection
            title="1. JENDELA KLAIM MK (ASPRAK)"
            isOpen={isTargetCourseOpen}
            openDescription="Asisten praktikum saat ini dapat memilih mata kuliah praktikum yang akan diampu pada semester ini."
            closeDescription="Asisten praktikum tidak dapat memilih atau mengganti mata kuliah praktikum saat ini."
            autoCloseDate={period.courseInputEnd}
            onOpenAutoCloseModal={() => {
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
            openDays={courseOpenDays}
            setOpenDays={setCourseOpenDays}
            customCloseDate={courseCustomClose}
            setCustomCloseDate={setCourseCustomClose}
            isActionLoading={actionLoading?.startsWith(`${period.id}-course-`) ?? false}
            actionType={
              actionLoading === `${period.id}-course-open`
                ? "open"
                : actionLoading === `${period.id}-course-close`
                ? "close"
                : null
            }
            onToggle={(action) => handleToggleWindow("course", action)}
          />

          {/* KARTU 2: Jendela Input Praktikan */}
          <PeriodWindowSection
            title="2. JENDELA INPUT PRAKTIKAN"
            isOpen={isTargetStudentOpen}
            openDescription="Asisten praktikum saat ini dapat mendaftarkan mahasiswa bimbingan praktikan ke mata kuliah yang diampu."
            closeDescription="Penginputan data mahasiswa praktikan oleh asprak sedang dinonaktifkan / ditutup."
            autoCloseDate={period.studentInputEnd}
            onOpenAutoCloseModal={() => {
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
            openDays={studentOpenDays}
            setOpenDays={setStudentOpenDays}
            customCloseDate={studentCustomClose}
            setCustomCloseDate={setStudentCustomClose}
            isActionLoading={actionLoading?.startsWith(`${period.id}-student-`) ?? false}
            actionType={
              actionLoading === `${period.id}-student-open`
                ? "open"
                : actionLoading === `${period.id}-student-close`
                ? "close"
                : null
            }
            onToggle={(action) => handleToggleWindow("student", action)}
          />
        </div>

        <div className="pt-3 border-t-2 border-neutral-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="neo-btn px-4 py-2 bg-white text-black text-xs font-black border-2 border-black hover:bg-neutral-100 cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </Modal>
  );
}
