import { Metadata } from "next";
import { CourseBuilderForm } from "@/features/courses/components/course-builder-form";

export const metadata: Metadata = {
  title: "Buat Mata Kuliah Praktikum | Admin Lab",
  description: "Form penyusunan mata kuliah dan modul dinamis laboratorium",
};

export default function BaruMataKuliahPage() {
  return (
    <div className="space-y-6">
      <CourseBuilderForm />
    </div>
  );
}
