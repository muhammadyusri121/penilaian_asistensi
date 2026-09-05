import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/security";
import { getCourseByIdAction, getMyCourseProposalAction } from "@/features/courses/actions/course.actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, ArrowRight, Lock, AlertCircle, Users } from "lucide-react";

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
      <div className="flex items-center justify-between border-b-3 border-black pb-3">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <Layers className="w-6 h-6" />
            <span>Kurikulum Modul Praktikum ({course.modules.length} Modul)</span>
          </h2>
          <p className="text-xs font-bold text-neutral-600">
            Pilih modul praktikum di bawah untuk memulai lembar penilaian asistensi mahasiswa binaan Anda.
          </p>
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

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {course.modules.map((mod) => {
          const isFinal = mod.isFinalReport;
          const headerBg = isFinal ? "bg-[#FF5252] text-white" : "bg-white text-black";

          return (
            <Card key={mod.id} className="flex flex-col justify-between">
              <div>
                <div className={`p-4 border-b-3 border-black flex items-center justify-between ${headerBg}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 border-2 border-black bg-white text-black flex items-center justify-center font-mono font-black text-xs shrink-0">
                      {mod.orderIndex}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider">
                      {isFinal ? "Laporan Akhir" : `Modul ${mod.orderIndex}`}
                    </span>
                  </div>

                  {isFinal && (
                    <span className="neo-box-sm text-[9px] px-1.5 py-0.5 bg-black text-white font-black uppercase">
                      Final
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="text-base font-black text-black leading-snug">
                    {mod.title}
                  </h3>
                  <p className="text-xs font-medium text-neutral-600">
                    {mod.description || "Asistensi kode sumber dan pemeriksaan laporan resmi."}
                  </p>
                </div>
              </div>

              <div className="p-4 border-t-3 border-black bg-neutral-50">
                {isApproved ? (
                  <Link href={`/${courseId}/penilaian/${mod.id}`} className="w-full">
                    <Button variant="primary" size="sm" className="w-full text-xs">
                      <span>Mulai Penilaian</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/${courseId}/praktikan`} className="w-full">
                    <Button variant="secondary" size="sm" className="w-full text-xs opacity-75">
                      <Lock className="w-3.5 h-3.5 mr-1.5" />
                      <span>Terkunci (Belum ACC)</span>
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
