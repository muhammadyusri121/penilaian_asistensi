import React from "react";
import { getModulesAction } from "@/features/modules/actions/module.actions";
import { getStudentsAction } from "@/features/students/actions/student.actions";
import { Card } from "@/components/ui/card";
import { BookOpen, ArrowRight, Sparkles, Award } from "lucide-react";

export const metadata = {
  title: "Modul Praktikum & Penilaian | Asistensi Lab",
};

export default async function ModulesPage() {
  const [modules, students] = await Promise.all([
    getModulesAction(),
    getStudentsAction(),
  ]);

  const totalStudents = students.length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="neo-box bg-[#FFEB3B] p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="neo-box-sm bg-black text-white text-[10px] px-2 py-0.5 font-mono font-bold uppercase">
            Workspace Asisten
          </span>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black mt-1">
            Daftar Modul Praktikum
          </h1>
          <p className="text-xs md:text-sm font-medium text-neutral-800">
            Pilih modul untuk menilai asistensi kode (55%), laporan resmi (35%), dan pengumpulan (10%).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="neo-box-sm bg-white p-3 text-center min-w-[110px]">
            <span className="text-xs font-bold text-neutral-500 uppercase block">Total Praktikan</span>
            <span className="text-2xl font-black font-mono-numbers text-black">{totalStudents}</span>
          </div>
          <div className="neo-box-sm bg-white p-3 text-center min-w-[110px]">
            <span className="text-xs font-bold text-neutral-500 uppercase block">Modul Aktif</span>
            <span className="text-2xl font-black font-mono-numbers text-[#2196F3]">{modules.length}</span>
          </div>
        </div>
      </div>

      {/* Grid of Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((mod) => {
          const isFinal = mod.isFinalReport;
          const cardHeaderColor = isFinal ? "bg-[#FF5252] text-white" : "bg-white text-black";

          return (
            <Card
              key={mod.id}
              className="flex flex-col justify-between hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform duration-100"
            >
              <div>
                <div className={`p-4 border-b-3 border-black flex items-center justify-between ${cardHeaderColor}`}>
                  <div className="flex items-center gap-2">
                    <span className="neo-box-sm px-2 py-0.5 bg-black text-[#FFEB3B] font-mono text-xs font-black">
                      #{mod.orderIndex}
                    </span>
                    {isFinal && (
                      <span className="neo-box-sm px-1.5 py-0.5 bg-[#FFEB3B] text-black text-[10px] font-black uppercase flex items-center gap-1">
                        <Award className="w-3 h-3" /> Final
                      </span>
                    )}
                  </div>
                  <BookOpen className="w-5 h-5" />
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="text-base font-black uppercase tracking-tight text-black line-clamp-2">
                    {mod.title}
                  </h3>
                  {mod.description && (
                    <p className="text-xs text-neutral-600 line-clamp-2">{mod.description}</p>
                  )}
                  <div className="pt-2 flex items-center justify-between text-xs font-bold text-neutral-500 font-mono-numbers">
                    <span>Terdata dinilai:</span>
                    <span className="font-black text-black bg-neutral-100 px-2 py-0.5 neo-box-sm">
                      {mod._count.submissions} / {totalStudents} Mahasiswa
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0">
                <a
                  href={`/penilaian/${mod.id}`}
                  className="neo-btn w-full py-2.5 bg-[#2196F3] text-white text-xs font-black flex items-center justify-center gap-2 hover:bg-[#1E88E5]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Mulai Penilaian
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
