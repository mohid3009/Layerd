import React from 'react'

export default function IndianEmblem({ size = 48, className = '', color = '#8B6508' }) {
  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      {/* Ashoka Pillar Lion Capital Vector */}
      <svg
        width={size}
        height={size * 1.15}
        viewBox="0 0 100 115"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-xs"
      >
        {/* Top Lions Crown / Capital */}
        <path
          d="M50 4 C42 4 36 10 35 18 C33 16 28 17 26 22 C24 20 18 22 17 28 C16 32 19 36 21 38 C18 41 18 47 22 50 C26 53 32 51 35 48 C37 53 43 56 50 56 C57 56 63 53 65 48 C68 51 74 53 78 50 C82 47 82 41 79 38 C81 36 84 32 83 28 C82 22 76 20 74 22 C72 17 67 16 65 18 C64 10 58 4 50 4 Z"
          fill={color}
          opacity="0.9"
        />
        {/* Lion Mane Detail Overlay */}
        <circle cx="50" cy="22" r="5" fill="#FFF" opacity="0.25" />
        <circle cx="36" cy="30" r="4" fill="#FFF" opacity="0.2" />
        <circle cx="64" cy="30" r="4" fill="#FFF" opacity="0.2" />
        <path d="M44 32 Q50 36 56 32 Q50 40 44 32 Z" fill="#FFF" opacity="0.3" />

        {/* Abacus & Wheel (Ashoka Chakra) */}
        <rect x="22" y="56" width="56" height="12" rx="2" fill={color} />
        {/* Ashoka Chakra Wheel */}
        <circle cx="50" cy="62" r="4.5" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
        <line x1="50" y1="57.5" x2="50" y2="66.5" stroke="#FFFFFF" strokeWidth="0.8" />
        <line x1="45.5" y1="62" x2="54.5" y2="62" stroke="#FFFFFF" strokeWidth="0.8" />
        <line x1="46.8" y1="58.8" x2="53.2" y2="65.2" stroke="#FFFFFF" strokeWidth="0.8" />
        <line x1="46.8" y1="65.2" x2="53.2" y2="58.8" stroke="#FFFFFF" strokeWidth="0.8" />

        {/* Side Animals (Bull and Horse silhouettes) */}
        <circle cx="30" cy="62" r="2.5" fill="#FFFFFF" opacity="0.8" />
        <circle cx="70" cy="62" r="2.5" fill="#FFFFFF" opacity="0.8" />

        {/* Lotus Base / Bell Capital */}
        <path
          d="M26 68 Q50 82 74 68 L70 82 Q50 92 30 82 Z"
          fill={color}
        />
        <path
          d="M32 70 Q50 78 68 70 L65 77 Q50 84 35 77 Z"
          fill="#FFF"
          opacity="0.2"
        />

        {/* Pedestal Base */}
        <rect x="20" y="84" width="60" height="4" rx="1" fill={color} />
      </svg>
      {/* Satyameva Jayate in Devanagari */}
      <span
        style={{ color, fontFamily: "'Noto Serif Devanagari', 'Tiro Devanagari Hindi', 'Georgia', serif" }}
        className="text-[11px] font-extrabold tracking-widest mt-0.5"
      >
        सत्यमेव जयते
      </span>
    </div>
  )
}
