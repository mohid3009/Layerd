const tones = {
  verified: 'bg-greenbg text-green',
  review: 'bg-amberbg text-[#8A6410]',
  info: 'bg-bluebg text-blue',
}

export default function StatusPill({ variant = 'info', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap ${tones[variant] || tones.info}`}
    >
      {children}
    </span>
  )
}