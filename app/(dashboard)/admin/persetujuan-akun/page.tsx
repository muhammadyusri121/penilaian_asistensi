import { Metadata } from "next";
import { getSession } from "@/lib/security";
import { redirect } from "next/navigation";
import {
  getPendingUsersAction,
  getAllAssistantsAction,
} from "@/features/admin/actions/admin.actions";
import { PendingUsersTable } from "@/features/admin/components/pending-users-table";
import { AssistantManager } from "@/features/admin/components/assistant-manager";
import { UserCheck, ShieldAlert, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Manajemen & Persetujuan Akun Asprak | Admin Lab",
  description: "Kelola akun asisten praktikum (CRUD) dan verifikasi pendaftaran akun baru",
};

export default async function PersetujuanAkunPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/praktikum");
  }

  const [pendingUsers, allAssistants] = await Promise.all([
    getPendingUsersAction(),
    getAllAssistantsAction(),
  ]);

  const activeCount = allAssistants.filter((a) => a.status === "ACTIVE").length;
  const pendingCount = pendingUsers.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b-3 border-black pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black flex items-center gap-3">
            <UserCheck className="w-8 h-8" />
            <span>Manajemen & Persetujuan Akun Asprak</span>
          </h1>
          <p className="text-xs md:text-sm font-bold text-neutral-600">
            Kelola data akun asisten praktikum (tambah, edit profil, reset password, hapus) serta tinjau antrean persetujuan (ACC) pendaftar baru.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="neo-box-sm bg-white p-2.5 text-center min-w-[110px]">
            <span className="text-[10px] font-black text-neutral-600 uppercase block">Total Asprak</span>
            <span className="text-xl font-black font-mono-numbers">{allAssistants.length}</span>
          </div>
          <div className="neo-box-sm bg-[#4CAF50] text-black p-2.5 text-center min-w-[110px]">
            <span className="text-[10px] font-black text-black uppercase block">Asisten Aktif</span>
            <span className="text-xl font-black font-mono-numbers">{activeCount}</span>
          </div>
          <div className="neo-box-sm bg-[#FFEB3B] text-black p-2.5 text-center min-w-[110px]">
            <span className="text-[10px] font-black text-neutral-800 uppercase block">Menunggu ACC</span>
            <span className="text-xl font-black font-mono-numbers">{pendingCount}</span>
          </div>
        </div>
      </div>

      {/* Antrean Pending (Ditampilkan menonjol jika ada pendaftar baru yang menunggu ACC) */}
      {pendingUsers.length > 0 && (
        <div className="space-y-3 bg-[#FFF9F0] p-4 border-3 border-black">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-black">
              <ShieldAlert className="w-4 h-4 text-[#FF5252]" />
              <span>Antrean Pendaftaran Akun Baru ({pendingUsers.length})</span>
            </h2>
            <span className="neo-box-sm bg-amber-300 text-black text-[10px] px-2 py-0.5 font-black uppercase">
              Perlu Tindakan
            </span>
          </div>
          <PendingUsersTable users={pendingUsers} />
        </div>
      )}

      {/* Master Data & CRUD Seluruh Akun Asisten Praktikum */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b-2 border-dashed border-neutral-300 pb-2">
          <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-black">
            <Users className="w-4 h-4 text-black" />
            <span>Daftar Seluruh Akun Asisten Praktikum</span>
          </h2>
        </div>

        <AssistantManager assistants={allAssistants as any} />
      </div>
    </div>
  );
}
