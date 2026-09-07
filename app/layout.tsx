import type { Metadata } from "next";
import "./globals.css";
import { WhatsAppSupport } from "@/components/ui/whatsapp-support";

export const metadata: Metadata = {
  title: "Sistem Penilaian Asistensi Praktikum | Laboratorium",
  description: "Sistem evaluasi dan rekapitulasi penilaian asistensi praktikum laboratorium komputer & teknik",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full flex flex-col bg-[#FDFBF7] text-[#111111]">
        {children}
        <WhatsAppSupport />
      </body>
    </html>
  );
}
