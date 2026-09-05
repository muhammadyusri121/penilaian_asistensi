import { redirect } from "next/navigation";
import { getSession } from "@/lib/security";

export default async function DashboardIndexPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role === "ADMIN") {
    redirect("/admin/matakuliah");
  } else {
    redirect("/praktikum");
  }
}
