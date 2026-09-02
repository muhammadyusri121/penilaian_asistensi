import { LoginForm } from "@/features/auth/components/login-form";
import { getSession } from "@/lib/security";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Login Asisten Praktikum | Laboratorium",
  description: "Portal masuk khusus Asisten Praktikum dan Administrator Laboratorium",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/modul");
  }

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-[#FDFBF7]">
      <LoginForm />
    </main>
  );
}
