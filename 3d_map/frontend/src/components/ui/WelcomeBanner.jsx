import { ArrowRight } from 'lucide-react'

export default function WelcomeBanner({ eyebrow, title, subtitle, ctaLabel, onCta }) {
  return (
    <div className="relative overflow-hidden bg-navy rounded-[16px] p-6 text-white">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-white/10 pointer-events-none" />
      <div className="absolute -top-10 -right-6 w-80 h-80 rounded-full border border-white/10 pointer-events-none" />
      <div className="relative flex items-center justify-between gap-6">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-white/60">{eyebrow}</div>
          <div className="text-2xl font-extrabold mt-1">{title}</div>
          <div className="text-sm text-white/70 mt-1">{subtitle}</div>
          {ctaLabel && (
            <button
              onClick={onCta}
              className="mt-4 inline-flex items-center gap-2 bg-white text-navy text-sm font-semibold rounded-[10px] px-4 py-2 hover:bg-white/90"
            >
              {ctaLabel} <ArrowRight size={15} />
            </button>
          )}
        </div>
        {/* small building illustration, one unit tinted in the accent red */}
        <svg width="130" height="110" viewBox="0 0 130 110" className="hidden min-[640px]:block shrink-0">
          <rect x="70" y="20" width="40" height="80" rx="2" fill="rgba(255,255,255,0.12)" />
          <rect x="76" y="28" width="10" height="10" fill="rgba(255,255,255,0.35)" />
          <rect x="92" y="28" width="10" height="10" fill="rgba(255,255,255,0.35)" />
          <rect x="76" y="44" width="10" height="10" fill="rgba(255,255,255,0.35)" />
          <rect x="92" y="44" width="10" height="10" fill="#D6423A" opacity="0.9" />
          <rect x="76" y="60" width="10" height="10" fill="rgba(255,255,255,0.35)" />
          <rect x="92" y="60" width="10" height="10" fill="rgba(255,255,255,0.35)" />
          <rect x="76" y="76" width="10" height="10" fill="rgba(255,255,255,0.35)" />
          <rect x="92" y="76" width="10" height="10" fill="rgba(255,255,255,0.35)" />
          <rect x="30" y="55" width="34" height="45" rx="2" fill="rgba(255,255,255,0.08)" />
          <rect x="36" y="62" width="9" height="9" fill="rgba(255,255,255,0.3)" />
          <rect x="50" y="62" width="9" height="9" fill="rgba(255,255,255,0.3)" />
          <rect x="36" y="76" width="9" height="9" fill="rgba(255,255,255,0.3)" />
          <rect x="50" y="76" width="9" height="9" fill="rgba(255,255,255,0.3)" />
          <rect x="10" y="100" width="112" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
        </svg>
      </div>
    </div>
  )
}