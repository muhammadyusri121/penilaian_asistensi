"use client";

import React from "react";

interface WhatsAppSupportProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export function WhatsAppSupport({
  phoneNumber = process.env.NEXT_PUBLIC_WA_PHONE || "6285856800664",
  defaultMessage = "Halo Admin / Koordinator Lab, saya ingin menyampaikan pengaduan/kendala mengenai sistem penilaian asistensi praktikum.",
}: WhatsAppSupportProps) {
  // Bersihkan karakter non-digit dari nomor WA
  const cleanNumber = phoneNumber.replace(/\D/g, "");
  const encodedMsg = encodeURIComponent(defaultMessage);
  const waUrl = `https://wa.me/${cleanNumber}?text=${encodedMsg}`;

  return (
    <div className="fixed bottom-5 right-5 z-50 group">
      {/* Tooltip Hover (Desktop) */}
      <div className="absolute right-0 bottom-full mb-2 hidden md:group-hover:block transition-all duration-150 pointer-events-none whitespace-nowrap">
        <div className="neo-box-sm bg-black text-white text-[11px] font-bold px-2.5 py-1 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse inline-block" />
          Pengaduan Sistem
        </div>
      </div>

      {/* Floating Button */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Pengaduan Layanan via WhatsApp"
        className="flex items-center gap-2 px-3.5 py-2.5 md:px-4 md:py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer select-none rounded-none"
      >
        {/* WhatsApp Official Vector Icon */}
        <svg
          className="w-5 h-5 md:w-6 md:h-6 fill-white shrink-0 drop-shadow-[1px_1px_0px_rgba(0,0,0,0.8)]"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>

        {/* Text Label */}
        {/* <span className="text-xs font-black tracking-wide hidden sm:inline-block">
          Pengaduan
        </span> */}
      </a>
    </div>
  );
}
