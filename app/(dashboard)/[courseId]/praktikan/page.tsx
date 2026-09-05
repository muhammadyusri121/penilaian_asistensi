import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/security";
import { getCourseStudentsAction } from "@/features/students/actions/student.actions";
import { getMyCourseProposalAction } from "@/features/courses/actions/course.actions";
import { getActiveAssistantsAction } from "@/features/admin/actions/admin.actions";
import { getActivePeriodAction } from "@/features/periods/actions/period.actions";
import { CourseStudentManager } from "@/features/students/components/course-student-manager";
import { Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Data Praktikan Mata Kuliah | Workspace",
  description: "Daftar mahasiswa praktikan yang terdaftar di mata kuliah praktikum",
};

export default async function CoursePraktikanPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { courseId } = await params;
  const [students, proposal, activeAssistants, activePeriod] = await Promise.all([
    getCourseStudentsAction(courseId),
    session.role !== "ADMIN" ? getMyCourseProposalAction(courseId) : null,
    session.role === "ADMIN" ? getActiveAssistantsAction() : [],
    getActivePeriodAction(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b-3 border-black pb-3">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <Users className="w-6 h-6" />
            <span>Mahasiswa Praktikan ({students.length} Mahasiswa)</span>
          </h2>
          <p className="text-xs font-bold text-neutral-600">
            {session.role === "ADMIN"
              ? "Menampilkan seluruh mahasiswa yang terdaftar di mata kuliah ini lintas asisten."
              : "Menampilkan mahasiswa praktikan binaan Anda pada mata kuliah ini."}
          </p>
        </div>
      </div>

      <CourseStudentManager
        courseId={courseId}
        students={students}
        currentUserId={session.userId}
        isAdmin={session.role === "ADMIN"}
        proposalStatus={proposal?.status}
        proposalNotes={proposal?.notes}
        assistantsList={activeAssistants}
        studentInputEnd={activePeriod?.studentInputEnd}
      />
    </div>
  );
}
