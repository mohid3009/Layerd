import { ArrowRight } from 'lucide-react'

// The signature property-listing card: icon + badge header, dashed divider,
// meta row at the bottom, optional accent left border and hover lift.
export default function TicketCard({
  illustration,
  badgeVariant,
  badgeLabel,
  buildingName,
  unitLabel,
  metaText,
  statusVariant,
  statusLabel,
  accentColor,
  onClick,
  children,
}) {
  const clickable = typeof onClick === 'function'
  return (
    <div
      onClick={onClick}
      className={`relative bg-surface border border-line rounded-[14px] p-4 transition-all duration-150 ${
        clickable
          ? 'cursor-pointer hover:shadow-[0_8px_22px_rgba(30,32,40,0.12)] hover:-translate-y-0.5'
          : ''
      }`}
      style={accentColor ? { borderLeft: `3px solid ${accentColor}` } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {illustration}
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-ink-mid truncate">
              {buildingName}
            </div>
            <div className="flex items-center gap-1.5 font-bold text-ink mt-0.5">
              <ArrowRight size={14} className="text-ink-soft shrink-0" />
              <span className="truncate">{unitLabel}</span>
            </div>
          </div>
        </div>
        {badgeVariant && (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${
              badgeVariant === 'verified' ? 'bg-greenbg text-green' : 'bg-amberbg text-[#8A6410]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${badgeVariant === 'verified' ? 'bg-green' : 'bg-amber'}`}
            />
            {badgeLabel}
          </span>
        )}
      </div>

      {children}

      <div className="border-t border-dashed border-line mt-3 pt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-ink-mid">{metaText}</span>
        {statusLabel && <StatusPillLite variant={statusVariant}>{statusLabel}</StatusPillLite>}
      </div>
    </div>
  )
}

function StatusPillLite({ variant = 'info', children }) {
  const tones = {
    verified: 'bg-greenbg text-green',
    review: 'bg-amberbg text-[#8A6410]',
    info: 'bg-bluebg text-blue',
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap ${tones[variant] || tones.info}`}
    >
      {children}
    </span>
  )
}