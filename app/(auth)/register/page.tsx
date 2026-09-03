import { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Pendaftaran Asisten Praktikum | Lab Komputer",
  description: "Registrasi akun asisten praktikum baru untuk penilaian laboratorium",
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-center p-4">
      <RegisterForm />
    </main>
  );
}
