import { Metadata } from "next";
import { getSession } from "@/lib/security";
import { redirect } from "next/navigation";
import { getAllPeriodsAction } from "@/features/periods/actions/period.actions";
import { PeriodManager } from "@/features/periods/components/period-manager";
import { CalendarRange } from "lucide-react";

export const metadata: Metadata = {
  title: "Kelola Periode Semester | Admin Lab",
  description: "Pengaturan jadwal semester aktif dan batas waktu input mahasiswa praktikum",
};

export default async function AdminPeriodePage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/praktikum");
  }

  const periods = await getAllPeriodsAction();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-3 border-black pb-4">
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black flex items-center gap-3">
          <CalendarRange className="w-8 h-8" />
          <span>Manajemen Periode Semester</span>
        </h1>
        <p className="text-xs md:text-sm font-bold text-neutral-600">
          Atur periode semester aktif dan tentukan batas tanggal buka/tutup pendaftaran serta penginputan praktikan oleh asisten.
        </p>
      </div>

      <PeriodManager periods={periods} />
    </div>
  );
}
