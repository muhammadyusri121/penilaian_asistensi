"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createPeriodAction,
  setActivePeriodAction,
  updatePeriodDatesAction,
  togglePeriodWindowAction,
  updateWindowAutoCloseAction,
} from "../actions/period.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  Calendar,
  Clock,
  Plus,
  Edit3,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

interface PeriodItem {
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

function formatIndoDateTime(val?: Date | string | null) {
  if (!val) return "-";
  const date = new Date(val);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toLocalDatetimeInputString(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getRemainingDaysText(targetDate?: Date | string | null): string {
  if (!targetDate) return "-";
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diffMs = target - now;

  if (diffMs <= 0) {
    return "Telah ditutup";
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 24) {
    if (diffHours <= 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `${diffMins} menit lagi`;
    }
    return `${diffHours} jam lagi`;
  }

  return `${diffDays} hari lagi`;
}

export function PeriodManager({ periods }: PeriodManagerProps) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Active period
  const activePeriod = periods.find((p) => p.isActive) || periods[0];

  // Auto-close duration presets when opening window
  const [courseOpenDays, setCourseOpenDays] = useState<number | "custom">(7);
  const [courseCustomClose, setCourseCustomClose] = useState<string>(
    toLocalDatetimeInputString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  );

  const [studentOpenDays, setStudentOpenDays] = useState<number | "custom">(7);
  const [studentCustomClose, setStudentCustomClose] = useState<string>(
    toLocalDatetimeInputString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  );

  // Auto-close adjustment modal
  const [autoCloseModal, setAutoCloseModal] = useState<{
    periodId: string;
    windowType: "course" | "student";
    title: string;
    currentDate: string;
  } | null>(null);
  const [newAutoCloseDate, setNewAutoCloseDate] = useState("");

  // Create Period Modal
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [isActiveNew, setIsActiveNew] = useState(true);
  const [loadingCreate, setLoadingCreate] = useState(false);

  // Edit Manual Modal
  const [editingPeriod, setEditingPeriod] = useState<PeriodItem | null>(null);
  const [editCourseStart, setEditCourseStart] = useState("");
  const [editCourseEnd, setEditCourseEnd] = useState("");
  const [editStudentStart, setEditStudentStart] = useState("");
  const [editStudentEnd, setEditStudentEnd] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  // Toggle Window Handler (Buka / Tutup)
  async function handleToggleWindow(
    periodId: string,
    windowType: "course" | "student",
    action: "open" | "close"
  ) {
    let autoCloseISO: string | undefined = undefined;

    if (action === "open") {
      if (windowType === "course") {
        if (courseOpenDays === "custom") {
          autoCloseISO = new Date(courseCustomClose).toISOString();
        } else {
          autoCloseISO = new Date(Date.now() + Number(courseOpenDays) * 24 * 60 * 60 * 1000).toISOString();
        }
      } else {
        if (studentOpenDays === "custom") {
          autoCloseISO = new Date(studentCustomClose).toISOString();
        } else {
          autoCloseISO = new Date(Date.now() + Number(studentOpenDays) * 24 * 60 * 60 * 1000).toISOString();
        }
      }
    }

    const actionKey = `${periodId}-${windowType}-${action}`;
    setActionLoading(actionKey);
    setFeedback(null);

    try {
      const res = await togglePeriodWindowAction(periodId, windowType, action, autoCloseISO);
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

  // Update Auto-Close Date
  async function handleSaveAutoClose(e: React.FormEvent) {
    e.preventDefault();
    if (!autoCloseModal || !newAutoCloseDate) return;

    setActionLoading("save-autoclose");
    setFeedback(null);

    try {
      const res = await updateWindowAutoCloseAction(
        autoCloseModal.periodId,
        autoCloseModal.windowType,
        new Date(newAutoCloseDate).toISOString()
      );
      if (res.success) {
        setFeedback({ success: true, message: res.message });
        setAutoCloseModal(null);
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

  // Create Period
  async function handleCreatePeriod(e: React.FormEvent) {
    e.preventDefault();
    setLoadingCreate(true);
    setFeedback(null);

    try {
      const defaultStart = new Date().toISOString();
      const defaultEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      const res = await createPeriodAction({
        name,
        isActive: isActiveNew,
        courseInputStart: defaultStart,
        courseInputEnd: defaultEnd,
        studentInputStart: defaultStart,
        studentInputEnd: defaultEnd,
      });

      if (res.success) {
        setShowAddForm(false);
        setName("");
        setFeedback({ success: true, message: res.message });
        router.refresh();
      } else {
        setFeedback({ success: false, message: res.message });
      }
    } catch {
      setFeedback({ success: false, message: "Terjadi kendala jaringan." });
    } finally {
      setLoadingCreate(false);
    }
  }

  // Open Edit Manual
  function openEditModal(p: PeriodItem) {
    setEditingPeriod(p);
    setEditCourseStart(
      p.courseInputStart
        ? toLocalDatetimeInputString(new Date(p.courseInputStart))
        : toLocalDatetimeInputString(new Date(p.studentInputStart))
    );
    setEditCourseEnd(
      p.courseInputEnd
        ? toLocalDatetimeInputString(new Date(p.courseInputEnd))
        : toLocalDatetimeInputString(new Date(p.studentInputEnd))
    );
    setEditStudentStart(toLocalDatetimeInputString(new Date(p.studentInputStart)));
    setEditStudentEnd(toLocalDatetimeInputString(new Date(p.studentInputEnd)));
    setEditError(null);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPeriod) return;

    setEditLoading(true);
    setEditError(null);

    try {
      const res = await updatePeriodDatesAction(editingPeriod.id, {
        courseInputStart: new Date(editCourseStart).toISOString(),
        courseInputEnd: new Date(editCourseEnd).toISOString(),
        studentInputStart: new Date(editStudentStart).toISOString(),
        studentInputEnd: new Date(editStudentEnd).toISOString(),
      });

      if (res.success) {
        setEditingPeriod(null);
        setFeedback({ success: true, message: res.message });
        router.refresh();
      } else {
        setEditError(res.message);
      }
    } catch {
      setEditError("Terjadi kendala jaringan.");
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
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
            className="font-bold underline text-xs ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Kontrol Utama Jendela Periode Aktif */}
      {activePeriod && (
        <div className="neo-box bg-[#FFF9F0] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-dashed border-neutral-300 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                Periode Semester Aktif
              </span>
              <h2 className="text-xl font-black uppercase text-black flex items-center gap-2">
                <span>{activePeriod.name}</span>
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
                onClick={() => openEditModal(activePeriod)}
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                Jadwal Kalender Manual
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            {/* KARTU 1: Jendela Klaim MK (Asprak) */}
            <div
              className={`neo-box p-4 flex flex-col justify-between transition-colors ${
                isCourseOpen ? "bg-[#F0FDF4] border-black" : "bg-white border-black"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-black">
                    1. Jendela Klaim MK (Asprak)
                  </span>
                  {isCourseOpen ? (
                    <span className="neo-box-sm bg-[#4CAF50] text-black px-2.5 py-1 text-xs font-black uppercase inline-flex items-center gap-1.5">
                      <Unlock className="w-3.5 h-3.5" /> Terbuka
                    </span>
                  ) : (
                    <span className="neo-box-sm bg-[#FF5252] text-white px-2.5 py-1 text-xs font-black uppercase inline-flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Ditutup
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                  {isCourseOpen
                    ? "Asisten praktikum saat ini dapat memilih mata kuliah praktikum yang akan diampu pada semester ini."
                    : "Asisten praktikum tidak dapat memilih atau mengganti mata kuliah praktikum saat ini."}
                </p>

                {isCourseOpen ? (
                  <div className="neo-box-sm bg-white p-3 space-y-1.5 border-2 border-black">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-black">
                        <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Tutup Otomatis:</span>
                      </div>
                      <span className="neo-box-sm bg-amber-300 text-black px-2 py-0.5 text-xs font-black shrink-0">
                        ⏳ {getRemainingDaysText(activePeriod.courseInputEnd)}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-neutral-800 font-mono pl-5">
                      {formatIndoDateTime(activePeriod.courseInputEnd)}
                    </p>
                    <div className="pt-1 pl-5">
                      <button
                        type="button"
                        onClick={() => {
                          const curr = activePeriod.courseInputEnd
                            ? toLocalDatetimeInputString(new Date(activePeriod.courseInputEnd))
                            : toLocalDatetimeInputString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
                          setNewAutoCloseDate(curr);
                          setAutoCloseModal({
                            periodId: activePeriod.id,
                            windowType: "course",
                            title: "Sesuaikan Tutup Otomatis Klaim MK",
                            currentDate: curr,
                          });
                        }}
                        className="text-[11px] font-black underline text-blue-700 hover:text-blue-900"
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
                          className={`px-2 py-1 text-xs font-black border-2 border-black ${
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
                        className={`px-2 py-1 text-xs font-black border-2 border-black ${
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
                {isCourseOpen ? (
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full justify-center"
                    disabled={actionLoading === `${activePeriod.id}-course-close`}
                    onClick={() => handleToggleWindow(activePeriod.id, "course", "close")}
                  >
                    <Lock className="w-4 h-4 mr-1.5" />
                    {actionLoading === `${activePeriod.id}-course-close`
                      ? "Menutup..."
                      : "Tutup Jendela Sekarang"}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center bg-[#4CAF50] text-black hover:bg-[#43A047]"
                    disabled={actionLoading === `${activePeriod.id}-course-open`}
                    onClick={() => handleToggleWindow(activePeriod.id, "course", "open")}
                  >
                    <Unlock className="w-4 h-4 mr-1.5" />
                    {actionLoading === `${activePeriod.id}-course-open`
                      ? "Membuka..."
                      : "Buka Jendela Sekarang"}
                  </Button>
                )}
              </div>
            </div>

            {/* KARTU 2: Jendela Input Praktikan */}
            <div
              className={`neo-box p-4 flex flex-col justify-between transition-colors ${
                isStudentOpen ? "bg-[#F0FDF4] border-black" : "bg-white border-black"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-black">
                    2. Jendela Input Praktikan
                  </span>
                  {isStudentOpen ? (
                    <span className="neo-box-sm bg-[#4CAF50] text-black px-2.5 py-1 text-xs font-black uppercase inline-flex items-center gap-1.5">
                      <Unlock className="w-3.5 h-3.5" /> Terbuka
                    </span>
                  ) : (
                    <span className="neo-box-sm bg-[#FF5252] text-white px-2.5 py-1 text-xs font-black uppercase inline-flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Ditutup
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                  {isStudentOpen
                    ? "Asisten praktikum saat ini dapat mendaftarkan mahasiswa bimbingan praktikan ke mata kuliah yang diampu."
                    : "Penginputan data mahasiswa praktikan oleh asprak sedang dinonaktifkan / ditutup."}
                </p>

                {isStudentOpen ? (
                  <div className="neo-box-sm bg-white p-3 space-y-1.5 border-2 border-black">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-black">
                        <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Tutup Otomatis:</span>
                      </div>
                      <span className="neo-box-sm bg-amber-300 text-black px-2 py-0.5 text-xs font-black shrink-0">
                        ⏳ {getRemainingDaysText(activePeriod.studentInputEnd)}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-neutral-800 font-mono pl-5">
                      {formatIndoDateTime(activePeriod.studentInputEnd)}
                    </p>
                    <div className="pt-1 pl-5">
                      <button
                        type="button"
                        onClick={() => {
                          const curr = activePeriod.studentInputEnd
                            ? toLocalDatetimeInputString(new Date(activePeriod.studentInputEnd))
                            : toLocalDatetimeInputString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
                          setNewAutoCloseDate(curr);
                          setAutoCloseModal({
                            periodId: activePeriod.id,
                            windowType: "student",
                            title: "Sesuaikan Tutup Otomatis Input Praktikan",
                            currentDate: curr,
                          });
                        }}
                        className="text-[11px] font-black underline text-blue-700 hover:text-blue-900"
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
                          className={`px-2 py-1 text-xs font-black border-2 border-black ${
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
                        className={`px-2 py-1 text-xs font-black border-2 border-black ${
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
                {isStudentOpen ? (
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full justify-center"
                    disabled={actionLoading === `${activePeriod.id}-student-close`}
                    onClick={() => handleToggleWindow(activePeriod.id, "student", "close")}
                  >
                    <Lock className="w-4 h-4 mr-1.5" />
                    {actionLoading === `${activePeriod.id}-student-close`
                      ? "Menutup..."
                      : "Tutup Jendela Sekarang"}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center bg-[#4CAF50] text-black hover:bg-[#43A047]"
                    disabled={actionLoading === `${activePeriod.id}-student-open`}
                    onClick={() => handleToggleWindow(activePeriod.id, "student", "open")}
                  >
                    <Unlock className="w-4 h-4 mr-1.5" />
                    {actionLoading === `${activePeriod.id}-student-open`
                      ? "Membuka..."
                      : "Buka Jendela Sekarang"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Buat Periode Baru */}
      {showAddForm && (
        <div className="neo-box bg-white p-5 border-3 border-black space-y-4">
          <h3 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Buat Periode Akademik Baru
          </h3>
          <form onSubmit={handleCreatePeriod} className="space-y-4">
            <Input
              id="period-name"
              label="Nama Periode Semester"
              placeholder="Contoh: Semester Genap 2026/2027"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="flex items-center gap-2 pt-1">
              <input
                id="is-active"
                type="checkbox"
                checked={isActiveNew}
                onChange={(e) => setIsActiveNew(e.target.checked)}
                className="w-4 h-4 border-2 border-black accent-black cursor-pointer"
              />
              <label htmlFor="is-active" className="text-xs font-bold text-black cursor-pointer">
                Langsung aktifkan sebagai semester berjalan sekarang
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t-2 border-black">
              <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={loadingCreate}>
                {loadingCreate ? "Menyimpan..." : "Simpan Periode Baru"}
              </Button>
            </div>
          </form>
        </div>
      )}

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
                <th className="p-3 text-center w-48">Aksi</th>
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

                    {/* Jendela Klaim MK */}
                    <td className="p-3 border-r-3 border-black">
                      <div className="flex items-center gap-1.5 mb-1">
                        {isPCourseOpen ? (
                          <span className="neo-box-sm bg-[#4CAF50] text-black text-[9px] px-1.5 py-0.2 font-black uppercase inline-flex items-center gap-1">
                            <Unlock className="w-2.5 h-2.5" /> Buka
                          </span>
                        ) : (
                          <span className="neo-box-sm bg-[#FF5252] text-white text-[9px] px-1.5 py-0.2 font-black uppercase inline-flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Ditutup
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-600">
                        {isPCourseOpen ? (
                          <>
                            <div>{formatIndoDateTime(p.courseInputEnd)}</div>
                            <div className="font-bold text-amber-800 font-sans mt-0.5">
                              ⏳ {getRemainingDaysText(p.courseInputEnd)}
                            </div>
                          </>
                        ) : (
                          <span>Tutup otomatis</span>
                        )}
                      </div>
                    </td>

                    {/* Jendela Input Praktikan */}
                    <td className="p-3 border-r-3 border-black">
                      <div className="flex items-center gap-1.5 mb-1">
                        {isPStudentOpen ? (
                          <span className="neo-box-sm bg-[#4CAF50] text-black text-[9px] px-1.5 py-0.2 font-black uppercase inline-flex items-center gap-1">
                            <Unlock className="w-2.5 h-2.5" /> Buka
                          </span>
                        ) : (
                          <span className="neo-box-sm bg-[#FF5252] text-white text-[9px] px-1.5 py-0.2 font-black uppercase inline-flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Ditutup
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-600">
                        {isPStudentOpen ? (
                          <>
                            <div>{formatIndoDateTime(p.studentInputEnd)}</div>
                            <div className="font-bold text-amber-800 font-sans mt-0.5">
                              ⏳ {getRemainingDaysText(p.studentInputEnd)}
                            </div>
                          </>
                        ) : (
                          <span>Tutup otomatis</span>
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
                          className="text-xs px-2 py-1"
                          onClick={() => openEditModal(p)}
                          title="Atur Kalender & Jadwal Manual"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
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
                            Set Aktif
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Sesuaikan Waktu Tutup Otomatis */}
      {autoCloseModal && (
        <Modal
          isOpen={!!autoCloseModal}
          onClose={() => setAutoCloseModal(null)}
          title={autoCloseModal.title}
          maxWidth="sm"
        >
          <form onSubmit={handleSaveAutoClose} className="space-y-4">
            <p className="text-xs text-neutral-600">
              Jendela saat ini sedang dibuka. Tentukan kapan jendela ini akan ditutup secara otomatis oleh sistem.
            </p>

            <div>
              <label className="text-xs font-black uppercase text-black block mb-1">
                Waktu Tutup Otomatis Baru:
              </label>
              <input
                type="datetime-local"
                required
                value={newAutoCloseDate}
                onChange={(e) => setNewAutoCloseDate(e.target.value)}
                className="w-full text-xs p-2 border-2 border-black font-mono font-bold bg-white"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-neutral-500 w-full block">
                Tambah Waktu Cepat:
              </span>
              {[1, 3, 7, 14].map((extraDays) => (
                <button
                  key={extraDays}
                  type="button"
                  onClick={() => {
                    const next = new Date(Date.now() + extraDays * 24 * 60 * 60 * 1000);
                    setNewAutoCloseDate(toLocalDatetimeInputString(next));
                  }}
                  className="px-2 py-0.5 text-[10px] font-bold border-2 border-black bg-neutral-100 hover:bg-neutral-200"
                >
                  +{extraDays} Hari
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t-2 border-neutral-200">
              <Button type="button" variant="secondary" onClick={() => setAutoCloseModal(null)}>
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={actionLoading === "save-autoclose"}
              >
                {actionLoading === "save-autoclose" ? "Menyimpan..." : "Simpan Waktu Tutup"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Edit Kalender & Jadwal Manual */}
      {editingPeriod && (
        <Modal
          isOpen={!!editingPeriod}
          onClose={() => setEditingPeriod(null)}
          title={`Jadwal Manual: ${editingPeriod.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {editError && (
              <div className="neo-box-sm bg-[#FF5252] text-white p-2.5 text-xs font-black">
                ⚠️ {editError}
              </div>
            )}

            {/* Jendela Klaim MK */}
            <div className="p-3 bg-blue-50 border-2 border-neutral-300 rounded space-y-3">
              <span className="text-xs font-black uppercase text-blue-900 block">
                1. Batas Waktu Pengambilan / Klaim MK (Asprak)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Buka Klaim MK
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editCourseStart}
                    onChange={(e) => setEditCourseStart(e.target.value)}
                    className="w-full text-xs p-2 border-2 border-black font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Tutup Otomatis Klaim MK
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editCourseEnd}
                    onChange={(e) => setEditCourseEnd(e.target.value)}
                    className="w-full text-xs p-2 border-2 border-black font-mono font-bold bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Jendela Input Praktikan */}
            <div className="p-3 bg-amber-50 border-2 border-neutral-300 rounded space-y-3">
              <span className="text-xs font-black uppercase text-amber-900 block">
                2. Batas Waktu Input Data Praktikan (Asprak)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Buka Input Praktikan
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editStudentStart}
                    onChange={(e) => setEditStudentStart(e.target.value)}
                    className="w-full text-xs p-2 border-2 border-black font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Tutup Otomatis Input Praktikan
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editStudentEnd}
                    onChange={(e) => setEditStudentEnd(e.target.value)}
                    className="w-full text-xs p-2 border-2 border-black font-mono font-bold bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t-2 border-neutral-200">
              <Button type="button" variant="secondary" onClick={() => setEditingPeriod(null)}>
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={editLoading}>
                {editLoading ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
