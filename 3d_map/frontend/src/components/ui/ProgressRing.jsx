import { useEffect, useState } from 'react'

export default function ProgressRing({ percentage = 0, children }) {
  const [p, setP] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setP(percentage), 120)
    return () => clearTimeout(t)
  }, [percentage])
  const r = 42
  const c = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-5">
      <svg width="110" height="110" viewBox="0 0 110 110" className="shrink-0">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#EDEDEF" strokeWidth="10" />
        <circle
          cx="55" cy="55" r={r} fill="none" stroke="#3A9B6A" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * p) / 100}
          transform="rotate(-90 55 55)"
          style={{ transition: 'stroke-dashoffset 0.9s ease' }}
        />
        <text x="55" y="61" textAnchor="middle" fill="#2B2E33" style={{ fontSize: 20, fontWeight: 800 }}>
          {percentage}%
        </text>
      </svg>
      <div className="min-w-0">{children}</div>
    </div>
  )
}