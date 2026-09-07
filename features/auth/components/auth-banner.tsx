import React from "react";
import Image from "next/image";

export function AuthBanner() {
  return (
    <div className="relative w-full h-full min-h-[280px] md:min-h-[580px] bg-[#0F666D] flex flex-col justify-between p-6 overflow-hidden border-b-3 md:border-b-0 md:border-r-3 border-black select-none">
      {/* Geometric Bauhaus SVG Pattern Overlay */}
      <svg
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90"
        viewBox="0 0 400 650"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="diag-stripes" width="16" height="16" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="16" stroke="#FFFFFF" strokeWidth="6" />
          </pattern>
          <pattern id="diag-stripes-yellow" width="16" height="16" patternTransform="rotate(-45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="16" stroke="#FFEB3B" strokeWidth="5" />
          </pattern>
          <pattern id="dots-pattern" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="7" cy="7" r="2.5" fill="#FFEB3B" />
          </pattern>
        </defs>

        {/* Mosaic Tiles Grid */}
        {/* Row 1 */}
        <g>
          {/* Tile 1,1: Wheat / Leaves */}
          <rect x="10" y="10" width="90" height="90" fill="#21BCAA" stroke="#000" strokeWidth="2.5" rx="4" />
          <path d="M55 25 C45 35 45 45 55 55 C65 45 65 35 55 25 Z" fill="#FFFFFF" stroke="#000" strokeWidth="2" />
          <path d="M40 45 C35 52 35 60 40 68 C48 60 48 52 40 45 Z" fill="#FFEB3B" stroke="#000" strokeWidth="2" />
          <path d="M70 45 C65 52 65 60 70 68 C78 60 78 52 70 45 Z" fill="#FFEB3B" stroke="#000" strokeWidth="2" />
          <path d="M55 55 C45 65 45 75 55 85 C65 75 65 65 55 55 Z" fill="#FFFFFF" stroke="#000" strokeWidth="2" />

          {/* Tile 1,2: Yellow & Teal Bauhaus Triangles */}
          <rect x="105" y="10" width="140" height="90" fill="#FFEB3B" stroke="#000" strokeWidth="2.5" rx="4" />
          <polygon points="105,10 245,10 175,100" fill="#2196F3" stroke="#000" strokeWidth="2" />
          <circle cx="175" cy="55" r="20" fill="#FF5252" stroke="#000" strokeWidth="2" />
          <circle cx="175" cy="55" r="8" fill="#FFFFFF" />

          {/* Tile 1,3: Diagonal Stripes */}
          <rect x="250" y="10" width="140" height="90" fill="#2196F3" stroke="#000" strokeWidth="2.5" rx="4" />
          <rect x="250" y="10" width="140" height="90" fill="url(#diag-stripes)" rx="4" />
        </g>

        {/* Row 2 */}
        <g>
          {/* Tile 2,1: Striped Column */}
          <rect x="10" y="105" width="90" height="120" fill="#FF5252" stroke="#000" strokeWidth="2.5" rx="4" />
          <rect x="20" y="115" width="16" height="100" fill="#FFFFFF" stroke="#000" strokeWidth="1.5" />
          <rect x="46" y="115" width="16" height="100" fill="#FFEB3B" stroke="#000" strokeWidth="1.5" />
          <rect x="72" y="115" width="16" height="100" fill="#2196F3" stroke="#000" strokeWidth="1.5" />

          {/* Tile 2,2: Concentric Bauhaus Arches / Eye */}
          <rect x="105" y="105" width="180" height="180" fill="#FFFDF7" stroke="#000" strokeWidth="2.5" rx="4" />
          <path d="M 195 285 A 90 90 0 0 1 105 195 L 145 195 A 50 50 0 0 0 195 245 Z" fill="#21BCAA" stroke="#000" strokeWidth="2" />
          <circle cx="195" cy="195" r="55" fill="#FFEB3B" stroke="#000" strokeWidth="2.5" />
          <circle cx="195" cy="195" r="32" fill="#0F666D" stroke="#000" strokeWidth="2" />
          <circle cx="195" cy="195" r="14" fill="#FFFFFF" stroke="#000" strokeWidth="2" />
          <circle cx="195" cy="195" r="5" fill="#000" />

          {/* Tile 2,3: Right Polka Dots */}
          <rect x="290" y="105" width="100" height="120" fill="#0F666D" stroke="#000" strokeWidth="2.5" rx="4" />
          <rect x="290" y="105" width="100" height="120" fill="url(#dots-pattern)" rx="4" />
        </g>

        {/* Row 3 */}
        <g>
          {/* Tile 3,1: Diagonal Chevron / Stripes */}
          <rect x="10" y="230" width="90" height="140" fill="#2196F3" stroke="#000" strokeWidth="2.5" rx="4" />
          <rect x="10" y="230" width="90" height="140" fill="url(#diag-stripes-yellow)" rx="4" />

          {/* Tile 3,3: Neo-brutalist Stars & Triangles */}
          <rect x="290" y="230" width="100" height="160" fill="#FFEB3B" stroke="#000" strokeWidth="2.5" rx="4" />
          <polygon points="290,230 390,310 290,390" fill="#FF5252" stroke="#000" strokeWidth="2" />
          <path d="M340 270 L345 285 L360 290 L345 295 L340 310 L335 295 L320 290 L335 285 Z" fill="#FFFFFF" stroke="#000" strokeWidth="1.5" />
        </g>

        {/* Row 4 */}
        <g>
          {/* Tile 4,1: Concentric Circular Slices */}
          <rect x="10" y="375" width="140" height="120" fill="#FF5252" stroke="#000" strokeWidth="2.5" rx="4" />
          <path d="M10 495 A 120 120 0 0 1 130 495 Z" fill="#FFEB3B" stroke="#000" strokeWidth="2" />
          <path d="M30 495 A 80 80 0 0 1 110 495 Z" fill="#21BCAA" stroke="#000" strokeWidth="2" />
          <path d="M50 495 A 40 40 0 0 1 90 495 Z" fill="#FFFFFF" stroke="#000" strokeWidth="2" />

          {/* Tile 4,2: Half Arches & Checker / Diamond */}
          <rect x="155" y="290" width="130" height="150" fill="#21BCAA" stroke="#000" strokeWidth="2.5" rx="4" />
          <circle cx="220" cy="365" r="45" fill="#2196F3" stroke="#000" strokeWidth="2" />
          <polygon points="220,330 255,365 220,400 185,365" fill="#FFFFFF" stroke="#000" strokeWidth="2" />
          <circle cx="220" cy="365" r="10" fill="#FF5252" />

          {/* Tile 4,3 */}
          <rect x="290" y="395" width="100" height="100" fill="#0F666D" stroke="#000" strokeWidth="2.5" rx="4" />
          <circle cx="340" cy="445" r="32" fill="#21BCAA" stroke="#000" strokeWidth="2" />
          <circle cx="340" cy="445" r="16" fill="#FFEB3B" stroke="#000" strokeWidth="2" />
        </g>

        {/* Row 5 */}
        <g>
          {/* Tile 5,1: Bottom Mosaic Arch */}
          <rect x="10" y="500" width="110" height="140" fill="#0F666D" stroke="#000" strokeWidth="2.5" rx="4" />
          <path d="M20 540 C20 520 50 520 50 540 C50 560 20 560 20 540 Z" fill="#21BCAA" stroke="#000" strokeWidth="1.5" />
          <path d="M70 540 C70 520 100 520 100 540 C100 560 70 560 70 540 Z" fill="#21BCAA" stroke="#000" strokeWidth="1.5" />
          <path d="M20 580 C20 560 50 560 50 580 C50 600 20 600 20 580 Z" fill="#FFEB3B" stroke="#000" strokeWidth="1.5" />
          <path d="M70 580 C70 560 100 560 100 580 C100 600 70 600 70 580 Z" fill="#FFEB3B" stroke="#000" strokeWidth="1.5" />
          <path d="M20 620 C20 600 50 600 50 620 C50 640 20 640 20 620 Z" fill="#FFFFFF" stroke="#000" strokeWidth="1.5" />
          <path d="M70 620 C70 600 100 600 100 620 C100 640 70 640 70 620 Z" fill="#FFFFFF" stroke="#000" strokeWidth="1.5" />

          {/* Tile 5,2: Rainbow Semicircle */}
          <rect x="125" y="445" width="160" height="195" fill="#FFEB3B" stroke="#000" strokeWidth="2.5" rx="4" />
          <path d="M125 640 A 100 100 0 0 1 285 640 Z" fill="#FF5252" stroke="#000" strokeWidth="2" />
          <path d="M145 640 A 80 80 0 0 1 265 640 Z" fill="#2196F3" stroke="#000" strokeWidth="2" />
          <path d="M165 640 A 60 60 0 0 1 245 640 Z" fill="#21BCAA" stroke="#000" strokeWidth="2" />
          <path d="M185 640 A 40 40 0 0 1 225 640 Z" fill="#FFFFFF" stroke="#000" strokeWidth="2" />

          {/* Tile 5,3: Bottom Right Dots */}
          <rect x="290" y="500" width="100" height="140" fill="#2196F3" stroke="#000" strokeWidth="2.5" rx="4" />
          <rect x="290" y="500" width="100" height="140" fill="url(#dots-pattern)" rx="4" />
        </g>
      </svg>

      {/* Floating Header Card inside Banner */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2.5 bg-white border-2 border-black px-3 py-1.5 shadow-[3px_3px_0px_#000000]">
          <Image
            src="/icon.svg"
            alt="Logo"
            width={28}
            height={20}
            className="h-5 w-auto object-contain"
            style={{ width: "auto" }}
            priority
          />
          <span className="text-xs font-black uppercase tracking-wider text-black">
            Laboratorium SI
          </span>
        </div>
      </div>
    </div>
  );
}
