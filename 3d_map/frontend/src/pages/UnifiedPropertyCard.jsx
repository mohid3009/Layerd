import { Link, useNavigate, useParams } from 'react-router-dom'
import { Building2, ChevronRight, Box, Info, ShieldCheck } from 'lucide-react'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import TicketCard from '../components/ui/TicketCard.jsx'
import DetailGrid from '../components/ui/DetailGrid.jsx'
import MapInset from '../components/ui/MapInset.jsx'
import MiniRow from '../components/ui/MiniRow.jsx'
import StatusPill from '../components/ui/StatusPill.jsx'
import { getBuilding } from '../mockData.js'

export default function UnifiedPropertyCard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const b = getBuilding(id)

  if (!b) {
    return (
      <div className="max-w-[640px]">
        <Breadcrumb current="Unified Property Card" />
        <div className="bg-surface border border-line rounded-[14px] p-6 text-sm text-ink-mid">
          Parcel not found.{' '}
          <Link to="/portal/records" className="text-accent font-semibold">Back to records</Link>
        </div>
      </div>
    )
  }

  const allVerified = b.units.every((u) => u.status === 'verified')
  return (
    <div className="max-w-[640px]">
      <Breadcrumb current="Unified Property Card" />
      <TicketCard
        illustration={
          <div className="w-10 h-10 rounded-[10px] bg-bluebg text-blue grid place-items-center shrink-0">
            <Building2 size={18} />
          </div>
        }
        badgeVariant={allVerified ? 'verified' : 'review'}
        badgeLabel={allVerified ? 'parcel' : 'partial'}
        buildingName="Parcel record"
        unitLabel={b.name}
        metaText={b.address}
      >
        <div className="bg-surface border border-line rounded-[12px] p-4 mt-4">
          <DetailGrid
            fields={[
              { label: 'Owner Identity', value: `${b.name} Owners Association` },
              { label: 'Mobile', value: '+91 XXXXX 41209' },
              { label: 'Record of Rights', value: 'RoR 2026 · Vol 12' },
              { label: 'Property Tax', value: 'Paid · FY 2026-27' },
            ]}
            columns={2}
          />
          <p className="flex items-start gap-1.5 text-[11px] text-ink-soft mt-3">
            <Info size={12} className="mt-0.5 shrink-0" />
            Demonstration data only — this build is not linked to Aadhaar or DigiLocker.
          </p>
        </div>

        <div className="mt-3">
          <MapInset ulpin={b.baseUlpin} />
        </div>

        <div className="flex gap-2.5 mt-3">
          <button
            onClick={() => navigate(`/portal/passport/${b.units[0]?.id || 'unit-2'}`)}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#8B6508] text-white text-xs font-bold rounded-[10px] px-3 py-2.5 hover:bg-[#6D4F05] shadow-xs"
          >
            <ShieldCheck size={15} /> Official UPC Certificate &amp; Deed
          </button>
          <button
            onClick={() => navigate(`/portal/building/${b.id}/3d`)}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-surface border border-line text-ink text-xs font-bold rounded-[10px] px-3 py-2.5 hover:bg-neutralbg"
          >
            <Box size={15} /> View Building 3D
          </button>
        </div>

        <div className="bg-surface border border-line rounded-[12px] p-4 mt-3">
          <h3 className="text-sm font-bold text-ink mb-1">
            Units under this parcel ({b.units.length})
          </h3>
          {b.units.map((u, i) => (
            <MiniRow
              key={u.id}
              icon={<Building2 size={15} />}
              title={u.unitLabel}
              subtitle={`Floor ${u.floor} · ${u.owner} · ${u.area} m²`}
              pill={
                <StatusPill variant={u.status === 'verified' ? 'verified' : 'review'}>
                  {u.status}
                </StatusPill>
              }
              onClick={() => navigate(`/portal/passport/${u.id}`)}
              last={i === b.units.length - 1}
            />
          ))}
        </div>
      </TicketCard>
      <span className="hidden"><ChevronRight /></span>
    </div>
  )
}