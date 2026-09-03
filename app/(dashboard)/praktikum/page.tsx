import { Metadata } from "next";
import { getSession } from "@/lib/security";
import { redirect } from "next/navigation";
import { getCatalogCoursesAction } from "@/features/courses/actions/course.actions";
import { CourseCatalog } from "@/features/courses/components/course-catalog";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Katalog Mata Kuliah Praktikum | Portal Asistensi",
  description: "Pilih dan ambil mata kuliah praktikum untuk dibina pada semester aktif",
};

export default async function PraktikumPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const courses = await getCatalogCoursesAction();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-3 border-black pb-4">
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black flex items-center gap-3">
          <BookOpen className="w-8 h-8" />
          <span>Katalog Mata Kuliah Praktikum</span>
        </h1>
        <p className="text-xs md:text-sm font-bold text-neutral-600">
          Pilih mata kuliah yang Anda ampu pada semester ini. Modul-modul praktikum telah disiapkan oleh Koordinator Laboratorium.
        </p>
      </div>

      <CourseCatalog courses={courses} userRole={session.role} />
    </div>
  );
}
