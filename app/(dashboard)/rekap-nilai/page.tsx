import React from "react";
import { Metadata } from "next";
import { getSession } from "@/lib/security";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getMyAssignedCoursesAction } from "@/features/courses/actions/course.actions";
import { getSemesterSummaryAction } from "@/features/final-grades/actions/final-grades.actions";
import { SemesterTableView } from "@/features/final-grades/components/semester-table-view";
import { Award, BookOpen, Clock, Layers, Sliders, Users, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Rekap Nilai Semester (100%) | Portal Asistensi",
  description: "Rekapitulasi nilai akhir praktikan untuk mata kuliah yang Anda ampu",
};

interface RekapNilaiPageProps {
  searchParams: Promise<{ courseId?: string }>;
}

export default async function RekapNilaiPage({ searchParams }: RekapNilaiPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Jika admin mengakses rute ini, arahkan ke rekap admin
  if (session.role === "ADMIN") {
    redirect("/admin/rekap-nilai");
  }

  const resolvedParams = await searchParams;
  const myCourses = await getMyAssignedCoursesAction();

  // Jika asprak belum mengambil / ditugaskan pada mata kuliah apapun
  if (myCourses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="neo-box bg-[#FFEB3B] p-6">
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
            Kalkulasi nilai akhir seluruh praktikan binaan Anda berdasarkan mata kuliah praktikum yang diambil.
          </p>
        </div>

        <div className="neo-box bg-white p-10 text-center space-y-4 max-w-xl mx-auto my-8 border-3 border-black">
          <div className="w-16 h-16 bg-[#FFF9C4] border-2 border-black rounded-none flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <BookOpen className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black">
            Belum Ada Mata Kuliah yang Diambil
          </h2>
          <p className="text-xs font-bold text-neutral-600 leading-relaxed max-w-md mx-auto">
            Anda belum memilih atau ditugaskan pada mata kuliah praktikum apapun di semester ini.
            Silakan pilih mata kuliah terlebih dahulu di menu Katalog Praktikum untuk mulai mengelola praktikan dan rekap nilai.
          </p>
          <div className="pt-2">
            <Link
              href="/praktikum"
              className="neo-btn inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFEB3B] text-black text-xs font-black hover:bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <BookOpen className="w-4 h-4" />
              Pilih Mata Kuliah Praktikum
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pilih course sesuai searchParam atau default ke course pertama yang diambil asprak
  const selectedCourseId = resolvedParams.courseId || myCourses[0].id;
  const currentCourse = myCourses.find((c) => c.id === selectedCourseId) || myCourses[0];

  const data = await getSemesterSummaryAction(currentCourse.id);

  if (!data) {
    return (
      <div className="neo-box bg-white p-8 text-center font-bold">
        Gagal memuat data rekapitulasi semester untuk mata kuliah ini.
      </div>
    );
  }

  const wAttendance = currentCourse.weightAttendance ?? 10;
  const wAssignment = currentCourse.weightAssignment ?? 20;
  const wPretest = currentCourse.weightPretest ?? 10;
  const wUts = currentCourse.weightUts ?? 25;
  const wUas = currentCourse.weightUas ?? 35;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="neo-box bg-[#FFEB3B] p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="neo-box-sm bg-black text-white text-[10px] px-2 py-0.5 font-mono font-bold uppercase flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Rekapitulasi Akhir • Asprak
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black mt-1">
            Rekap Nilai Akhir Semester (100%)
          </h1>
          <p className="text-xs md:text-sm font-medium text-neutral-800">
            Formula MK {currentCourse.code}: Presensi ({wAttendance}%) + Tugas ({wAssignment}%) + Pretest ({wPretest}%) + UTS ({wUts}%) + UAS ({wUas}%) = 100% → Huruf Mutu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${currentCourse.id}/modul`}
            className="neo-btn text-xs px-3 py-2 bg-white text-black font-black flex items-center gap-1.5 hover:bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <ExternalLink className="w-4 h-4 text-blue-600" />
            Buka Ruang Praktikum
          </Link>
        </div>
      </div>

      {/* Selector Mata Kuliah yang Diambil Asprak */}
      <div className="neo-box bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2196F3]" />
            Mata Kuliah Praktikum Binaan Anda:
          </label>
          <span className="text-[11px] font-mono font-bold text-neutral-500">
            {myCourses.length} Mata Kuliah Diambil
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {myCourses.map((course) => {
            const isSelected = course.id === currentCourse.id;
            return (
              <Link
                key={course.id}
                href={`/rekap-nilai?courseId=${course.id}`}
                className={`neo-box-sm px-3.5 py-2 text-xs font-black transition-all flex items-center gap-2 border-2 border-black ${
                  isSelected
                    ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                    : "bg-neutral-100 text-black hover:bg-neutral-200"
                }`}
              >
                <span className={`font-mono px-1.5 py-0.5 text-[10px] font-bold ${
                  isSelected ? "bg-neutral-800 text-yellow-300" : "bg-neutral-200 text-black"
                }`}>
                  {course.code}
                </span>
                <span>{course.title}</span>
                {(course.scheduleDay || course.scheduleTime) && (
                  <span className={`text-[10px] font-bold px-1 rounded ${
                    isSelected ? "bg-neutral-700 text-white" : "text-neutral-600"
                  }`}>
                    {course.scheduleDay ? `🗓️ ${course.scheduleDay}` : ""}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Info Card Mata Kuliah Terpilih */}
      <div className="neo-box bg-white p-4 border-3 border-black space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="neo-box-sm bg-black text-white text-xs px-2.5 py-1 font-mono font-black">
              {currentCourse.code}
            </span>
            <div>
              <h2 className="text-base font-black text-black">{currentCourse.title}</h2>
              <span className="text-xs text-neutral-600 font-medium">
                {currentCourse.academicPeriod?.name || "Periode Aktif"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(currentCourse.scheduleDay || currentCourse.scheduleTime) && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E0F2FE] border-2 border-black text-xs font-black text-black">
                <Clock className="w-3.5 h-3.5 text-blue-700" />
                <span>{currentCourse.scheduleDay || "Hari ?"}</span>
                {currentCourse.scheduleTime && <span>• {currentCourse.scheduleTime}</span>}
              </div>
            )}
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#E8F5E9] border-2 border-black text-xs font-black text-black">
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              <span>{data.students.length} Praktikan Binaan</span>
            </div>
          </div>
        </div>

        {/* Bobot Penilaian Semester Info */}
        <div className="p-2.5 bg-neutral-50 border-2 border-neutral-300 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-neutral-700">
            <Sliders className="w-3.5 h-3.5 text-black" />
            <span>Bobot Penilaian Semester:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold">
            <span className="bg-sky-100 text-sky-900 px-2 py-0.5 border border-sky-300">
              Presensi {wAttendance}%
            </span>
            <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 border border-emerald-300">
              Tugas {wAssignment}%
            </span>
            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 border border-amber-300">
              Pretest {wPretest}%
            </span>
            <span className="bg-orange-100 text-orange-900 px-2 py-0.5 border border-orange-300">
              UTS {wUts}%
            </span>
            <span className="bg-rose-100 text-rose-900 px-2 py-0.5 border border-rose-300">
              UAS {wUas}%
            </span>
            <span className="bg-black text-white px-2 py-0.5 font-mono">
              Total 100%
            </span>
          </div>
        </div>
      </div>

      {/* Tabel Nilai Akhir Semester */}
      <SemesterTableView data={data} courseId={currentCourse.id} />
    </div>
  );
}
