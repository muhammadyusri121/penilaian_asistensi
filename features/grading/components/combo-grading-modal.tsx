"use client";

import React, { useState, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  calculateModuleScore,
  RUBRIC_PRESETS,
  CRITERIA_MAX_SCORES,
} from "../utils/calculate";
import { saveGradeAction } from "../actions/grade.actions";
import { CheckCircle2, AlertCircle, Sparkles, Calendar } from "lucide-react";

interface ComboGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  moduleTitle: string;
  student: {
    nim: string;
    name: string;
    classGroup?: string | null;
    currentGrade?: {
      asistensiDate?: Date | string;
      taskConformity: number;
      programExplanation: number;
      attendance: number;
      attitude: number;
      reportDiscussion: number;
      reportFormat: number;
      plagiarism: number;
      neatness: number;
      submissionPunctuality: number;
      notes?: string | null;
    } | null;
    githubUrl?: string | null;
    demoUrl?: string | null;
  } | null;
  onSuccess?: () => void;
}

export function ComboGradingModal({
  isOpen,
  onClose,
  moduleId,
  moduleTitle,
  student,
  onSuccess,
}: ComboGradingModalProps) {
  const [taskConformity, setTaskConformity] = useState<number>(student?.currentGrade?.taskConformity ?? 22);
  const [programExplanation, setProgramExplanation] = useState<number>(student?.currentGrade?.programExplanation ?? 19);
  const [attendance, setAttendance] = useState<number>(student?.currentGrade?.attendance ?? 8);
  const [attitude, setAttitude] = useState<number>(student?.currentGrade?.attitude ?? 6);

  const [reportDiscussion, setReportDiscussion] = useState<number>(student?.currentGrade?.reportDiscussion ?? 12);
  const [reportFormat, setReportFormat] = useState<number>(student?.currentGrade?.reportFormat ?? 10.5);
  const [plagiarism, setPlagiarism] = useState<number>(student?.currentGrade?.plagiarism ?? 9);
  const [neatness, setNeatness] = useState<number>(student?.currentGrade?.neatness ?? 3.5);

  const [submissionPunctuality, setSubmissionPunctuality] = useState<number>(student?.currentGrade?.submissionPunctuality ?? 10);
  const [asistensiDate, setAsistensiDate] = useState<string>(
    student?.currentGrade?.asistensiDate
      ? new Date(student.currentGrade.asistensiDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );

  const [notes, setNotes] = useState<string>(student?.currentGrade?.notes ?? "");
  const [githubUrl, setGithubUrl] = useState<string>(student?.githubUrl ?? "");
  const [demoUrl, setDemoUrl] = useState<string>(student?.demoUrl ?? "");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Live real-time subtotal & total calculation
  const calc = useMemo(() => {
    return calculateModuleScore({
      taskConformity,
      programExplanation,
      attendance,
      attitude,
      reportDiscussion,
      reportFormat,
      plagiarism,
      neatness,
      submissionPunctuality,
    });
  }, [
    taskConformity,
    programExplanation,
    attendance,
    attitude,
    reportDiscussion,
    reportFormat,
    plagiarism,
    neatness,
    submissionPunctuality,
  ]);

  if (!student) return null;

  async function handleSave() {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await saveGradeAction({
        studentNim: student!.nim,
        moduleId,
        asistensiDate,
        taskConformity,
        programExplanation,
        attendance,
        attitude,
        reportDiscussion,
        reportFormat,
        plagiarism,
        neatness,
        submissionPunctuality,
        notes,
        githubUrl,
        demoUrl,
      });

      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1000);
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg("Gagal menyimpan nilai ke server.");
    } finally {
      setLoading(false);
    }
  }

  // Helper untuk merender baris kriteria dengan tombol rubrik combo + input angka
  function renderCriteriaRow(
    label: string,
    maxScore: number,
    currentVal: number,
    setter: (v: number) => void
  ) {
    return (
      <div className="p-3 bg-white border-2 border-black space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase text-black">
            {label} <span className="text-neutral-500 font-normal font-mono">(Max: {maxScore})</span>
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.1"
              min="0"
              max={maxScore}
              value={currentVal}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setter(isNaN(val) ? 0 : Math.min(maxScore, Math.max(0, val)));
              }}
              className="neo-box-sm w-20 px-2 py-1 text-right text-sm font-black font-mono-numbers bg-[#FFFDE7]"
            />
          </div>
        </div>

        {/* Combo Quick-Buttons */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {RUBRIC_PRESETS.map((preset) => {
            const calculatedScore = Number((maxScore * preset.percentage).toFixed(2));
            const isActive = Math.abs(currentVal - calculatedScore) < 0.05;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => setter(calculatedScore)}
                className={`neo-box-sm text-[10px] px-2 py-1 font-bold transition-all cursor-pointer ${
                  isActive ? "bg-black text-[#FFEB3B] font-black scale-105" : "bg-neutral-100 text-black hover:bg-neutral-200"
                }`}
              >
                {preset.label} ({calculatedScore})
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Penilaian Asistensi: ${student.name}`} maxWidth="2xl">
      <div className="space-y-6">
        {/* Info Mahasiswa & Modul */}
        <div className="neo-box-sm bg-[#FFEB3B] p-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-black block">
              {moduleTitle}
            </span>
            <h3 className="text-base font-black text-black">
              {student.name} <span className="font-mono text-neutral-800">({student.nim})</span>
            </h3>
            {student.classGroup && (
              <span className="text-xs font-bold text-neutral-700">{student.classGroup}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-black" />
            <input
              type="date"
              value={asistensiDate}
              onChange={(e) => setAsistensiDate(e.target.value)}
              className="neo-box-sm text-xs font-mono font-bold px-2 py-1 bg-white"
            />
          </div>
        </div>

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

        {/* Live Score Summary Bar */}
        <div className="neo-box bg-neutral-900 text-white p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono-numbers">
          <div className="border-r border-neutral-700 last:border-r-0">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block font-sans">Asistensi Code (55%)</span>
            <span className="text-lg font-black text-[#FFEB3B]">{calc.asistensiSubtotal}</span>
            <span className="text-[10px] text-neutral-500"> / 55</span>
          </div>
          <div className="border-r border-neutral-700 last:border-r-0">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block font-sans">Laporan (35%)</span>
            <span className="text-lg font-black text-[#2196F3]">{calc.reportSubtotal}</span>
            <span className="text-[10px] text-neutral-500"> / 35</span>
          </div>
          <div className="border-r border-neutral-700 last:border-r-0">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block font-sans">Kumpul (10%)</span>
            <span className="text-lg font-black text-emerald-400">{calc.punctuality}</span>
            <span className="text-[10px] text-neutral-500"> / 10</span>
          </div>
          <div className="bg-neutral-800 p-1 neo-box-sm border-white">
            <span className="text-[10px] uppercase font-black text-[#FFEB3B] block font-sans">Total Modul</span>
            <span className="text-xl font-black text-white">{calc.totalScore}</span>
            <span className="text-[10px] text-neutral-400"> / 100</span>
          </div>
        </div>

        {/* Komponen 1: Asistensi Code (55%) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b-2 border-black pb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-black uppercase text-black">
              1. Asistensi Code (Bobot 55%)
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderCriteriaRow("Kesesuaian Tugas", CRITERIA_MAX_SCORES.taskConformity, taskConformity, setTaskConformity)}
            {renderCriteriaRow("Penjelasan Program", CRITERIA_MAX_SCORES.programExplanation, programExplanation, setProgramExplanation)}
            {renderCriteriaRow("Kehadiran Asistensi", CRITERIA_MAX_SCORES.attendance, attendance, setAttendance)}
            {renderCriteriaRow("Sikap & Komunikasi", CRITERIA_MAX_SCORES.attitude, attitude, setAttitude)}
          </div>
        </div>

        {/* Komponen 2: Laporan Resmi (35%) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b-2 border-black pb-1">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <h4 className="text-sm font-black uppercase text-black">
              2. Laporan Resmi (Bobot 35%)
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderCriteriaRow("Kesesuaian Pembahasan", CRITERIA_MAX_SCORES.reportDiscussion, reportDiscussion, setReportDiscussion)}
            {renderCriteriaRow("Kesesuaian Format", CRITERIA_MAX_SCORES.reportFormat, reportFormat, setReportFormat)}
            {renderCriteriaRow("Plagiarisme (Orisinalitas)", CRITERIA_MAX_SCORES.plagiarism, plagiarism, setPlagiarism)}
            {renderCriteriaRow("Kerapian Dokumen", CRITERIA_MAX_SCORES.neatness, neatness, setNeatness)}
          </div>
        </div>

        {/* Komponen 3: Ketepatan Pengumpulan (10%) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b-2 border-black pb-1">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h4 className="text-sm font-black uppercase text-black">
              3. Ketepatan Pengumpulan (Bobot 10%)
            </h4>
          </div>
          {renderCriteriaRow("Ketepatan Waktu / Kelengkapan", CRITERIA_MAX_SCORES.submissionPunctuality, submissionPunctuality, setSubmissionPunctuality)}
        </div>

        {/* Link Tugas & Catatan Asisten */}
        <div className="space-y-3 border-t-2 border-black pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Link Repository GitHub"
              placeholder="https://github.com/..."
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
            <Input
              label="Link Video Demo / Drive"
              placeholder="https://youtube.com/... atau Drive"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1 text-black">
              Catatan Evaluasi / Feedback Asisten
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tuliskan poin revisi atau komentar untuk praktikan..."
              className="neo-input w-full p-2 text-xs font-medium text-black"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex justify-end gap-3 border-t-2 border-black">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="button" variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? "Menyimpan Nilai..." : `Simpan Nilai (${calc.totalScore})`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
