import React from "react";
import { Metadata } from "next";
import { getSession } from "@/lib/security";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCatalogCoursesAction } from "@/features/courses/actions/course.actions";
import { getSemesterSummaryAction } from "@/features/final-grades/actions/final-grades.actions";
import { SemesterTableView } from "@/features/final-grades/components/semester-table-view";
import { Award, BookOpen, Layers, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Rekap Nilai Semua MK | Admin Lab",
  description: "Rekapitulasi nilai akhir semester seluruh praktikan per mata kuliah",
};

interface AdminRekapPageProps {
  searchParams: Promise<{ courseId?: string }>;
}

export default async function AdminRekapNilaiPage({ searchParams }: AdminRekapPageProps) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/praktikum");
  }

  const resolvedParams = await searchParams;
  const courses = await getCatalogCoursesAction();

  if (courses.length === 0) {
    return (
      <div className="neo-box bg-white p-8 text-center space-y-4 max-w-xl mx-auto my-12">
        <Layers className="w-12 h-12 mx-auto text-neutral-400" />
        <h2 className="text-xl font-black uppercase">Belum Ada Mata Kuliah Praktikum</h2>
        <p className="text-xs font-bold text-neutral-600">
          Buat mata kuliah praktikum terlebih dahulu untuk dapat melihat rekapitulasi nilai mahasiswa.
        </p>
        <Link
          href="/admin/matakuliah"
          className="neo-btn inline-block px-4 py-2 bg-[#FFEB3B] text-black text-xs font-black"
        >
          Kelola Master Mata Kuliah
        </Link>
      </div>
    );
  }

  // Pilih course sesuai searchParam atau default ke course pertama
  const selectedCourseId = resolvedParams.courseId || courses[0].id;
  const currentCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const data = await getSemesterSummaryAction(currentCourse.id);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="neo-box bg-[#FFEB3B] p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="neo-box-sm bg-black text-white text-[10px] px-2 py-0.5 font-mono font-bold uppercase flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Rekap Khusus Admin Lab
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black mt-1">
            Rekapitulasi Nilai Akhir Per Mata Kuliah
          </h1>
          <p className="text-xs md:text-sm font-medium text-neutral-800">
            Monitoring seluruh nilai praktikan lintas asisten pembina untuk mata kuliah praktikum terpilih.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/matakuliah"
            className="neo-btn text-xs px-3 py-2 bg-white text-black font-black flex items-center gap-1.5 hover:bg-neutral-100"
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            Master MK
          </Link>
        </div>
      </div>

      {/* Course Selection Tabs / Selector */}
      <div className="neo-box bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2196F3]" />
            Pilih Mata Kuliah Praktikum:
          </label>
          <span className="text-[11px] font-mono font-bold text-neutral-500">
            {courses.length} Mata Kuliah Tersedia
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {courses.map((course) => {
            const isSelected = course.id === currentCourse.id;
            return (
              <Link
                key={course.id}
                href={`/admin/rekap-nilai?courseId=${course.id}`}
                className={`neo-btn text-xs px-3 py-2 font-black transition-all flex items-center gap-2 ${
                  isSelected
                    ? "bg-black text-[#FFEB3B] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5"
                    : "bg-neutral-100 text-black hover:bg-yellow-100"
                }`}
              >
                <span className="font-mono bg-neutral-200 text-neutral-800 px-1 py-0.5 text-[10px] rounded">
                  {course.code}
                </span>
                <span>{course.title}</span>
                <span className="text-[10px] bg-neutral-800 text-white px-1.5 py-0.2 rounded-full font-mono">
                  {course._count?.enrollments ?? 0} Mhs
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Course Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="neo-box-sm bg-white p-3">
          <span className="text-[10px] font-black uppercase text-neutral-500 block">Kode & Mata Kuliah</span>
          <span className="text-sm font-black text-black truncate block mt-0.5">
            {currentCourse.code} - {currentCourse.title}
          </span>
        </div>

        <div className="neo-box-sm bg-white p-3">
          <span className="text-[10px] font-black uppercase text-neutral-500 block">Total Praktikan Terdaftar</span>
          <div className="flex items-center gap-2 mt-0.5">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-lg font-black font-mono-numbers">
              {data?.students.length ?? 0} Mahasiswa
            </span>
          </div>
        </div>

        <div className="neo-box-sm bg-white p-3">
          <span className="text-[10px] font-black uppercase text-neutral-500 block">Total Modul Praktikum</span>
          <div className="flex items-center gap-2 mt-0.5">
            <Layers className="w-4 h-4 text-amber-600" />
            <span className="text-lg font-black font-mono-numbers">
              {currentCourse.modules.length} Modul
            </span>
          </div>
        </div>

        <div className="neo-box-sm bg-white p-3">
          <span className="text-[10px] font-black uppercase text-neutral-500 block">Asisten Pengampu Terdaftar</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-lg font-black font-mono-numbers">
              {currentCourse.assistants.length} Asprak
            </span>
          </div>
        </div>
      </div>

      {/* Table Component */}
      {data ? (
        <SemesterTableView data={data} courseId={currentCourse.id} />
      ) : (
        <div className="p-8 text-center font-bold">
          Gagal memuat rekap nilai mata kuliah ini.
        </div>
      )}
    </div>
  );
}
