import React from "react";
import { getSemesterSummaryAction } from "@/features/final-grades/actions/final-grades.actions";
import { SemesterTableView } from "@/features/final-grades/components/semester-table-view";
import { Award } from "lucide-react";

export const metadata = {
  title: "Rekap Nilai Semester | Workspace Praktikum",
  description: "Rekapitulasi nilai akhir praktikan untuk mata kuliah praktikum ini",
};

export default async function CourseRekapNilaiPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const data = await getSemesterSummaryAction(courseId);

  if (!data) {
    return (
      <div className="neo-box bg-white p-8 text-center font-bold">
        Gagal memuat data rekapitulasi nilai praktikum.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b-3 border-black pb-3">
        <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-600" />
          <span>Rekap Nilai Akhir Semester (100%)</span>
        </h2>
        <p className="text-xs font-bold text-neutral-600">
          Kalkulasi otomatis dari Kehadiran 12x (10%) + Rata-rata Modul (20%) + Pretest (10%) + UTS (25%) + UAS (35%).
        </p>
      </div>

      <SemesterTableView data={data} />
    </div>
  );
}
