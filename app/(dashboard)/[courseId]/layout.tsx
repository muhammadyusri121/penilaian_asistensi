import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/security";
import { getCourseByIdAction } from "@/features/courses/actions/course.actions";
import { BookOpen, Users, Award, ChevronLeft, Layers } from "lucide-react";

export default async function CourseWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { courseId } = await params;
  const course = await getCourseByIdAction(courseId);

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Course Header Banner */}
      <div className="neo-box bg-[#FFF9F0] p-4 md:p-6 border-b-3 border-black">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Link
              href="/praktikum"
              className="inline-flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-black mb-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kembali ke Katalog Praktikum</span>
            </Link>

            <div className="flex items-center gap-3">
              <span className="neo-box-sm bg-black text-white px-2.5 py-1 text-xs font-mono font-black">
                {course.code}
              </span>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">
                {course.title}
              </h1>
            </div>

            {course.description && (
              <p className="text-xs font-medium text-neutral-600 max-w-3xl">
                {course.description}
              </p>
            )}
          </div>

          {/* Sub Navigation Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto shrink-0">
            <Link href={`/${courseId}/modul`}>
              <button className="neo-btn px-3 py-1.5 bg-white text-xs font-black flex items-center gap-1.5 hover:bg-yellow-100">
                <Layers className="w-3.5 h-3.5 text-[#2196F3]" />
                Modul ({course.modules.length})
              </button>
            </Link>

            <Link href={`/${courseId}/praktikan`}>
              <button className="neo-btn px-3 py-1.5 bg-white text-xs font-black flex items-center gap-1.5 hover:bg-yellow-100">
                <Users className="w-3.5 h-3.5 text-[#4CAF50]" />
                Praktikan
              </button>
            </Link>

            <Link href={`/${courseId}/rekap-nilai`}>
              <button className="neo-btn px-3 py-1.5 bg-white text-xs font-black flex items-center gap-1.5 hover:bg-yellow-100">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                Rekap Nilai
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Course Content */}
      <div>{children}</div>
    </div>
  );
}
