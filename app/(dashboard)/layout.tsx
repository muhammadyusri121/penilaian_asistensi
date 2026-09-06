import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/security";
import { redirect } from "next/navigation";
import { logoutAction } from "@/features/auth/actions/auth.actions";
import {
  BookOpen,
  Users,
  Award,
  LogOut,
  ShieldCheck,
  GraduationCap,
  CalendarRange,
  UserCheck,
  Layers,
} from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.role === "ADMIN";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#FDFBF7]">
      {/* Top Navbar */}
      <header className="border-b-3 border-black bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="neo-box-sm bg-[#FFEB3B] p-2">
              <GraduationCap className="w-6 h-6 text-black" />
            </div>
            <div>
              <Link href="/praktikum" className="text-lg font-black uppercase tracking-tight text-black flex items-center gap-2">
                Asistensi Lab
                <span className="neo-box-sm text-[10px] px-1.5 py-0.5 bg-[#2196F3] text-white">
                  v 2.1
                </span>
              </Link>
              <p className="text-[10px] font-bold text-neutral-500 uppercase">
                Sistem Penilaian Asistensi Praktikum
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 neo-box-sm bg-neutral-100 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-black text-black">{session.name}</span>
              <span className="text-[10px] bg-black text-[#FFEB3B] px-1.5 py-0.5 font-mono">
                {session.role}
              </span>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="neo-btn px-3 py-1.5 bg-[#FF5252] text-white text-xs font-black flex items-center gap-1.5 hover:bg-red-600 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </form>
          </div>
        </div>

        {/* Navigation Bar */}
        <nav className="border-t-2 border-black bg-[#FFEB3B] px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1.5">
            {/* Menu Khusus Admin */}
            {isAdmin ? (
              <>
                <Link
                  href="/admin/matakuliah"
                  className="neo-btn text-xs px-3 py-1.5 bg-black text-white font-black flex items-center gap-1.5 shrink-0 hover:bg-neutral-800"
                >
                  <Layers className="w-3.5 h-3.5 text-[#FFEB3B]" />
                  Master Mata Kuliah
                </Link>
                <Link
                  href="/admin/pengajuan-matakuliah"
                  className="neo-btn text-xs px-3 py-1.5 bg-black text-white font-black flex items-center gap-1.5 shrink-0 hover:bg-neutral-800"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  Pengajuan MK
                </Link>
                <Link
                  href="/admin/persetujuan-akun"
                  className="neo-btn text-xs px-3 py-1.5 bg-black text-white font-black flex items-center gap-1.5 shrink-0 hover:bg-neutral-800"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#00E5FF]" />
                  Akun Asprak
                </Link>
                <Link
                  href="/admin/rekap-nilai"
                  className="neo-btn text-xs px-3 py-1.5 bg-black text-white font-black flex items-center gap-1.5 shrink-0 hover:bg-neutral-800"
                >
                  <Award className="w-3.5 h-3.5 text-[#4CAF50]" />
                  Rekap Nilai Semua MK
                </Link>
                <Link
                  href="/admin/periode"
                  className="neo-btn text-xs px-3 py-1.5 bg-black text-white font-black flex items-center gap-1.5 shrink-0 hover:bg-neutral-800"
                >
                  <CalendarRange className="w-3.5 h-3.5 text-[#2196F3]" />
                  Periode Semester
                </Link>
              </>
            ) : (
              <>
                {/* Menu Asprak */}
                <Link
                  href="/praktikum"
                  className="neo-btn text-xs px-3 py-1.5 bg-white text-black font-black flex items-center gap-1.5 shrink-0 hover:bg-yellow-100"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#2196F3]" />
                  Pilihan Mata Kuliah
                </Link>
                <Link
                  href="/praktikan"
                  className="neo-btn text-xs px-3 py-1.5 bg-white text-black font-black flex items-center gap-1.5 shrink-0 hover:bg-yellow-100"
                >
                  <Users className="w-3.5 h-3.5" />
                  Data Praktikan
                </Link>
                <Link
                  href="/rekap-nilai"
                  className="neo-btn text-xs px-3 py-1.5 bg-white text-black font-black flex items-center gap-1.5 shrink-0 hover:bg-yellow-100"
                >
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  Rekap Nilai Semester
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
