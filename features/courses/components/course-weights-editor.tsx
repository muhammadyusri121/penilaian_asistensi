"use client";

import React from "react";
import { Sliders, RotateCcw, AlertTriangle, CheckCircle2, Info } from "lucide-react";

export interface CourseWeights {
  weightAttendance: number;
  weightAssignment: number;
  weightPretest: number;
  weightUts: number;
  weightUas: number;
}

export const DEFAULT_COURSE_WEIGHTS: CourseWeights = {
  weightAttendance: 10,
  weightAssignment: 20,
  weightPretest: 10,
  weightUts: 25,
  weightUas: 35,
};

interface ComponentMeta {
  key: keyof CourseWeights;
  name: string;
  code: string;
  description: string;
  colorClass: string;
  badgeBg: string;
  textColor: string;
}

const COMPONENTS: ComponentMeta[] = [
  {
    key: "weightAttendance",
    name: "Presensi / Kehadiran",
    code: "PRESENSI",
    description: "Rata-rata kehadiran praktikan dari 12 sesi pertemuan",
    colorClass: "bg-sky-500",
    badgeBg: "bg-sky-100 border-sky-600 text-sky-900",
    textColor: "text-sky-700",
  },
  {
    key: "weightAssignment",
    name: "Tugas & Laporan Modul",
    code: "TUGAS",
    description: "Rata-rata akumulasi seluruh modul asistensi dinamis",
    colorClass: "bg-emerald-500",
    badgeBg: "bg-emerald-100 border-emerald-600 text-emerald-900",
    textColor: "text-emerald-700",
  },
  {
    key: "weightPretest",
    name: "Pretest Praktikum",
    code: "PRETEST",
    description: "Rata-rata skor pretest kuis sebelum praktikum",
    colorClass: "bg-amber-500",
    badgeBg: "bg-amber-100 border-amber-600 text-amber-900",
    textColor: "text-amber-700",
  },
  {
    key: "weightUts",
    name: "Ujian Tengah Semester (UTS)",
    code: "UTS",
    description: "Nilai murni evaluasi tengah semester",
    colorClass: "bg-orange-500",
    badgeBg: "bg-orange-100 border-orange-600 text-orange-900",
    textColor: "text-orange-700",
  },
  {
    key: "weightUas",
    name: "Ujian Akhir Semester (UAS)",
    code: "UAS",
    description: "Nilai murni evaluasi akhir semester",
    colorClass: "bg-rose-500",
    badgeBg: "bg-rose-100 border-rose-600 text-rose-900",
    textColor: "text-rose-700",
  },
];

interface CourseWeightsEditorProps {
  weights: CourseWeights;
  onChange: (weights: CourseWeights) => void;
  disabled?: boolean;
}

export function CourseWeightsEditor({
  weights,
  onChange,
  disabled = false,
}: CourseWeightsEditorProps) {
  const currentTotal =
    (weights.weightAttendance || 0) +
    (weights.weightAssignment || 0) +
    (weights.weightPretest || 0) +
    (weights.weightUts || 0) +
    (weights.weightUas || 0);

  const roundedTotal = Math.round(currentTotal * 100) / 100;
  const remaining = Math.max(0, Math.round((100 - roundedTotal) * 100) / 100);
  const isExact100 = Math.abs(roundedTotal - 100) < 0.01;
  const isOver100 = roundedTotal > 100;

  function handleAdjust(key: keyof CourseWeights, delta: number) {
    if (disabled) return;
    const currentVal = weights[key] || 0;

    if (delta > 0) {
      // Tidak bisa menambah melebihi kuota sisa yang belum dialokasikan
      const addable = Math.min(delta, remaining);
      if (addable <= 0) return;
      const nextVal = Math.round((currentVal + addable) * 100) / 100;
      onChange({ ...weights, [key]: nextVal });
    } else {
      // Mengurangi komponen untuk membuka kuota bagi komponen lain
      const reducable = Math.min(Math.abs(delta), currentVal);
      if (reducable <= 0) return;
      const nextVal = Math.round((currentVal - reducable) * 100) / 100;
      onChange({ ...weights, [key]: nextVal });
    }
  }

  function handleDirectInput(key: keyof CourseWeights, rawStr: string) {
    if (disabled) return;
    const currentVal = weights[key] || 0;
    const parsed = parseFloat(rawStr);

    if (isNaN(parsed)) {
      onChange({ ...weights, [key]: 0 });
      return;
    }

    // Maksimal yang diperbolehkan untuk field ini = currentVal + sisa kuota (100 - total)
    const maxAllowed = Math.round((currentVal + remaining) * 100) / 100;
    const clamped = Math.max(0, Math.min(maxAllowed, parsed));
    onChange({ ...weights, [key]: clamped });
  }

  function handleResetDefault() {
    if (disabled) return;
    onChange({ ...DEFAULT_COURSE_WEIGHTS });
  }

  return (
    <div className="neo-box bg-white p-5 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-4">
        <div className="flex items-center gap-2.5">
          <div className="neo-box-sm bg-[#00E5FF] p-2">
            <Sliders className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black uppercase tracking-tight text-black flex items-center gap-2">
              Kustomisasi Bobot Penilaian Semester
            </h3>
            <p className="text-xs font-bold text-neutral-600">
              Khusus kelas mata kuliah ini • Total wajib tepat 100%
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetDefault}
          disabled={disabled}
          className="neo-box-sm bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Default (10:20:10:25:35)
        </button>
      </div>

      {/* Info Rule Box */}
      <div className="neo-box-sm bg-[#FFFDE7] p-3 text-xs font-bold text-neutral-800 flex items-start gap-2 border-2 border-black">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-black uppercase">Aturan Sistem:</strong> Total persentase maksimal adalah <strong>100%</strong>. Untuk menaikkan salah satu bobot (misal Pretest dinaikkan menjadi 20%), <strong>kurangi terlebih dahulu bobot komponen lain</strong> agar tersedia sisa kuota, lalu tambahkan ke komponen yang diinginkan.
        </div>
      </div>

      {/* Visual Stacked Bar Chart of 100% Breakdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
          <span>Distribusi Proporsi Penilaian</span>
          <span className={isExact100 ? "text-emerald-700" : isOver100 ? "text-rose-600" : "text-amber-700"}>
            Total: {roundedTotal}% / 100%
          </span>
        </div>

        {/* The Bar */}
        <div className="h-6 w-full bg-neutral-200 border-2 border-black rounded flex overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {COMPONENTS.map((c) => {
            const val = weights[c.key] || 0;
            if (val <= 0) return null;
            return (
              <div
                key={c.key}
                style={{ width: `${val}%` }}
                className={`${c.colorClass} h-full border-r border-black flex items-center justify-center text-[10px] font-black text-black select-none truncate transition-all duration-200`}
                title={`${c.name}: ${val}%`}
              >
                {val >= 7 ? `${val}%` : ""}
              </div>
            );
          })}
          {remaining > 0 && (
            <div
              style={{ width: `${remaining}%` }}
              className="bg-neutral-300 h-full flex items-center justify-center text-[10px] font-bold text-neutral-600 select-none truncate pattern-diagonal-lines"
              title={`Belum teralokasi: ${remaining}%`}
            >
              {remaining >= 8 ? `+${remaining}%` : ""}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-bold">
          {COMPONENTS.map((c) => (
            <div key={c.key} className="flex items-center gap-1">
              <span className={`w-3 h-3 border border-black ${c.colorClass} inline-block`} />
              <span>{c.code} ({weights[c.key]}%)</span>
            </div>
          ))}
          {remaining > 0 && (
            <div className="flex items-center gap-1 text-amber-700">
              <span className="w-3 h-3 border border-black bg-neutral-300 inline-block" />
              <span>Sisa Kuota ({remaining}%)</span>
            </div>
          )}
        </div>
      </div>

      {/* Live Status Banner */}
      {isExact100 ? (
        <div className="neo-box-sm bg-[#E8F5E9] text-emerald-900 border-emerald-700 p-3 flex items-center justify-between text-xs font-black">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>TOTAL 100% VALID — Formulir siap disimpan.</span>
          </div>
          <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-black">
            PAS 100%
          </span>
        </div>
      ) : remaining > 0 ? (
        <div className="neo-box-sm bg-[#FFF8E1] text-amber-900 border-amber-600 p-3 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>
              Total baru <strong>{roundedTotal}%</strong>. Tersedia <strong>{remaining}%</strong> yang dapat dialokasikan ke komponen lain.
            </span>
          </div>
          <span className="bg-amber-400 text-black px-2 py-0.5 rounded text-[10px] font-black border border-black">
            SISA {remaining}%
          </span>
        </div>
      ) : (
        <div className="neo-box-sm bg-[#FFEBEE] text-rose-900 border-rose-600 p-3 flex items-center gap-2 text-xs font-black">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Total bobot melebihi 100% ({roundedTotal}%)! Harap kurangi salah satu komponen.</span>
        </div>
      )}

      {/* Component Rows */}
      <div className="space-y-3">
        {COMPONENTS.map((item) => {
          const val = weights[item.key] || 0;
          const canAdd = remaining > 0;
          const canSubtract = val > 0;

          return (
            <div
              key={item.key}
              className="neo-box-sm bg-white p-3 md:p-4 border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50 transition-colors"
            >
              {/* Left: Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 border border-black ${item.colorClass}`} />
                  <span className="text-xs md:text-sm font-black uppercase text-black">
                    {item.name}
                  </span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 border rounded ${item.badgeBg}`}>
                    {val}%
                  </span>
                </div>
                <p className="text-[11px] font-bold text-neutral-500 pl-5">
                  {item.description}
                </p>
              </div>

              {/* Right: Controller */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {/* Steppers Minus */}
                <button
                  type="button"
                  disabled={disabled || !canSubtract}
                  onClick={() => handleAdjust(item.key, -5)}
                  className="neo-box-sm bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1 text-xs font-black text-black cursor-pointer"
                  title="Kurangi 5%"
                >
                  -5%
                </button>
                <button
                  type="button"
                  disabled={disabled || !canSubtract}
                  onClick={() => handleAdjust(item.key, -1)}
                  className="neo-box-sm bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1 text-xs font-black text-black cursor-pointer"
                  title="Kurangi 1%"
                >
                  -1%
                </button>

                {/* Direct Number Input */}
                <div className="relative w-20">
                  <input
                    type="number"
                    min={0}
                    max={val + remaining}
                    step={1}
                    disabled={disabled}
                    value={val}
                    onChange={(e) => handleDirectInput(item.key, e.target.value)}
                    className="w-full text-center font-black text-sm border-2 border-black py-1 px-1 bg-white focus:bg-yellow-50 focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                  <span className="absolute right-2 top-1.5 text-xs font-black text-neutral-400 pointer-events-none">
                    %
                  </span>
                </div>

                {/* Steppers Plus */}
                <button
                  type="button"
                  disabled={disabled || !canAdd}
                  onClick={() => handleAdjust(item.key, 1)}
                  className="neo-box-sm bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1 text-xs font-black text-black cursor-pointer"
                  title={canAdd ? "Tambah 1%" : "Total sudah 100%. Kurangi komponen lain dulu"}
                >
                  +1%
                </button>
                <button
                  type="button"
                  disabled={disabled || remaining < 5}
                  onClick={() => handleAdjust(item.key, 5)}
                  className="neo-box-sm bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1 text-xs font-black text-black cursor-pointer"
                  title={remaining >= 5 ? "Tambah 5%" : "Sisa kuota tidak cukup. Kurangi komponen lain dulu"}
                >
                  +5%
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
