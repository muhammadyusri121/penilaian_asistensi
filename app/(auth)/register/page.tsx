import { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Pendaftaran Asisten Praktikum | Lab Komputer",
  description: "Registrasi akun asisten praktikum baru untuk penilaian laboratorium",
};

export default function RegisterPage() {
  return (
    <main className="min-h-[100dvh] bg-[#FDFBF7] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <RegisterForm />
    </main>
  );
}
