import React from "react";
import { getCourseByIdAction } from "@/features/courses/actions/course.actions";
import { CourseEditForm } from "@/features/courses/components/course-edit-form";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Mata Kuliah & Modul | Admin Lab",
  description: "Form edit nama mata kuliah dan judul modul praktikum",
};

export default async function AdminEditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseByIdAction(courseId);

  if (!course) {
    notFound();
  }

  return <CourseEditForm course={course} />;
}
