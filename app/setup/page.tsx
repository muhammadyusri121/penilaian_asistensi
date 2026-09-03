import { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkHasAdminAction } from "@/features/admin/actions/admin-management.actions";
import { SetupAdminForm } from "@/features/admin/components/setup-admin-form";

export const metadata: Metadata = {
  title: "Inisialisasi Admin Pertama | Lab Komputer",
  description: "Form setup awal pembuatan akun Koordinator Laboratorium",
};

export default async function SetupPage() {
  const hasAdmin = await checkHasAdminAction();
  if (hasAdmin) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-center p-4">
      <SetupAdminForm />
    </main>
  );
}
