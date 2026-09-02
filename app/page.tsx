import { getSession } from "@/lib/security";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect("/modul");
  } else {
    redirect("/login");
  }
}
