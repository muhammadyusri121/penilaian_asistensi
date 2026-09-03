import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseByIdAction } from "@/features/courses/actions/course.actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, ArrowRight, CheckCircle2, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Daftar Modul Praktikum | Workspace",
  description: "Daftar modul praktikum yang telah dirancang oleh Koordinator Laboratorium",
};

export default async function CourseModulPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseByIdAction(courseId);

  if (!course) notFound();

  return (
    <div className="space-y-6">
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
                <Link href={`/${courseId}/penilaian/${mod.id}`} className="w-full">
                  <Button variant="primary" size="sm" className="w-full text-xs">
                    <span>Mulai Penilaian</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
