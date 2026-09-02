import React from "react";
import { getSemesterSummaryAction } from "@/features/final-grades/actions/final-grades.actions";
import { SemesterTableView } from "@/features/final-grades/components/semester-table-view";
import { Award } from "lucide-react";

export const metadata = {
  title: "Rekap Nilai Semester (100%) | Asistensi Lab",
};

export default async function RekapNilaiPage() {
  const data = await getSemesterSummaryAction();

  if (!data) {
    return (
      <div className="p-8 text-center font-bold">
        Gagal memuat data rekapitulasi semester.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="neo-box bg-[#FFEB3B] p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="neo-box-sm bg-black text-white text-[10px] px-2 py-0.5 font-mono font-bold uppercase flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Rekapitulasi Akhir
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black mt-1">
            Rekap Nilai Akhir Semester (100%)
          </h1>
          <p className="text-xs md:text-sm font-medium text-neutral-800">
            Formula: Kehadiran 12x (10%) + Rata-rata Modul (20%) + Pretest (10%) + UTS (25%) + UAS (35%) = Total (100%) $\rightarrow$ Huruf Mutu.
          </p>
        </div>
      </div>

      <SemesterTableView data={data} />
    </div>
  );
}
