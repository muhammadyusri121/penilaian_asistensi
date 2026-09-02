import React from "react";
import { getModuleGradingDataAction } from "@/features/grading/actions/grade.actions";
import { ModuleGradingWorkspace } from "@/features/grading/components/module-grading-workspace";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ moduleId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { moduleId } = await params;
  return {
    title: `Penilaian Asistensi | Modul ${moduleId}`,
  };
}

export default async function ModuleGradingPage({ params }: PageProps) {
  const { moduleId } = await params;
  const data = await getModuleGradingDataAction(moduleId);

  if (!data) {
    notFound();
  }

  return <ModuleGradingWorkspace module={data.module} initialStudents={data.students} />;
}
