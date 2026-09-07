"use client";

import React from "react";
import { Clock, Lock, Unlock } from "lucide-react";
import {
  formatIndoDateTime,
  getRemainingDaysText,
} from "../lib/period-date.utils";

interface PeriodWindowSectionProps {
  title: string;
  isOpen: boolean;
  openDescription: string;
  closeDescription: string;
  autoCloseDate?: Date | string | null;
  onOpenAutoCloseModal: () => void;
  openDays: number | "custom";
  setOpenDays: (days: number | "custom") => void;
  customCloseDate: string;
  setCustomCloseDate: (date: string) => void;
  isActionLoading: boolean;
  actionType: "open" | "close" | null;
  onToggle: (action: "open" | "close") => void;
}

export function PeriodWindowSection({
  title,
  isOpen,
  openDescription,
  closeDescription,
  autoCloseDate,
  onOpenAutoCloseModal,
  openDays,
  setOpenDays,
  customCloseDate,
  setCustomCloseDate,
  isActionLoading,
  actionType,
  onToggle,
}: PeriodWindowSectionProps) {
  return (
    <div
      className={`neo-box p-4 flex flex-col justify-between border-3 border-black transition-colors ${
        isOpen ? "bg-[#F0FDF4]" : "bg-white"
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-black">
            {title}
          </span>
          {isOpen ? (
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
          {isOpen ? openDescription : closeDescription}
        </p>

        {isOpen ? (
          <div className="neo-box-sm bg-white p-3 space-y-1.5 border-2 border-black">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-black">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Tutup Otomatis:</span>
              </div>
              <span className="neo-box-sm bg-amber-300 text-black px-2 py-0.5 text-xs font-black border-2 border-black shrink-0">
                ⏳ {getRemainingDaysText(autoCloseDate)}
              </span>
            </div>
            <p className="text-xs font-bold text-neutral-800 font-mono pl-5">
              {formatIndoDateTime(autoCloseDate)}
            </p>
            <div className="pt-1 pl-5">
              <button
                type="button"
                onClick={onOpenAutoCloseModal}
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
                  onClick={() => setOpenDays(days)}
                  className={`px-2 py-1 text-xs font-black border-2 border-black cursor-pointer ${
                    openDays === days
                      ? "bg-black text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-white text-black hover:bg-neutral-100"
                  }`}
                >
                  {days} Hari
                </button>
              ))}
              <button
                type="button"
                onClick={() => setOpenDays("custom")}
                className={`px-2 py-1 text-xs font-black border-2 border-black cursor-pointer ${
                  openDays === "custom"
                    ? "bg-black text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    : "bg-white text-black hover:bg-neutral-100"
                }`}
              >
                Pilih Waktu...
              </button>
            </div>

            {openDays === "custom" && (
              <div className="pt-1">
                <label className="text-[10px] font-black text-neutral-600 block mb-1">
                  Tutup Otomatis Pada:
                </label>
                <input
                  type="datetime-local"
                  value={customCloseDate}
                  onChange={(e) => setCustomCloseDate(e.target.value)}
                  className="w-full text-xs p-1.5 border-2 border-black font-mono font-bold bg-white"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="pt-4 border-t-2 border-dashed border-neutral-300 mt-4">
        {isOpen ? (
          <button
            type="button"
            disabled={isActionLoading && actionType === "close"}
            onClick={() => onToggle("close")}
            className="w-full neo-btn py-2.5 bg-[#FF5252] text-white border-2 border-black font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            {isActionLoading && actionType === "close"
              ? "Menutup..."
              : "TUTUP JENDELA SEKARANG"}
          </button>
        ) : (
          <button
            type="button"
            disabled={isActionLoading && actionType === "open"}
            onClick={() => onToggle("open")}
            className="w-full neo-btn py-2.5 bg-[#4CAF50] text-black border-2 border-black font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-[#43A047] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
          >
            <Unlock className="w-4 h-4" />
            {isActionLoading && actionType === "open"
              ? "Membuka..."
              : "BUKA JENDELA SEKARANG"}
          </button>
        )}
      </div>
    </div>
  );
}
