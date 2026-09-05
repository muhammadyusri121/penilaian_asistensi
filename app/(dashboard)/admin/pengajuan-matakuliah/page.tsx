import { Metadata } from "next";
import { getSession } from "@/lib/security";
import { redirect } from "next/navigation";
import { getAllCourseProposalsAction } from "@/features/courses/actions/course.actions";
import { CourseProposalManager } from "@/features/admin/components/course-proposal-manager";
import { UserCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "ACC Pengajuan Mata Kuliah & Praktikan | Admin Lab",
  description: "Verifikasi dan ACC pengajuan mata kuliah serta alokasi praktikan asisten",
};

export default async function PengajuanMataKuliahPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/praktikum");
  }

  const proposals = await getAllCourseProposalsAction();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-3 border-black pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-amber-500" />
            <span>ACC Pengajuan Mata Kuliah & Praktikan</span>
          </h1>
          <p className="text-xs md:text-sm font-bold text-neutral-600 mt-1">
            Verifikasi pengajuan mata kuliah yang diambil asprak beserta daftar mahasiswa praktikan binaannya sebelum penilaian asistensi dapat dilakukan.
          </p>
        </div>
      </div>

      {/* Manager Component */}
      <CourseProposalManager proposals={proposals as any} />
    </div>
  );
}
