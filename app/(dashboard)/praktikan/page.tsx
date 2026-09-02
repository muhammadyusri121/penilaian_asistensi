import React from "react";
import { getStudentsAction } from "@/features/students/actions/student.actions";
import { StudentManager } from "@/features/students/components/student-manager";

export const metadata = {
  title: "Data Praktikan | Asistensi Lab",
};

export default async function PraktikanPage() {
  const students = await getStudentsAction();

  return (
    <div className="space-y-6">
      <div className="neo-box bg-white p-6 border-b-3 border-black">
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black">
          Manajemen Praktikan
        </h1>
        <p className="text-xs md:text-sm font-medium text-neutral-600">
          Kelola data mahasiswa praktikum binaan Anda. Anda dapat mengimpor file Excel/CSV atau menambah praktikan secara manual.
        </p>
      </div>

      <StudentManager initialStudents={students} />
    </div>
  );
}
