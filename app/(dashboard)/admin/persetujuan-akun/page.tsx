import { Metadata } from "next";
import { getSession } from "@/lib/security";
import { redirect } from "next/navigation";
import { getPendingUsersAction, getActiveAssistantsAction } from "@/features/admin/actions/admin.actions";
import { PendingUsersTable } from "@/features/admin/components/pending-users-table";
import { UserCheck, ShieldAlert, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Persetujuan Akun Asisten | Admin Lab",
  description: "Antrean ACC dan verifikasi pendaftaran akun calon asisten praktikum",
};

export default async function PersetujuanAkunPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/modul");
  }

  const [pendingUsers, activeAssistants] = await Promise.all([
    getPendingUsersAction(),
    getActiveAssistantsAction(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b-3 border-black pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black flex items-center gap-3">
            <UserCheck className="w-8 h-8" />
            <span>Persetujuan Akun Asisten (ACC)</span>
          </h1>
          <p className="text-xs md:text-sm font-bold text-neutral-600">
            Tinjau dan aktifkan pendaftaran akun calon asisten praktikum sebelum mereka dapat login dan membimbing mahasiswa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="neo-box-sm bg-[#FFEB3B] p-2.5 text-center min-w-[130px]">
            <span className="text-[10px] font-black text-neutral-600 uppercase block">Menunggu ACC</span>
            <span className="text-xl font-black font-mono-numbers">{pendingUsers.length}</span>
          </div>
          <div className="neo-box-sm bg-white p-2.5 text-center min-w-[130px]">
            <span className="text-[10px] font-black text-neutral-600 uppercase block">Asisten Aktif</span>
            <span className="text-xl font-black font-mono-numbers">{activeAssistants.length}</span>
          </div>
        </div>
      </div>

      {/* Antrean Pending */}
      <div className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#FF5252]" />
          <span>Antrean Pendaftaran Baru ({pendingUsers.length})</span>
        </h2>
        <PendingUsersTable users={pendingUsers} />
      </div>

      {/* Daftar Asisten Aktif */}
      <div className="space-y-3 pt-4 border-t-3 border-black">
        <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-black" />
          <span>Daftar Asisten Praktikum Aktif ({activeAssistants.length})</span>
        </h2>

        <div className="neo-box bg-white overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-3 border-black bg-[#FFF9F0] text-xs font-black uppercase">
                <th className="p-3 border-r-3 border-black w-12 text-center">No</th>
                <th className="p-3 border-r-3 border-black">Nama Lengkap</th>
                <th className="p-3 border-r-3 border-black">Username</th>
                <th className="p-3 border-r-3 border-black">Email</th>
                <th className="p-3 border-r-3 border-black text-center">MK Diampu</th>
                <th className="p-3 border-r-3 border-black text-center">Praktikan</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-neutral-200 text-xs font-medium">
              {activeAssistants.map((ast, idx) => (
                <tr key={ast.id} className="hover:bg-neutral-50">
                  <td className="p-3 border-r-3 border-black font-mono font-bold text-center">
                    {idx + 1}
                  </td>
                  <td className="p-3 border-r-3 border-black font-bold text-black">
                    {ast.name}
                  </td>
                  <td className="p-3 border-r-3 border-black font-mono font-black text-[#2196F3]">
                    {ast.username}
                  </td>
                  <td className="p-3 border-r-3 border-black text-neutral-600">
                    {ast.email || "-"}
                  </td>
                  <td className="p-3 border-r-3 border-black font-mono font-black text-center">
                    {ast._count.assignedCourses}
                  </td>
                  <td className="p-3 border-r-3 border-black font-mono font-black text-center">
                    {ast._count.studentEnrollments}
                  </td>
                  <td className="p-3 text-center">
                    <span className="neo-box-sm bg-[#4CAF50] text-black px-2 py-0.5 text-[10px] font-black uppercase">
                      {ast.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
