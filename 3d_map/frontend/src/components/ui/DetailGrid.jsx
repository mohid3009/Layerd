export default function DetailGrid({ fields, columns = 2 }) {
  return (
    <div className={`grid gap-x-4 gap-y-4 ${columns === 4 ? 'grid-cols-2 min-[640px]:grid-cols-4' : 'grid-cols-2'}`}>
      {fields.map((f) => (
        <div key={f.label}>
          <div className="text-[10px] uppercase tracking-wide text-ink-mid mb-0.5">{f.label}</div>
          <div className="text-sm font-bold text-ink break-words">{f.value}</div>
        </div>
      ))}
    </div>
  )
}