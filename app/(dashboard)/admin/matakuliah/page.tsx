import { Metadata } from "next";
import Link from "next/link";
import { getCatalogCoursesAction } from "@/features/courses/actions/course.actions";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import { AdminCoursesManager } from "@/features/courses/components/admin-courses-manager";

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

      {/* Grid Mata Kuliah with Delete Action & Captcha */}
      <AdminCoursesManager courses={courses as any} />
    </div>
  );
}

