import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistem Penilaian Asistensi Praktikum | Laboratorium",
  description: "Sistem evaluasi dan rekapitulasi penilaian asistensi praktikum laboratorium komputer & teknik",
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
      </body>
    </html>
  );
}
