import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/security";
import { getCourseByIdAction, getMyCourseProposalAction } from "@/features/courses/actions/course.actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, ArrowRight, Lock, AlertCircle, Users, Edit3, Sliders } from "lucide-react";

import { CourseModulesManager } from "@/features/modules/components/course-modules-manager";

export const metadata: Metadata = {
  title: "Daftar Modul Praktikum | Workspace",
  description: "Daftar modul praktikum yang telah dirancang oleh Koordinator Laboratorium",
};

export default async function CourseModulPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { courseId } = await params;
  const [course, proposal] = await Promise.all([
    getCourseByIdAction(courseId),
    session.role !== "ADMIN" ? getMyCourseProposalAction(courseId) : null,
  ]);

  if (!course) notFound();

  const isApproved = session.role === "ADMIN" || proposal?.status === "APPROVED";

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-3 border-black pb-3">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <Layers className="w-6 h-6" />
            <span>Kurikulum Modul Praktikum ({course.modules.length} Modul)</span>
          </h2>
          <p className="text-xs font-bold text-neutral-600">
            Pilih modul praktikum di bawah untuk memulai lembar penilaian asistensi mahasiswa binaan Anda.
          </p>
        </div>

        {session.role === "ADMIN" && (
          <Link href={`/admin/matakuliah/${courseId}/edit`}>
            <Button variant="secondary" size="sm" className="bg-yellow-300 hover:bg-yellow-400 text-xs font-black self-start sm:self-auto shrink-0">
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              Edit MK & Modul
            </Button>
          </Link>
        )}
      </div>

      {/* Bobot Penilaian Semester Info Banner */}
      <div className="neo-box-sm bg-white p-3 border-2 border-black flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-black" />
          <span className="text-xs font-black uppercase text-black">
            Bobot Penilaian Semester:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono font-bold">
          <span className="bg-sky-100 text-sky-900 px-2 py-0.5 border border-sky-300">
            Presensi {course.weightAttendance ?? 10}%
          </span>
          <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 border border-emerald-300">
            Tugas {course.weightAssignment ?? 20}%
          </span>
          <span className="bg-amber-100 text-amber-900 px-2 py-0.5 border border-amber-300">
            Pretest {course.weightPretest ?? 10}%
          </span>
          <span className="bg-orange-100 text-orange-900 px-2 py-0.5 border border-orange-300">
            UTS {course.weightUts ?? 25}%
          </span>
          <span className="bg-rose-100 text-rose-900 px-2 py-0.5 border border-rose-300">
            UAS {course.weightUas ?? 35}%
          </span>
          <span className="bg-neutral-800 text-white px-2 py-0.5 font-black">
            Total 100%
          </span>
        </div>
      </div>

      {/* Warning Banner if Not Approved */}
      {!isApproved && (
        <div className="neo-box bg-[#FFF9C4] p-5 border-3 border-black space-y-3">
          <div className="flex items-start gap-3">
            <div className="neo-box-sm bg-[#FF5252] text-white p-2 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-tight text-black flex items-center gap-2">
                <span>Penilaian Asistensi Belum Terbuka</span>
                <span className="neo-box-sm text-[10px] px-2 py-0.5 bg-black text-[#FFEB3B] font-mono">
                  Status: {proposal?.status || "DRAFT"}
                </span>
              </h3>
              <p className="text-xs font-bold text-neutral-700">
                {proposal?.status === "PENDING_APPROVAL"
                  ? "Pengajuan mata kuliah dan daftar praktikan Anda sedang menunggu verifikasi (ACC) dari Koordinator Laboratorium. Tombol penilaian akan aktif otomatis setelah disetujui."
                  : proposal?.status === "REJECTED"
                  ? `Pengajuan Anda memerlukan revisi. Catatan Admin: "${proposal?.notes || "-"}". Harap perbaiki data praktikan dan ajukan ulang.`
                  : "Anda belum mengajukan daftar praktikan binaan kepada Koordinator Lab. Tambahkan data praktikan dan klik tombol 'Ajukan ke Admin' pada menu Data Praktikan."}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t-2 border-neutral-300 flex justify-end">
            <Link
              href={`/${courseId}/praktikan`}
              className="neo-btn px-3 py-2 bg-black text-white text-xs font-black flex items-center gap-2 hover:bg-neutral-800"
            >
              <Users className="w-4 h-4 text-[#FFEB3B]" />
              <span>Kelola & Ajukan Praktikan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Modules Grid with Delete & Captcha Manager */}
      <CourseModulesManager
        courseId={courseId}
        modules={course.modules}
        isApproved={isApproved}
        isAdmin={session.role === "ADMIN"}
      />
    </div>
  );
}
