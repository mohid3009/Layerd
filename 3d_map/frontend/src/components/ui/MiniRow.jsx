export default function MiniRow({ icon, title, subtitle, pill, onClick, last = false }) {
  const Cmp = onClick ? 'button' : 'div'
  return (
    <Cmp
      onClick={onClick}
      className={`w-full flex items-center gap-3 py-2.5 text-left ${
        last ? '' : 'border-b border-dashed border-line'
      } ${onClick ? 'rounded-lg px-2 -mx-2 hover:bg-neutralbg/70' : ''}`}
    >
      <div className="w-8 h-8 rounded-lg bg-neutralbg grid place-items-center text-ink-mid shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink truncate">{title}</div>
        {subtitle && <div className="text-xs text-ink-mid truncate">{subtitle}</div>}
      </div>
      {pill}
    </Cmp>
  )
}