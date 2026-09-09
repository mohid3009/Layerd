import { Link, useNavigate, useParams } from 'react-router-dom'
import { Building2, ChevronRight, Box, Info } from 'lucide-react'
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

        <button
          onClick={() => navigate(`/portal/building/${b.id}/3d`)}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-surface border border-line text-ink text-sm font-semibold rounded-[10px] px-4 py-2.5 hover:bg-neutralbg"
        >
          <Box size={15} /> View Full Building in 3D
        </button>

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