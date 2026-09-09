const tones = {
  blue: 'bg-bluebg text-blue',
  green: 'bg-greenbg text-green',
  amber: 'bg-amberbg text-amber',
  red: 'bg-[#FBE9E8] text-accent',
}
const trendTones = {
  green: 'text-green',
  red: 'text-accent',
  muted: 'text-ink-soft',
}

export default function StatCard({ icon, variant = 'blue', value, label, trend, trendTone = 'muted' }) {
  return (
    <div className="bg-surface border border-line rounded-[14px] p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-[10px] grid place-items-center shrink-0 ${tones[variant] || tones.blue}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xl font-extrabold text-ink leading-none">{value}</div>
        <div className="text-[10px] uppercase tracking-wide text-ink-mid mt-1">{label}</div>
        {trend && <div className={`text-[11px] mt-0.5 ${trendTones[trendTone] || trendTones.muted}`}>{trend}</div>}
      </div>
    </div>
  )
}