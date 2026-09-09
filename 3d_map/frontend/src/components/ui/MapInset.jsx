// deterministic pseudo-random vegetation dots
function dots() {
  const out = []
  let seed = 9
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  for (let i = 0; i < 90; i++) {
    out.push([20 + rnd() * 360, 15 + rnd() * 210, 1 + rnd() * 1.6])
  }
  return out
}
const DOTS = dots()

// Styled placeholder "map" — vegetation dots, road curves, a white building
// footprint, and an optional dashed accent highlight over one unit.
export default function MapInset({ highlightUnit = false, ulpin }) {
  return (
    <div className="relative rounded-[14px] overflow-hidden border border-line">
      <svg viewBox="0 0 400 240" className="w-full block">
        <rect width="400" height="240" fill="#EAF0E6" />
        {DOTS.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#CBDCC4" />
        ))}
        <path d="M-20 190 C 120 150, 240 220, 420 140" stroke="#D8D4C8" strokeWidth="18" fill="none" />
        <path d="M-20 190 C 120 150, 240 220, 420 140" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="10 8" fill="none" />
        <path d="M60 -10 C 90 80, 40 160, 110 250" stroke="#D8D4C8" strokeWidth="14" fill="none" />
        <polygon points="150,70 300,55 320,150 170,175" fill="#FFFFFF" stroke="#2B2E33" strokeWidth="2.5" />
        <line x1="225" y1="63" x2="232" y2="162" stroke="#C9CBD1" strokeWidth="1.5" />
        <line x1="152" y1="122" x2="318" y2="103" stroke="#C9CBD1" strokeWidth="1.5" />
        {highlightUnit && (
          <polygon
            points="225,63 300,55 318,103 232,122"
            fill="rgba(214,66,58,0.15)"
            stroke="#D6423A"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
        )}
      </svg>
      <div className="absolute bottom-2.5 left-2.5 bg-surface/95 border border-line rounded-full px-3 py-1 text-[11px] font-id text-ink">
        Parcel {ulpin}
      </div>
    </div>
  )
}