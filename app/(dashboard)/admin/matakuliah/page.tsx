import { Metadata } from "next";
import Link from "next/link";
import { getCatalogCoursesAction } from "@/features/courses/actions/course.actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Plus, Users, Layers, GraduationCap, Edit3, Award, Sliders } from "lucide-react";

export const metadata: Metadata = {
  title: "Master Mata Kuliah & Modul | Admin Lab",
  description: "Daftar seluruh mata kuliah praktikum dan kurikulum modul laboratorium",
};

export default async function AdminMataKuliahPage() {
  const courses = await getCatalogCoursesAction();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-3 border-black pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            <span>Master Mata Kuliah Praktikum</span>
          </h1>
          <p className="text-xs md:text-sm font-bold text-neutral-600">
            Kelola kurikulum mata kuliah dan daftar modul praktikum yang aktif di laboratorium.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/matakuliah/baru">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-1.5" />
              Buat Mata Kuliah Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid Mata Kuliah */}
      {courses.length === 0 ? (
        <div className="neo-box bg-white p-12 text-center">
          <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <h3 className="text-lg font-black uppercase">Belum Ada Mata Kuliah</h3>
          <p className="text-xs font-bold text-neutral-600 mb-6">
            Buat mata kuliah praktikum pertama dan tentukan modul-modul di dalamnya.
          </p>
          <Link href="/admin/matakuliah/baru">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-1.5" />
              Buat Mata Kuliah Sekarang
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col justify-between">
              <div>
                <div className="p-4 border-b-3 border-black bg-[#FFF9F0] flex items-center justify-between">
                  <span className="neo-box-sm bg-black text-white px-2.5 py-1 text-xs font-mono font-black">
                    {course.code}
                  </span>
                  <span className="text-xs font-bold text-neutral-500 uppercase">
                    {course.academicPeriod.name}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  {(course.scheduleDay || course.scheduleTime) && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#E0F2FE] border-2 border-black text-xs font-black text-black">
                      <span>🗓️ {course.scheduleDay || "Hari ?"}</span>
                      {course.scheduleTime && <span>• ⏰ {course.scheduleTime}</span>}
                    </div>
                  )}
                  <h3 className="text-lg font-black tracking-tight text-black line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-xs font-medium text-neutral-600 line-clamp-2 min-h-[32px]">
                    {course.description || "Tidak ada deskripsi."}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t-2 border-dashed border-neutral-300">
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase block">Modul</span>
                      <span className="text-sm font-black font-mono-numbers">{course._count.modules}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase block">Asprak</span>
                      <span className="text-sm font-black font-mono-numbers">{course._count.assistants}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase block">Praktikan</span>
                      <span className="text-sm font-black font-mono-numbers">{course._count.enrollments}</span>
                    </div>
                  </div>

                    {/* Bobot Penilaian Semester */}
                    <div className="p-2 bg-neutral-100 border border-neutral-300 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-neutral-600">
                        <span className="flex items-center gap-1">
                          <Sliders className="w-3 h-3 text-black" />
                          Bobot Semester:
                        </span>
                        <span className="text-emerald-700 font-mono">100%</span>
                      </div>
                      <div className="flex flex-wrap gap-1 text-[9px] font-bold">
                        <span className="bg-sky-100 text-sky-900 px-1 py-0.2 border border-sky-300">
                          Presensi {course.weightAttendance ?? 10}%
                        </span>
                        <span className="bg-emerald-100 text-emerald-900 px-1 py-0.2 border border-emerald-300">
                          Tugas {course.weightAssignment ?? 20}%
                        </span>
                        <span className="bg-amber-100 text-amber-900 px-1 py-0.2 border border-amber-300">
                          Pretest {course.weightPretest ?? 10}%
                        </span>
                        <span className="bg-orange-100 text-orange-900 px-1 py-0.2 border border-orange-300">
                          UTS {course.weightUts ?? 25}%
                        </span>
                        <span className="bg-rose-100 text-rose-900 px-1 py-0.2 border border-rose-300">
                          UAS {course.weightUas ?? 35}%
                        </span>
                      </div>
                    </div>

                  {/* Preview Daftar Modul */}
                  <div className="pt-1">
                    <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">
                      Modul ({course.modules.length}):
                    </span>
                    <ul className="text-xs font-medium text-neutral-700 space-y-1">
                      {course.modules.slice(0, 4).map((mod) => (
                        <li key={mod.id} className="truncate flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-black rounded-none shrink-0" />
                          <span className="truncate">{mod.title}</span>
                          {mod.isFinalReport && (
                            <span className="neo-box-sm bg-[#FF5252] text-white text-[9px] px-1 font-black shrink-0">
                              Akhir
                            </span>
                          )}
                        </li>
                      ))}
                      {course.modules.length > 4 && (
                        <li className="text-[10px] font-bold text-neutral-500 italic">
                          +{course.modules.length - 4} modul lainnya...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t-3 border-black bg-neutral-50 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Link href={`/${course.id}/praktikan`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full text-xs">
                      Buka Ruang Kerja
                    </Button>
                  </Link>
                  <Link href={`/admin/matakuliah/${course.id}/edit`}>
                    <Button variant="secondary" size="sm" className="text-xs bg-yellow-300 hover:bg-yellow-400">
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      Edit MK & Modul
                    </Button>
                  </Link>
                </div>
                <Link href={`/admin/rekap-nilai?courseId=${course.id}`} className="w-full">
                  <button className="w-full neo-btn text-[11px] py-1 bg-white text-black font-black flex items-center justify-center gap-1 hover:bg-neutral-100">
                    <Award className="w-3 h-3 text-amber-600" />
                    Lihat Rekap Nilai MK Ini
                  </button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
