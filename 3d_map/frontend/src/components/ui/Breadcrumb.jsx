export default function Breadcrumb({ current }) {
  return (
    <div className="text-xs text-ink-mid mb-2">
      Avani Portal <span className="mx-1 text-ink-soft">/</span>{' '}
      <span className="font-semibold text-ink">{current}</span>
    </div>
  )
}